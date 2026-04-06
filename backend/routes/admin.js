const express = require("express");
const { config } = require("../config");
const {
  createCoupon,
  deactivateCoupon,
  findCouponById,
  getOrderById,
  listAllOrders,
  listCoupons,
  listProducts,
  updateCoupon,
} = require("../db");
const { SHIPPING_METHOD_IDS, normalizeCouponCode } = require("../constants/commerce");
const { requireAuth } = require("../middleware/requireAuth");
const { createGlsShipmentForOrder, isGlsConfigured } = require("../services/shipments");
const { asyncHandler } = require("../utils/http");

const router = express.Router();

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

function startOfTodayIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function startOfLocalDay(dateLike) {
  const date = new Date(dateLike);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(dateLike) {
  const date = startOfLocalDay(dateLike);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function buildSalesSeries(orders, days = 7) {
  const formatter = new Intl.DateTimeFormat("hu-HU", {
    month: "2-digit",
    day: "2-digit",
  });
  const today = startOfLocalDay(new Date());
  const series = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - offset);
    series.push({
      key: dayKey(current),
      date: current.toISOString(),
      label: formatter.format(current),
      orderCount: 0,
      orderValue: 0,
    });
  }

  const seriesByKey = new Map(series.map((entry) => [entry.key, entry]));
  for (const order of orders) {
    const target = seriesByKey.get(dayKey(order.createdAt));
    if (!target) continue;
    target.orderCount += 1;
    if (order.status !== "cancelled") {
      target.orderValue += order.total;
    }
  }

  return series.map(({ key, ...entry }) => entry);
}

function normalizeCouponPayload(body) {
  return {
    code: normalizeCouponCode(body?.code),
    label: String(body?.label ?? "").trim(),
    description: String(body?.description ?? "").trim(),
    type: String(body?.type ?? "").trim(),
    percent:
      body?.percent === "" || body?.percent === null || body?.percent === undefined
        ? null
        : Number(body.percent),
    amount:
      body?.amount === "" || body?.amount === null || body?.amount === undefined
        ? null
        : Number(body.amount),
    minSubtotal:
      body?.minSubtotal === "" || body?.minSubtotal === null || body?.minSubtotal === undefined
        ? 0
        : Number(body.minSubtotal),
    maxDiscount:
      body?.maxDiscount === "" || body?.maxDiscount === null || body?.maxDiscount === undefined
        ? null
        : Number(body.maxDiscount),
    appliesToShippingMethods: Array.isArray(body?.appliesToShippingMethods)
      ? body.appliesToShippingMethods
          .map((methodId) => String(methodId ?? "").trim())
          .filter((methodId) => SHIPPING_METHOD_IDS.has(methodId))
      : [],
    active: body?.active !== false,
  };
}

function validateCouponPayload(payload) {
  if (!payload.code || !/^[A-Z0-9_-]{3,24}$/.test(payload.code)) {
    return "A kuponkód 3-24 karakter hosszú legyen, és csak nagybetűt, számot, kötőjelet vagy aláhúzást tartalmazhat.";
  }

  if (!payload.label || payload.label.length < 3) {
    return "Adj meg egy legalább 3 karakteres kuponnevet.";
  }

  if (!payload.description || payload.description.length < 8) {
    return "Adj meg egy részletesebb kuponleírást.";
  }

  if (!["percent", "fixed", "shipping"].includes(payload.type)) {
    return "Érvénytelen kupon típus.";
  }

  if (!Number.isFinite(payload.minSubtotal) || payload.minSubtotal < 0) {
    return "A minimum kosárérték nem lehet negatív.";
  }

  if (payload.maxDiscount !== null && (!Number.isFinite(payload.maxDiscount) || payload.maxDiscount < 0)) {
    return "A maximális kedvezmény nem lehet negatív.";
  }

  if (payload.type === "percent") {
    if (!Number.isFinite(payload.percent) || payload.percent <= 0 || payload.percent > 100) {
      return "Százalékos kuponnál 1 és 100 közötti kedvezményt adj meg.";
    }
  }

  if (payload.type === "fixed") {
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return "Fix összegű kuponnál adj meg pozitív kedvezményösszeget.";
    }
  }

  return null;
}

function isDuplicateCouponCodeError(error) {
  return (
    error?.code === "23505" ||
    error?.code === "SQLITE_CONSTRAINT_UNIQUE" ||
    error?.code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
    String(error?.message ?? "").toLowerCase().includes("coupons_code_lower_idx")
  );
}

