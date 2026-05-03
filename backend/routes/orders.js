const express = require("express");
const { config } = require("../config");
const { isPaymentMethodAllowedForShipping } = require("../constants/commerce");
const {
  createOrderFromCart,
  findPaymentMethodByIdForUser,
  getOrderById,
  listAllOrders,
  listOrdersForUser,
  recordOrderFulfillmentEvent,
} = require("../db");
const { requireAuth } = require("../middleware/requireAuth");
const {
  sendOrderStatusEmail,
} = require("../services/orderEmails");
const {
  ensureInvoiceForOrder,
  startHostedPaymentForOrder,
} = require("../services/orderIntegrations");
const { asyncHandler } = require("../utils/http");
const {
  normalizeAddress,
  normalizeEmail,
  normalizePhone,
  validateAddress,
  validateEmail,
  validatePaymentMethod,
  validateShippingMethod,
  validatePhone,
} = require("../utils/validation");

const router = express.Router();
const FULFILLMENT_EVENTS = new Set([
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

function getOwner(req) {
  return {
    userType: req.auth?.isAdminAccount ? "admin" : "user",
    userId: req.auth?.isAdminAccount ? "admin" : String(req.auth.sub),
  };
}

function requireAdmin(req, res) {
  if (!req.auth?.isAdminAccount) {
    res.status(403).json({
      ok: false,
      message: "Ehhez admin jogosultság kell.",
    });
    return false;
  }

  return true;
}

function isAutomationRequestAuthorized(req) {
  return Boolean(config.orderAutomationSecret) &&
    req.headers["x-serona-automation-secret"] === config.orderAutomationSecret;
}

function requireAutomationOrAdmin(req, res, next) {
  if (isAutomationRequestAuthorized(req)) {
    req.fulfillmentAutomation = true;
    next();
    return;
  }

  requireAuth(req, res, () => {
    if (!requireAdmin(req, res)) {
      return;
    }

    next();
  });
}

router.get(
  "/my",
  requireAuth,
  asyncHandler(async (req, res) => {
    const owner = getOwner(req);
    const orders = await listOrdersForUser(owner.userType, owner.userId);
    res.json({
      ok: true,
      orders,
    });
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const owner = getOwner(req);
    const shipping = normalizeAddress(req.body?.shipping);
    const billing = normalizeAddress(req.body?.billing);
    const contactEmail = normalizeEmail(req.body?.contactEmail);
    const contactPhone = normalizePhone(req.body?.contactPhone);
    const paymentMethod = String(req.body?.paymentMethod ?? "").trim();
    const shippingMethod = String(req.body?.shippingMethod ?? "").trim();
    const couponCode = String(req.body?.couponCode ?? "").trim();
    const savedPaymentMethodId = String(
      req.body?.savedPaymentMethodId ?? "",
    ).trim();

    const emailError = validateEmail(contactEmail);
    if (emailError) {
      res.status(400).json({ ok: false, message: emailError });
      return;
    }

    const phoneError = validatePhone(contactPhone);
    if (phoneError) {
      res.status(400).json({ ok: false, message: phoneError });
      return;
    }

    const shippingError = validateAddress(shipping, "szállítási cím");
    if (shippingError) {
      res.status(400).json({ ok: false, message: shippingError });
      return;
    }

    const billingError = validateAddress(billing, "számlázási cím");
    if (billingError) {
      res.status(400).json({ ok: false, message: billingError });
      return;
    }

    const paymentMethodError = validatePaymentMethod(paymentMethod);
    if (paymentMethodError) {
      res.status(400).json({ ok: false, message: paymentMethodError });
      return;
    }

    const shippingMethodError = validateShippingMethod(shippingMethod);
    if (shippingMethodError) {
      res.status(400).json({ ok: false, message: shippingMethodError });
      return;
    }

    if (!isPaymentMethodAllowedForShipping(paymentMethod, shippingMethod)) {
      res.status(400).json({
        ok: false,
        message: "A választott fizetési mód ehhez a szállítási módhoz nem használható.",
      });
      return;
    }

    const requiresSavedPaymentMethod =
      paymentMethod === "card" && config.paymentMode !== "redirect";

    if (requiresSavedPaymentMethod) {
      if (!savedPaymentMethodId) {
        res.status(400).json({
          ok: false,
          message:
            "Bankkártyás fizetéshez válassz egy mentett, tokenizált fizetési módot.",
        });
        return;
      }

      const savedPaymentMethod = await findPaymentMethodByIdForUser(
        owner.userId,
        savedPaymentMethodId,
      );

      if (!savedPaymentMethod || savedPaymentMethod.status !== "active") {
        res.status(404).json({
          ok: false,
          message: "A kiválasztott fizetési mód nem található vagy már nem aktív.",
        });
        return;
      }
    }

    if (
      paymentMethod === "card" &&
      config.paymentProvider === "barion" &&
      !config.barionEnabled
    ) {
      res.status(503).json({
        ok: false,
        message:
          "A Barion online fizetés még nincs készre konfigurálva a szerveren.",
      });
      return;
    }

    try {
      const order = await createOrderFromCart(owner.userType, owner.userId, {
        shipping,
        billing,
        contactEmail,
        contactPhone,
        paymentMethod,
        shippingMethod,
        couponCode,
      });

      let paymentSession = null;

      if (paymentMethod === "card" && config.paymentProvider === "barion") {
        try {
          const paymentResult = await startHostedPaymentForOrder(order);
          paymentSession = paymentResult?.paymentSession ?? null;
        } catch (paymentError) {
          console.error("A Barion fizetési session indítása sikertelen volt.", paymentError);
          const cancelledOrder = await recordOrderFulfillmentEvent(order.id, {
            event: "cancelled",
            occurredAt: new Date().toISOString(),
          });
          const barionMessage =
            paymentError?.code === "BARION_API_ERROR"
              ? `Barion hiba: ${paymentError.message}`
              : paymentError?.code === "BARION_NOT_CONFIGURED"
                ? paymentError.message
                : "A Barion fizetést most nem sikerült elindítani.";
          res.status(502).json({
            ok: false,
            message: `${barionMessage} A rendelést automatikusan töröltük.`,
            order: cancelledOrder ?? order,
          });
          return;
        }
      }

      res.status(201).json({
        ok: true,
        message:
          paymentSession
            ? "A rendelést rögzítettük, átirányítunk a Barion fizetési felületére."
            : "Rendelés létrehozva.",
        order,
        ...(paymentSession ? { paymentSession } : {}),
      });
    } catch (error) {
      if (error?.code === "EMPTY_CART") {
        res.status(400).json({
          ok: false,
          message: "A kosár üres.",
        });
        return;
      }

      if (error?.code === "INSUFFICIENT_STOCK") {
        res.status(409).json({
          ok: false,
          message: "Az egyik termékből nincs elég készlet a rendeléshez.",
          productId: error.productId,
          availableQuantity: error.availableQuantity,
        });
        return;
      }

      if (error?.code === "PRODUCT_NOT_FOUND") {
        res.status(409).json({
          ok: false,
          message: "Az egyik termék már nem elérhető.",
          productId: error.productId,
        });
        return;
      }

      if (error?.code === "INVALID_SHIPPING_METHOD") {
        res.status(400).json({
          ok: false,
          message: "Érvénytelen szállítási mód.",
        });
        return;
      }

      if (error?.code === "INVALID_COUPON") {
        res.status(400).json({
          ok: false,
          message: error.message,
        });
        return;
      }

      throw error;
    }
  }),
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const orders = await listAllOrders();
    res.json({
      ok: true,
      orders,
    });
  }),
);

