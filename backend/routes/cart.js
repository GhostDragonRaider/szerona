const express = require("express");
const { clearCart, getCart, saveCart } = require("../db");
const { requireAuth } = require("../middleware/requireAuth");
const { asyncHandler } = require("../utils/http");

const router = express.Router();

function getOwner(req) {
  return {
    userType: req.auth?.isAdminAccount ? "admin" : "user",
    userId: req.auth?.isAdminAccount ? "admin" : String(req.auth.sub),
  };
}

function parseLines(rawLines) {
  if (!Array.isArray(rawLines)) {
    return null;
  }

  const map = new Map();

  for (const line of rawLines) {
    const productId = String(line?.productId ?? "").trim();
    const quantity = Number(line?.quantity);

    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      return null;
    }

    map.set(productId, quantity);
  }

  return Array.from(map.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const owner = getOwner(req);
    const cart = await getCart(owner.userType, owner.userId);
    res.json({
      ok: true,
      cart,
    });
  }),
);

router.put(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const lines = parseLines(req.body?.lines);
    if (!lines) {
      res.status(400).json({
        ok: false,
        message: "A kosar tartalma ervenytelen.",
      });
      return;
    }

    const owner = getOwner(req);

    try {
      const cart = await saveCart(
        owner.userType,
        owner.userId,
        lines,
        Number(req.body?.reservationMinutes) > 0
          ? Number(req.body.reservationMinutes)
          : require("../config").config.cartReservationMinutes,
      );

      res.json({
        ok: true,
        message: "Kosar frissitve.",
        cart,
      });
    } catch (error) {
      if (error?.code === "INSUFFICIENT_STOCK") {
        res.status(409).json({
          ok: false,
          message: "Az egyik termekbol nincs eleg keszlet.",
          productId: error.productId,
          availableQuantity: error.availableQuantity,
        });
        return;
      }

      if (error?.code === "PRODUCT_NOT_FOUND") {
        res.status(404).json({
          ok: false,
          message: "Az egyik termek mar nem elerheto.",
          productId: error.productId,
        });
        return;
      }

      throw error;
    }
  }),
);

router.delete(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const owner = getOwner(req);
    const cart = await clearCart(owner.userType, owner.userId);
    res.json({
      ok: true,
      message: "Kosar uritve.",
      cart,
    });
  }),
);

module.exports = router;
