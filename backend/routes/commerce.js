const express = require("express");
const { config } = require("../config");
const {
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  buildOrderPricing,
  listCouponSummaries,
} = require("../constants/commerce");
const { getCart, listCoupons } = require("../db");
const { requireAuth } = require("../middleware/requireAuth");
const { asyncHandler } = require("../utils/http");

const router = express.Router();

router.get("/options", asyncHandler(async (req, res) => {
  const coupons = await listCoupons({ activeOnly: true });
  res.json({
    ok: true,
    commerce: {
      paymentMethods: PAYMENT_METHODS,
      shippingMethods: SHIPPING_METHODS,
      coupons: listCouponSummaries(coupons),
      transfer: {
        bankAccountHolder: config.transferBankAccountHolder,
        bankAccountNumber: config.transferBankAccountNumber,
        bankName: config.transferBankName,
        paymentDueDays: config.transferPaymentDueDays,
      },
    },
  });
}));

router.post("/quote", requireAuth, asyncHandler(async (req, res) => {
  try {
    const userType = req.auth?.isAdminAccount ? "admin" : "user";
    const userId = req.auth?.isAdminAccount ? "admin" : String(req.auth?.sub);
    const shippingMethodId = String(req.body?.shippingMethod ?? "").trim();
    const couponCode = String(req.body?.couponCode ?? "").trim();
    const cart = await getCart(userType, userId);
    const subtotal = cart.totalPrice;
    const coupons = await listCoupons({ activeOnly: true });
    const pricing = buildOrderPricing({
      subtotal,
      shippingMethodId,
      couponCode,
      coupons,
    });

    res.json({
      ok: true,
      quote: {
        subtotal,
        shippingPrice: pricing.shippingPrice,
        discountAmount: pricing.discountAmount,
        discountCode: pricing.discountCode,
        total: pricing.total,
        coupon: pricing.coupon,
        couponMessage: pricing.couponMessage,
      },
    });
  } catch (error) {
    if (error?.code === "INVALID_SHIPPING_METHOD" || error?.code === "INVALID_COUPON") {
      res.status(400).json({
        ok: false,
        message: error.message,
      });
      return;
    }

    throw error;
  }
}));

module.exports = router;