router.post(
  "/:orderId/fulfillment-event",
  requireAutomationOrAdmin,
  asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId ?? "").trim();
    if (!orderId) {
      res.status(400).json({
        ok: false,
        message: "Hiányzik a rendelés azonosítója.",
      });
      return;
    }

    const event = String(req.body?.event ?? "").trim();
    if (!FULFILLMENT_EVENTS.has(event)) {
      res.status(400).json({
        ok: false,
        message: "Érvénytelen fulfillment esemény.",
      });
      return;
    }

    try {
      const before = await getOrderById(orderId);
      const order = await recordOrderFulfillmentEvent(orderId, {
        event,
        trackingNumber: req.body?.trackingNumber,
        occurredAt: req.body?.occurredAt,
      });

      if (!order) {
        res.status(404).json({
          ok: false,
          message: "A rendelés nem található.",
        });
        return;
      }

      res.json({
        ok: true,
        message: "A fulfillment eseményt rögzítettük.",
        order,
      });

      try {
        const statusChanged =
          before?.status !== order.status ||
          before?.trackingNumber !== order.trackingNumber;

        if (event === "confirmed") {
          await ensureInvoiceForOrder(order);
        }

        if (statusChanged) {
          await sendOrderStatusEmail({
            to: order.contactEmail,
            username: order.shipping?.fullName || order.contactEmail,
            order,
            event,
          });
        }
      } catch (integrationError) {
        console.error(
          "A rendelés utófeldolgozása sikertelen volt.",
          integrationError,
        );
      }
    } catch (error) {
      if (error?.code === "INVALID_EVENT_TIMESTAMP") {
        res.status(400).json({
          ok: false,
          message: "Érvénytelen eseménydátum.",
        });
        return;
      }

      if (error?.code === "TRACKING_NUMBER_REQUIRED") {
        res.status(400).json({
          ok: false,
          message: "Feladott vagy kézbesített rendeléshez kötelező a csomagszám.",
        });
        return;
      }

      if (error?.code === "INVALID_STATUS_TRANSITION") {
        res.status(409).json({
          ok: false,
          message: error.message,
        });
        return;
      }

      throw error;
    }
  }),
);

module.exports = router;
