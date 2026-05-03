const express = require("express");
const {
  createContactMessage,
  getContactSettings,
  validateContactMessage,
} = require("../services/contactStore");
const { asyncHandler } = require("../utils/http");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      ok: true,
      contact: getContactSettings(),
    });
  }),
);

router.post(
  "/messages",
  asyncHandler(async (req, res) => {
    const payload = {
      name: String(req.body?.name ?? "").trim(),
      email: String(req.body?.email ?? "").trim().toLowerCase(),
      message: String(req.body?.message ?? "").trim(),
    };
    const validationError = validateContactMessage(payload);
    if (validationError) {
      res.status(400).json({ ok: false, message: validationError });
      return;
    }

    const contactMessage = createContactMessage(payload);
    res.status(201).json({
      ok: true,
      message: "Köszönjük, az üzenetet rögzítettük.",
      contactMessage,
    });
  }),
);

module.exports = router;