router.get(
  "/dashboard",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const [orders, products] = await Promise.all([
      listAllOrders(),
      listProducts({ includeInactive: true }),
    ]);

    const todayIso = startOfTodayIso();
    const activeOrders = orders.filter(
      (order) => order.status !== "delivered" && order.status !== "cancelled",
    );
    const todayOrders = orders.filter((order) => order.createdAt >= todayIso);
    const deliveredRevenue = orders
      .filter((order) => order.status === "delivered")
      .reduce((sum, order) => sum + order.total, 0);
    const pendingTransferTotal = orders
      .filter(
        (order) =>
          order.paymentMethod === "transfer" &&
          ["pending", "confirmed", "processing"].includes(order.status),
      )
      .reduce((sum, order) => sum + order.total, 0);

    const lowStockProducts = products
      .filter((product) => product.active !== false)
      .filter((product) => product.availableQuantity <= config.lowStockThreshold)
      .sort(
        (left, right) =>
          (left.availableQuantity ?? left.stockQuantity) -
          (right.availableQuantity ?? right.stockQuantity),
      )
      .slice(0, 8)
      .map((product) => ({
        id: product.id,
        name: product.name,
        stockQuantity: product.stockQuantity,
        reservedQuantity: product.reservedQuantity ?? 0,
        availableQuantity: product.availableQuantity ?? product.stockQuantity,
      }));

    const productStats = new Map();
    for (const order of orders) {
      if (order.status === "cancelled") continue;
      for (const item of order.items) {
        const current = productStats.get(item.name) ?? {
          name: item.name,
          quantitySold: 0,
          revenue: 0,
        };
        current.quantitySold += item.quantity;
        current.revenue += item.lineTotal;
        productStats.set(item.name, current);
      }
    }

    const topProducts = Array.from(productStats.values())
      .sort((left, right) => right.quantitySold - left.quantitySold)
      .slice(0, 5);

    res.json({
      ok: true,
      summary: {
        totals: {
          orderCount: orders.length,
          todayOrderCount: todayOrders.length,
          activeOrderCount: activeOrders.length,
          deliveredRevenue,
          pendingTransferTotal,
          lowStockCount: lowStockProducts.length,
        },
        lowStockThreshold: config.lowStockThreshold,
        lowStockProducts,
        topProducts,
        recentOrders: orders.slice(0, 6).map((order) => ({
          id: order.id,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          contactEmail: order.contactEmail,
          shippingMethod: order.shippingMethod,
        })),
        salesSeries: buildSalesSeries(orders, 7),
      },
    });
  }),
);

router.get(
  "/coupons",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const coupons = await listCoupons();
    res.json({
      ok: true,
      coupons,
    });
  }),
);

router.post(
  "/coupons",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const payload = normalizeCouponPayload(req.body);
    const validationError = validateCouponPayload(payload);
    if (validationError) {
      res.status(400).json({ ok: false, message: validationError });
      return;
    }

    try {
      const coupon = await createCoupon(payload);
      res.status(201).json({
        ok: true,
        message: "A kupon létrehozva.",
        coupon,
      });
    } catch (error) {
      if (isDuplicateCouponCodeError(error)) {
        res.status(409).json({
          ok: false,
          message: "Ez a kuponkód már létezik.",
        });
        return;
      }

      throw error;
    }
  }),
);

router.patch(
  "/coupons/:couponId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const existing = await findCouponById(req.params.couponId);
    if (!existing) {
      res.status(404).json({
        ok: false,
        message: "A kupon nem található.",
      });
      return;
    }

    const payload = normalizeCouponPayload({
      ...existing,
      ...req.body,
    });
    const validationError = validateCouponPayload(payload);
    if (validationError) {
      res.status(400).json({ ok: false, message: validationError });
      return;
    }

    try {
      const coupon = await updateCoupon(req.params.couponId, payload);
      res.json({
        ok: true,
        message: "A kupon frissítve.",
        coupon,
      });
    } catch (error) {
      if (isDuplicateCouponCodeError(error)) {
        res.status(409).json({
          ok: false,
          message: "Ez a kuponkód már létezik.",
        });
        return;
      }

      throw error;
    }
  }),
);

router.delete(
  "/coupons/:couponId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const existing = await findCouponById(req.params.couponId);
    if (!existing) {
      res.status(404).json({
        ok: false,
        message: "A kupon nem található.",
      });
      return;
    }

    await deactivateCoupon(req.params.couponId);
    res.json({
      ok: true,
      message: "A kupon inaktiválva lett.",
    });
  }),
);

router.post(
  "/orders/:orderId/shipment/gls",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const order = await getOrderById(req.params.orderId);
    if (!order) {
      res.status(404).json({
        ok: false,
        message: "A rendelés nem található.",
      });
      return;
    }

    try {
      const shipment = await createGlsShipmentForOrder(order);
      res.json({
        ok: true,
        shipment,
      });
    } catch (error) {
      const code =
        error?.code === "GLS_NOT_CONFIGURED" || error?.code === "GLS_IMPLEMENTATION_PENDING"
          ? 400
          : 500;
      res.status(code).json({
        ok: false,
        message: error.message || "A GLS shipment létrehozása sikertelen.",
        glsConfigured: isGlsConfigured(),
        ...(error?.details ? { details: error.details } : {}),
      });
    }
  }),
);

module.exports = router;
