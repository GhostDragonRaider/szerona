const express = require("express");
const { getOrderById } = require("../db");
const { requireAuth } = require("../middleware/requireAuth");
const { asyncHandler } = require("../utils/http");
const { syncBarionOrderPayment } = require("../services/orderIntegrations");

const router = express.Router();

function canAccessOrder(req, order) {
  if (!order) return false;
  if (req.auth?.isAdminAccount) return true;
  return order.userType === "user" && String(order.userId) === String(req.auth?.sub);
}

router.post(
  "/barion/finalize",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orderId = String(req.body?.orderId ?? "").trim();
    const paymentId = String(req.body?.paymentId ?? "").trim();

    if (!orderId || !paymentId) {
      res.status(400).json({
        ok: false,
        message: "Hiányzik a rendelés vagy a fizetés azonosítója.",
      });
      return;
    }

    const existingOrder = await getOrderById(orderId);
    if (!canAccessOrder(req, existingOrder)) {
      res.status(403).json({
        ok: false,
        message: "Ehhez a rendeléshez nincs hozzáférésed.",
      });
      return;
    }

    const result = await syncBarionOrderPayment({ orderId, paymentId });

    res.json({
      ok: true,
      message: "A Barion fizetés állapota frissítve.",
      order: result.order,
      paymentState: result.paymentState,
    });
  }),
);

router.all(
  "/barion/callback",
  asyncHandler(async (req, res) => {
    const paymentId = String(
      req.query?.paymentId ?? req.body?.paymentId ?? "",
    ).trim();
    const orderId = String(req.query?.orderId ?? req.body?.orderId ?? "").trim();

    if (!paymentId) {
      res.status(400).json({
        ok: false,
        message: "Hiányzik a paymentId.",
      });
      return;
    }

    try {
      const result = await syncBarionOrderPayment({
        orderId: orderId || null,
        paymentId,
      });

      res.json({
        ok: true,
        orderId: result.order?.id ?? orderId ?? null,
        status: result.paymentState.status,
      });
    } catch (error) {
      console.error("Barion callback feldolgozási hiba.", error);
      res.status(500).json({
        ok: false,
        message: "A Barion callback feldolgozása sikertelen volt.",
      });
    }
  }),
);

module.exports = router;
