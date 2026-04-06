const express = require("express");
const { config } = require("../config");
const {
  createPaymentMethodForUser,
  findPaymentMethodByIdForUser,
  findUserById,
  getUserProfile,
  listPaymentMethodsForUser,
  removePaymentMethodForUser,
  setDefaultPaymentMethodForUser,
  updateUserProfile,
} = require("../db");
const { requireAuth } = require("../middleware/requireAuth");
const { asyncHandler } = require("../utils/http");
const {
  normalizeAddress,
  validateAddress,
  validateDisplayName,
} = require("../utils/validation");
const { buildApiUser } = require("../utils/users");
const { signAccessToken } = require("../utils/tokens");

const router = express.Router();

function ensureRegularUser(req, res) {
  if (req.auth?.isAdminAccount) {
    res.status(400).json({
      ok: false,
      message: "Az admin fiókhoz ez a végpont nem használható.",
    });
    return false;
  }

  return true;
}

function getPaymentGatewayConfig() {
  return {
    provider: config.paymentProvider,
    mode: "tokenized",
    readyForClientSetup:
      config.paymentProvider !== "none" && Boolean(config.paymentPublicKey),
    supportsSavedCards: true,
  };
}

function normalizePaymentMethodInput(body) {
  const providerCustomerId = String(body?.providerCustomerId ?? "").trim();
  const funding = String(body?.funding ?? "").trim();
  const fingerprint = String(body?.fingerprint ?? "").trim();

  return {
    provider: String(body?.provider ?? "").trim().toLowerCase(),
    providerCustomerId: providerCustomerId || null,
    providerMethodId: String(body?.providerMethodId ?? "").trim(),
    holderName: String(body?.holderName ?? "").trim(),
    brand: String(body?.brand ?? "").trim(),
    last4: String(body?.last4 ?? "")
      .replace(/\D/g, "")
      .slice(-4),
    expiryMonth: String(body?.expiryMonth ?? "")
      .replace(/\D/g, "")
      .padStart(2, "0")
      .slice(-2),
    expiryYear: String(body?.expiryYear ?? "")
      .replace(/\D/g, "")
      .slice(0, 4),
    funding,
    fingerprint,
    isDefault: body?.isDefault === true || body?.isDefault === "true",
  };
}

function validatePaymentMethodInput(input, rawBody) {
  if (rawBody?.cardNumber || rawBody?.pan || rawBody?.cvc || rawBody?.cvv) {
    return "Valódi kártyaadat nem tárolható. Csak tokenizált szolgáltatói azonosító rögzítése engedélyezett.";
  }

  if (!["stripe", "barion", "simplepay", "custom"].includes(input.provider)) {
    return "Érvénytelen fizetési szolgáltató.";
  }

  if (
    input.providerMethodId.length < 3 ||
    input.providerMethodId.length > 255
  ) {
    return "Add meg a szolgáltatói fizetési mód azonosítóját.";
  }

  if (
    input.providerCustomerId &&
    (input.providerCustomerId.length < 3 || input.providerCustomerId.length > 255)
  ) {
    return "A szolgáltatói ügyfél-azonosító érvénytelen.";
  }

  if (!input.holderName || input.holderName.length > 120) {
    return "Add meg a kártyabirtokos nevét.";
  }

  if (!input.brand || input.brand.length > 40) {
    return "Add meg a kártyatársaság nevét.";
  }

  if (!/^\d{4}$/.test(input.last4)) {
    return "A kártya utolsó 4 számjegye érvénytelen.";
  }

  if (!/^(0[1-9]|1[0-2])$/.test(input.expiryMonth)) {
    return "A lejárati hónap érvénytelen.";
  }

  if (!/^\d{2}(\d{2})?$/.test(input.expiryYear)) {
    return "A lejárati év érvénytelen.";
  }

  if (input.funding.length > 40) {
    return "A kártya típusa túl hosszú.";
  }

  if (input.fingerprint.length > 255) {
    return "A kártya ujjlenyomat-azonosítója túl hosszú.";
  }

  return null;
}

