const express = require("express");
const {
  createProduct,
  deactivateProduct,
  findProductById,
  listProducts,
  updateProduct,
} = require("../db");
const { requireAuth } = require("../middleware/requireAuth");
const { asyncHandler } = require("../utils/http");
const { normalizeBoolean, validateProductInput } = require("../utils/validation");

const router = express.Router();

function requireAdmin(req, res) {
  if (!req.auth?.isAdminAccount) {
    res.status(403).json({
      ok: false,
      message: "Ehhez admin jogosultsag kell.",
    });
    return false;
  }

  return true;
}

function normalizeProductPayload(body) {
  return {
    name: String(body?.name ?? "").trim(),
    price: Number(body?.price),
    category: String(body?.category ?? "").trim(),
    image: String(body?.image ?? "").trim(),
    description: String(body?.description ?? "").trim(),
    isNew: normalizeBoolean(body?.isNew),
    stockQuantity: Number(body?.stockQuantity),
    active: body?.active === undefined ? true : normalizeBoolean(body?.active),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await listProducts();
    res.json({
      ok: true,
      products,
    });
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const payload = normalizeProductPayload(req.body);
    const validationError = validateProductInput(payload);
    if (validationError) {
      res.status(400).json({ ok: false, message: validationError });
      return;
    }

    const product = await createProduct(payload);
    res.status(201).json({
      ok: true,
      message: "Termek letrehozva.",
      product,
    });
  }),
);

router.patch(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const existing = await findProductById(req.params.productId, {
      includeInactive: true,
    });
    if (!existing) {
      res.status(404).json({
        ok: false,
        message: "A termek nem talalhato.",
      });
      return;
    }

    const payload = normalizeProductPayload({
      ...existing,
      ...req.body,
    });
    const validationError = validateProductInput(payload);
    if (validationError) {
      res.status(400).json({ ok: false, message: validationError });
      return;
    }

    const product = await updateProduct(req.params.productId, payload);
    res.json({
      ok: true,
      message: "Termek frissitve.",
      product,
    });
  }),
);

router.delete(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const existing = await findProductById(req.params.productId, {
      includeInactive: true,
    });
    if (!existing) {
      res.status(404).json({
        ok: false,
        message: "A termek nem talalhato.",
      });
      return;
    }

    await deactivateProduct(req.params.productId);
    res.json({
      ok: true,
      message: "Termek torolve.",
    });
  }),
);

module.exports = router;