router.get(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!ensureRegularUser(req, res)) return;

    const userRow = await findUserById(req.auth.sub);
    if (!userRow) {
      res.status(404).json({
        ok: false,
        message: "A felhasznalo nem talalhato.",
      });
      return;
    }

    const profile = await getUserProfile(req.auth.sub, userRow.username);
    const user = buildApiUser(userRow, profile);

    res.json({
      ok: true,
      user,
      token: signAccessToken(user, req.authSession.id, false),
    });
  }),
);

router.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!ensureRegularUser(req, res)) return;

    const userRow = await findUserById(req.auth.sub);
    if (!userRow) {
      res.status(404).json({
        ok: false,
        message: "A felhasznalo nem talalhato.",
      });
      return;
    }

    const displayName =
      req.body?.displayName === undefined
        ? undefined
        : String(req.body.displayName).trim();
    const billing =
      req.body?.billing === undefined ? undefined : normalizeAddress(req.body.billing);

    const displayNameError =
      displayName === undefined ? null : validateDisplayName(displayName);
    if (displayNameError) {
      res.status(400).json({ ok: false, message: displayNameError });
      return;
    }

    const billingError =
      billing === undefined
        ? null
        : validateAddress(billing, "szamlazasi cim", { optional: true });
    if (billingError) {
      res.status(400).json({ ok: false, message: billingError });
      return;
    }

    const profile = await updateUserProfile(req.auth.sub, {
      displayName,
      billing,
    });
    const user = buildApiUser(userRow, profile);

    res.json({
      ok: true,
      message: "Profil adatok mentve.",
      user,
      token: signAccessToken(user, req.authSession.id, false),
    });
  }),
);

router.get(
  "/payment-methods",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!ensureRegularUser(req, res)) return;

    const paymentMethods = await listPaymentMethodsForUser(req.auth.sub);

    res.json({
      ok: true,
      paymentMethods,
      gateway: getPaymentGatewayConfig(),
    });
  }),
);

router.post(
  "/payment-methods",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!ensureRegularUser(req, res)) return;

    const input = normalizePaymentMethodInput(req.body);
    const validationError = validatePaymentMethodInput(input, req.body);
    if (validationError) {
      res.status(400).json({ ok: false, message: validationError });
      return;
    }

    try {
      const paymentMethod = await createPaymentMethodForUser(req.auth.sub, input);

      res.status(201).json({
        ok: true,
        message: "A tokenizált fizetési mód elmentve.",
        paymentMethod,
        gateway: getPaymentGatewayConfig(),
      });
    } catch (error) {
      if (error?.code === "PAYMENT_METHOD_ALREADY_LINKED") {
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

router.patch(
  "/payment-methods/:paymentMethodId/default",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!ensureRegularUser(req, res)) return;

    const paymentMethodId = String(req.params.paymentMethodId ?? "").trim();
    if (!paymentMethodId) {
        res.status(400).json({
          ok: false,
          message: "Hiányzik a fizetési mód azonosítója.",
        });
      return;
    }

    const paymentMethod = await setDefaultPaymentMethodForUser(
      req.auth.sub,
      paymentMethodId,
    );

    if (!paymentMethod) {
      res.status(404).json({
        ok: false,
        message: "A fizetési mód nem található.",
      });
      return;
    }

    res.json({
      ok: true,
      message: "Alapértelmezett fizetési mód frissítve.",
      paymentMethod,
    });
  }),
);

router.delete(
  "/payment-methods/:paymentMethodId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!ensureRegularUser(req, res)) return;

    const paymentMethodId = String(req.params.paymentMethodId ?? "").trim();
    if (!paymentMethodId) {
        res.status(400).json({
          ok: false,
          message: "Hiányzik a fizetési mód azonosítója.",
        });
      return;
    }

    const paymentMethod = await findPaymentMethodByIdForUser(
      req.auth.sub,
      paymentMethodId,
    );

    if (!paymentMethod || paymentMethod.status === "revoked") {
      res.status(404).json({
        ok: false,
        message: "A fizetési mód nem található.",
      });
      return;
    }

    await removePaymentMethodForUser(req.auth.sub, paymentMethodId);

    res.json({
      ok: true,
      message: "A fizetési mód eltávolítva.",
    });
  }),
);

module.exports = router;
