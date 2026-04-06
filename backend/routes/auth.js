const bcrypt = require("bcryptjs");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { TERMS_VERSION, PRIVACY_VERSION } = require("../constants/legal");
const { config } = require("../config");
const {
  addDays,
  addMinutes,
  clearEmailVerificationTokensForUser,
  clearPasswordResetTokensForUser,
  createEmailVerificationToken,
  createLegalAcceptance,
  createPasswordResetToken,
  createSession,
  createUser,
  emailExistsForOtherUser,
  findAdminByEmail,
  findAdminByIdentifier,
  findEmailVerificationToken,
  findPasswordResetToken,
  findUserByEmail,
  findUserById,
  findUserByIdentifier,
  findUserByUsernameOrEmail,
  findUserWithPasswordById,
  getAdminAccount,
  getSessionById,
  getUserProfile,
  isAdminEmail,
  markEmailVerificationUsed,
  markPasswordResetUsed,
  markUserEmailVerified,
  revokeSession,
  revokeUserSessions,
  rotateSessionRefreshToken,
  updateAdminContact,
  updateAdminPassword,
  updateUserEmail,
  updateUserPassword,
} = require("../db");
const { requireAuth } = require("../middleware/requireAuth");
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../services/authEmails");
const { canSendEmail } = require("../services/mailer");
const { asyncHandler } = require("../utils/http");
const { hashToken, safeEqual } = require("../utils/security");
const {
  buildRefreshToken,
  createResetToken,
  createSessionId,
  createVerificationToken,
  parseRefreshToken,
  signAccessToken,
} = require("../utils/tokens");
const {
  emptyOrTrimmed,
  normalizeBoolean,
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validatePassword,
  validatePhone,
  validateUsername,
} = require("../utils/validation");
const { buildAdminUser, buildApiUser } = require("../utils/users");
const {
  clearFailures,
  ensureNotLocked,
  registerFailure,
} = require("../utils/throttle");

const router = express.Router();

function passthroughLimiter(req, res, next) {
  next();
}

function createAuthLimiter(options) {
  if (config.relaxedAuthGuards) {
    return passthroughLimiter;
  }

  return rateLimit(options);
}

const loginLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: "Tul sok belepesi kiserlet. Probald meg kesobb.",
  },
});

const registerLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: "Tul sok regisztracios kiserlet. Probald meg kesobb.",
  },
});

const forgotPasswordLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: "Tul sok jelszo-visszaallitasi kiserlet. Probald meg kesobb.",
  },
});

const verificationLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: "Tul sok megerosito level kerese. Probald meg kesobb.",
  },
});

function getClientIp(req) {
  return (
    emptyOrTrimmed(req.ip) ||
    emptyOrTrimmed(req.headers["x-forwarded-for"]) ||
    "unknown"
  );
}

function getThrottleKeys(identifier, req) {
  return [
    { scope: "identifier", throttleKey: identifier.toLowerCase() },
    { scope: "ip", throttleKey: getClientIp(req) },
  ];
}

function getUserAgent(req) {
  return emptyOrTrimmed(req.headers["user-agent"]);
}

function buildResetUrl(token) {
  return `${config.frontendBaseUrl.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

function buildVerificationUrl(token) {
  return `${config.frontendBaseUrl.replace(/\/+$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
}

function shouldExposeDirectAuthLink(emailSent) {
  return config.nodeEnv !== "production" || !emailSent;
}

async function sendUserVerificationEmail({
  userId,
  email,
  username,
  purpose = "registration",
  sendEmail = canSendEmail(),
}) {
  const token = createVerificationToken();
  const tokenHash = hashToken(token);
  const expiresAt = addMinutes(
    new Date().toISOString(),
    config.emailVerificationMinutes,
  );

  if (purpose !== "registration") {
    await clearEmailVerificationTokensForUser("user", String(userId), purpose);
  }
  await createEmailVerificationToken({
    userType: "user",
    userId: String(userId),
    email,
    purpose,
    tokenHash,
    expiresAt,
  });

  const verificationUrl = buildVerificationUrl(token);
  let sent = false;
  let deliveryError = null;

  if (sendEmail) {
    try {
      await sendVerificationEmail({
        to: email,
        username,
        verificationUrl,
        expiresAt,
      });
      sent = true;
    } catch (error) {
      deliveryError = error;
    }
  }

  return {
    token,
    expiresAt,
    verificationUrl,
    sent,
    deliveryError,
  };
}

async function ensureLoginAllowed(identifier, req) {
  if (config.relaxedAuthGuards) {
    return;
  }

  const now = new Date().toISOString();
  for (const key of getThrottleKeys(identifier, req)) {
    await ensureNotLocked(key.scope, key.throttleKey, now);
  }
}

async function recordLoginFailure(identifier, req) {
  if (config.relaxedAuthGuards) {
    return;
  }

  const now = new Date().toISOString();
  for (const key of getThrottleKeys(identifier, req)) {
    await registerFailure(key.scope, key.throttleKey, now);
  }
}

async function clearLoginFailures(identifier, req) {
  if (config.relaxedAuthGuards) {
    return;
  }

  for (const key of getThrottleKeys(identifier, req)) {
    await clearFailures(key.scope, key.throttleKey);
  }
}

async function getHydratedUser(userId) {
  const userRow = await findUserById(userId);
  if (!userRow) return null;

  const profile = await getUserProfile(userId, userRow.username);
  return buildApiUser(userRow, profile);
}

async function authenticateAdminPassword(currentPassword) {
  const adminAccount = await getAdminAccount();
  if (!adminAccount) {
    throw new Error("Az admin fiok nem elerheto.");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    adminAccount.password_hash,
  );

  if (!passwordMatches) {
    return null;
  }

  return adminAccount;
}

async function issueSessionForUser({ user, userType, userId, isAdminAccount, req }) {
  const sessionId = createSessionId();
  const refreshToken = buildRefreshToken(sessionId);
  const refreshTokenHash = hashToken(refreshToken);
  const issuedAt = new Date().toISOString();
  const expiresAt = addDays(issuedAt, config.refreshTokenDays);

  await createSession({
    id: sessionId,
    userType,
    userId,
    refreshTokenHash,
    userAgent: getUserAgent(req),
    ipAddress: getClientIp(req),
    expiresAt,
  });

  return {
    token: signAccessToken(user, sessionId, isAdminAccount),
    refreshToken,
  };
}

async function rotateRefreshSession(session, user, isAdminAccount) {
  const refreshToken = buildRefreshToken(session.id);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = addDays(new Date().toISOString(), config.refreshTokenDays);

  await rotateSessionRefreshToken(session.id, refreshTokenHash, expiresAt);

  return {
    token: signAccessToken(user, session.id, isAdminAccount),
    refreshToken,
  };
}

router.post(
  "/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const username = emptyOrTrimmed(req.body?.username);
    const email = normalizeEmail(req.body?.email);
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const acceptTerms = normalizeBoolean(req.body?.acceptTerms);
    const acceptPrivacy = normalizeBoolean(req.body?.acceptPrivacy);

    const usernameError = validateUsername(username);
    if (usernameError) {
      res.status(400).json({ ok: false, message: usernameError });
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      res.status(400).json({ ok: false, message: emailError });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400).json({ ok: false, message: passwordError });
      return;
    }

    if (!acceptTerms || !acceptPrivacy) {
      res.status(400).json({
        ok: false,
        message:
          "A regisztraciohoz kotelezo elfogadni az Altalanos Szerzodesi Felteteleket es az adatkezelesi tajekoztatot.",
      });
      return;
    }

    const existingUser = await findUserByUsernameOrEmail(username, email);
    if (existingUser || (await isAdminEmail(email))) {
      res.status(409).json({
        ok: false,
        message: "A felhasznalonev vagy az e-mail cim mar foglalt.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const user = await createUser({
      username,
      email,
      passwordHash,
      role: "user",
    });

    const acceptanceContext = {
      userType: "user",
      userId: String(user.id),
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    await createLegalAcceptance({
      ...acceptanceContext,
      documentKey: "terms",
      documentVersion: TERMS_VERSION,
    });
    await createLegalAcceptance({
      ...acceptanceContext,
      documentKey: "privacy",
      documentVersion: PRIVACY_VERSION,
    });

    let verification = {
      enabled: true,
      sent: false,
      expiresAt: null,
      devVerificationUrl: null,
    };

    try {
      const result = await sendUserVerificationEmail({
        userId: user.id,
        email,
        username,
      });

      if (result.deliveryError) {
        console.error("A megerősítő e-mail küldése sikertelen volt.", result.deliveryError);
      }

      verification = {
        enabled: true,
        sent: result.sent,
        expiresAt: result.expiresAt,
        devVerificationUrl: shouldExposeDirectAuthLink(result.sent)
          ? result.verificationUrl
          : null,
      };
    } catch (error) {
      console.error("A megerősítő token létrehozása sikertelen volt.", error);
    }

    res.status(201).json({
      ok: true,
      message: verification.sent
        ? "Sikeres regisztráció. Kiküldtük a fiókmegerősítő e-mailt."
        : "Sikeres regisztráció. A fiók megerősítését a megjelenített linken tudod befejezni.",
      emailVerification: verification,
    });
  }),
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const identifier = emptyOrTrimmed(req.body?.username);
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!identifier || !password) {
      res.status(400).json({
        ok: false,
        message: "Add meg a felhasznalonevet es a jelszot.",
      });
      return;
    }

    await ensureLoginAllowed(identifier, req);

    const adminAccount = await findAdminByIdentifier(identifier);
    if (adminAccount) {
      const adminPasswordMatches = await bcrypt.compare(
        password,
        adminAccount.password_hash,
      );

      if (adminPasswordMatches) {
        const adminUser = buildAdminUser(adminAccount);
        const tokens = await issueSessionForUser({
          user: adminUser,
          userType: "admin",
          userId: "admin",
          isAdminAccount: true,
          req,
        });

        await clearLoginFailures(identifier, req);

        res.json({
          ok: true,
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          user: adminUser,
          emailVerification: {
            enabled: false,
          },
        });
        return;
      }
    }

    const userRow = await findUserByIdentifier(identifier);
    const passwordMatches = userRow
      ? await bcrypt.compare(password, userRow.password_hash)
      : false;

    if (!userRow || !passwordMatches) {
      await recordLoginFailure(identifier, req);
      res.status(401).json({
        ok: false,
        message: "Hibas felhasznalonev vagy jelszo.",
      });
      return;
    }

    if (!userRow.email_verified) {
      await clearLoginFailures(identifier, req);
      const response = {
        ok: false,
        message:
          "Az e-mail címed még nincs megerősítve. Kattints a kiküldött linkre, vagy kérj új megerősítő levelet.",
        verificationRequired: true,
        email: userRow.email,
      };

      if (!canSendEmail()) {
        const result = await sendUserVerificationEmail({
          userId: userRow.id,
          email: userRow.email,
          username: userRow.username,
          sendEmail: false,
        });

        response.message =
          "Az e-mail címed még nincs megerősítve. Ebben a környezetben a megerősítő linket közvetlenül itt tudod megnyitni.";
        response.devVerificationUrl = result.verificationUrl;
        response.expiresAt = result.expiresAt;
      }

      res.status(403).json(response);
      return;
    }

    await clearLoginFailures(identifier, req);

    const user = await getHydratedUser(userRow.id);
    const tokens = await issueSessionForUser({
      user,
      userType: "user",
      userId: String(userRow.id),
      isAdminAccount: false,
      req,
    });

    res.json({
      ok: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user,
      emailVerification: {
        enabled: false,
      },
    });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const parsed = parseRefreshToken(req.body?.refreshToken);
    if (!parsed) {
      res.status(401).json({
        ok: false,
        message: "Ervenytelen frissito token.",
      });
      return;
    }

    const session = await getSessionById(parsed.sessionId);
    if (
      !session ||
      session.revoked ||
      Date.parse(session.expires_at) <= Date.now() ||
      !safeEqual(session.refresh_token_hash, parsed.refreshTokenHash)
    ) {
      if (session) {
        await revokeSession(session.id);
      }

      res.status(401).json({
        ok: false,
        message: "A munkamenet mar nem ervenyes. Jelentkezz be ujra.",
      });
      return;
    }

    let user;
    if (session.user_type === "admin") {
      const adminAccount = await getAdminAccount();
      if (!adminAccount) {
        await revokeSession(session.id);
        res.status(401).json({
          ok: false,
          message: "Az admin munkamenet mar nem ervenyes.",
        });
        return;
      }

      user = buildAdminUser(adminAccount);
    } else {
      user = await getHydratedUser(session.user_id);
      if (!user) {
        await revokeSession(session.id);
        res.status(401).json({
          ok: false,
          message: "A felhasznaloi munkamenet mar nem ervenyes.",
        });
        return;
      }
    }

    const tokens = await rotateRefreshSession(
      session,
      user,
      session.user_type === "admin",
    );

    res.json({
      ok: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user,
    });
  }),
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeSession(req.authSession.id);
    res.json({
      ok: true,
      message: "Sikeres kijelentkezes.",
    });
  }),
);

router.post(
  "/logout-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeUserSessions(
      req.auth?.isAdminAccount ? "admin" : "user",
      req.auth?.isAdminAccount ? "admin" : String(req.auth.sub),
      null,
    );

    res.json({
      ok: true,
      message: "Minden eszkozrol kijelentkeztettel.",
    });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.auth?.isAdminAccount) {
      const adminAccount = await getAdminAccount();
      if (!adminAccount) {
        res.status(401).json({
          ok: false,
          message: "Az admin munkamenet mar nem ervenyes.",
        });
        return;
      }

      const adminUser = buildAdminUser(adminAccount);
      res.json({
        ok: true,
        user: adminUser,
        token: signAccessToken(adminUser, req.authSession.id, true),
      });
      return;
    }

    const user = await getHydratedUser(req.auth.sub);
    if (!user) {
      res.status(401).json({
        ok: false,
        message: "A felhasznaloi munkamenet mar nem ervenyes.",
      });
      return;
    }

    res.json({
      ok: true,
      user,
      token: signAccessToken(user, req.authSession.id, false),
    });
  }),
);

router.patch(
  "/email",
  requireAuth,
  asyncHandler(async (req, res) => {
    const newEmail = normalizeEmail(req.body?.newEmail);
    const currentPassword =
      typeof req.body?.currentPassword === "string"
        ? req.body.currentPassword
        : "";

    const emailError = validateEmail(newEmail);
    if (emailError) {
      res.status(400).json({ ok: false, message: emailError });
      return;
    }

    if (!currentPassword) {
      res.status(400).json({
        ok: false,
        message: "Add meg a jelenlegi jelszavad a megerositeshez.",
      });
      return;
    }

    if (req.auth?.isAdminAccount) {
      const adminAccount = await authenticateAdminPassword(currentPassword);
      if (!adminAccount) {
        res.status(401).json({
          ok: false,
          message: "A jelenlegi jelszo nem egyezik.",
        });
        return;
      }

      const conflictingUser = await findUserByEmail(newEmail);
      if (conflictingUser) {
        res.status(409).json({
          ok: false,
          message: "Ez az e-mail cim mar hasznalatban van.",
        });
        return;
      }

      const updatedAdmin = await updateAdminContact(
        newEmail,
        adminAccount.phone ?? "",
      );
      const adminUser = buildAdminUser(updatedAdmin);

      res.json({
        ok: true,
        message: "E-mail cim frissitve.",
        user: adminUser,
        token: signAccessToken(adminUser, req.authSession.id, true),
      });
      return;
    }

    const userRow = await findUserWithPasswordById(req.auth.sub);
    if (!userRow) {
      res.status(404).json({
        ok: false,
        message: "A felhasznalo nem talalhato.",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      userRow.password_hash,
    );

    if (!passwordMatches) {
      res.status(401).json({
        ok: false,
        message: "A jelenlegi jelszo nem egyezik.",
      });
      return;
    }

    if (await isAdminEmail(newEmail)) {
      res.status(409).json({
        ok: false,
        message: "Ez az e-mail cim mar hasznalatban van.",
      });
      return;
    }

    if (await emailExistsForOtherUser(newEmail, req.auth.sub)) {
      res.status(409).json({
        ok: false,
        message: "Ez az e-mail cim mar hasznalatban van.",
      });
      return;
    }

    await updateUserEmail(req.auth.sub, newEmail);

    const verificationResult = await sendUserVerificationEmail({
      userId: req.auth.sub,
      email: newEmail,
      username: userRow.username,
      purpose: "email_change",
    });

    if (verificationResult.deliveryError) {
      console.error(
        "Az új e-mail cím megerősítő levele nem ment ki.",
        verificationResult.deliveryError,
      );
    }

    const user = await getHydratedUser(req.auth.sub);

    res.json({
      ok: true,
      message: verificationResult.sent
        ? "E-mail cím frissítve. A véglegesítéshez erősítsd meg az új e-mail címet a kiküldött linken."
        : "E-mail cím frissítve. A véglegesítéshez nyisd meg a közvetlenül megjelenített megerősítő linket.",
      user,
      token: signAccessToken(user, req.authSession.id, false),
      devVerificationUrl: shouldExposeDirectAuthLink(verificationResult.sent)
        ? verificationResult.verificationUrl
        : null,
      expiresAt: verificationResult.expiresAt,
    });
  }),
);

router.patch(
  "/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword =
      typeof req.body?.currentPassword === "string"
        ? req.body.currentPassword
        : "";
    const newPassword =
      typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword) {
      res.status(400).json({
        ok: false,
        message: "Add meg a jelenlegi jelszavad.",
      });
      return;
    }

    const passwordError = validatePassword(
      newPassword,
      req.auth?.isAdminAccount ? 4 : 8,
    );
    if (passwordError) {
      res.status(400).json({ ok: false, message: passwordError });
      return;
    }

    if (safeEqual(currentPassword, newPassword)) {
      res.status(400).json({
        ok: false,
        message: "Az uj jelszo nem egyezhet meg a jelenlegivel.",
      });
      return;
    }

    if (req.auth?.isAdminAccount) {
      const adminAccount = await authenticateAdminPassword(currentPassword);
      if (!adminAccount) {
        res.status(401).json({
          ok: false,
          message: "A jelenlegi jelszo nem egyezik.",
        });
        return;
      }

      const nextPasswordHash = await bcrypt.hash(
        newPassword,
        config.bcryptRounds,
      );
      await updateAdminPassword(nextPasswordHash);
      await revokeUserSessions("admin", "admin", req.authSession.id);

      res.json({
        ok: true,
        message: "Jelszo frissitve.",
      });
      return;
    }

    const userRow = await findUserWithPasswordById(req.auth.sub);
    if (!userRow) {
      res.status(404).json({
        ok: false,
        message: "A felhasznalo nem talalhato.",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      userRow.password_hash,
    );

    if (!passwordMatches) {
      res.status(401).json({
        ok: false,
        message: "A jelenlegi jelszo nem egyezik.",
      });
      return;
    }

    const nextPasswordHash = await bcrypt.hash(
      newPassword,
      config.bcryptRounds,
    );

    await updateUserPassword(req.auth.sub, nextPasswordHash);
    await revokeUserSessions("user", String(req.auth.sub), req.authSession.id);

    res.json({
      ok: true,
      message: "Jelszo frissitve.",
    });
  }),
);

router.post(
  "/password/forgot",
  forgotPasswordLimiter,
  asyncHandler(async (req, res) => {
    if (config.nodeEnv === "production" && !canSendEmail()) {
      res.status(503).json({
        ok: false,
        message:
          "A jelszó-visszaállító e-mail küldése ebben a környezetben még nincs beállítva.",
      });
      return;
    }

    const email = normalizeEmail(req.body?.email);
    const emailError = validateEmail(email);

    if (emailError) {
      res.status(400).json({ ok: false, message: emailError });
      return;
    }

    const user = await findUserByEmail(email);
    const admin = user ? null : await findAdminByEmail(email);

    const response = {
      ok: true,
      message:
        "Ha talaltunk ilyen fiokot, kuldtunk egy jelszo-visszaallitasi linket az e-mail cimre.",
    };

    if (!user && !admin) {
      res.json(response);
      return;
    }

    const token = createResetToken();
    const tokenHash = hashToken(token);
    const expiresAt = addMinutes(
      new Date().toISOString(),
      config.passwordResetMinutes,
    );

    await clearPasswordResetTokensForUser(
      admin ? "admin" : "user",
      admin ? "admin" : String(user.id),
    );

    await createPasswordResetToken({
      userType: admin ? "admin" : "user",
      userId: admin ? "admin" : String(user.id),
      tokenHash,
      expiresAt,
    });

    const resetUrl = buildResetUrl(token);
    try {
      await sendPasswordResetEmail({
        to: email,
        username: admin ? "admin" : user.username,
        resetUrl,
        expiresAt,
      });
    } catch (error) {
      console.error("A jelszo-visszaallitasi e-mail kuldese sikertelen.", error);
    }

    if (config.nodeEnv !== "production") {
      response.devResetToken = token;
      response.devResetUrl = resetUrl;
      response.devTargetEmail = email;
      response.expiresAt = expiresAt;
    }

    res.json(response);
  }),
);

router.post(
  "/password/reset",
  forgotPasswordLimiter,
  asyncHandler(async (req, res) => {
    const token = emptyOrTrimmed(req.body?.token);
    const newPassword =
      typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    if (!token) {
      res.status(400).json({
        ok: false,
        message: "Hianyzik a visszaallitasi token.",
      });
      return;
    }

    const tokenRow = await findPasswordResetToken(hashToken(token));
    if (
      !tokenRow ||
      tokenRow.used_at ||
      Date.parse(tokenRow.expires_at) <= Date.now()
    ) {
      res.status(400).json({
        ok: false,
        message: "A visszaallitasi link ervenytelen vagy lejart.",
      });
      return;
    }

    const passwordError = validatePassword(
      newPassword,
      tokenRow.user_type === "admin" ? 4 : 8,
    );
    if (passwordError) {
      res.status(400).json({ ok: false, message: passwordError });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    if (tokenRow.user_type === "admin") {
      await updateAdminPassword(passwordHash);
      await revokeUserSessions("admin", "admin", null);
      await clearPasswordResetTokensForUser("admin", "admin");
    } else {
      await updateUserPassword(tokenRow.user_id, passwordHash);
      await revokeUserSessions("user", String(tokenRow.user_id), null);
      await clearPasswordResetTokensForUser("user", String(tokenRow.user_id));
    }

    await markPasswordResetUsed(tokenRow.id);

    res.json({
      ok: true,
      message: "A jelszo sikeresen frissult. Most mar belephetsz az uj jelszoval.",
    });
  }),
);

router.patch(
  "/admin/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.auth?.isAdminAccount) {
      res.status(403).json({
        ok: false,
        message: "Ehhez admin jogosultsag kell.",
      });
      return;
    }

    const email = normalizeEmail(req.body?.email);
    const phone = normalizePhone(req.body?.phone);
    const currentPassword =
      typeof req.body?.currentPassword === "string"
        ? req.body.currentPassword
        : "";

    const emailError = validateEmail(email);
    if (emailError) {
      res.status(400).json({ ok: false, message: emailError });
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      res.status(400).json({ ok: false, message: phoneError });
      return;
    }

    if (!currentPassword) {
      res.status(400).json({
        ok: false,
        message: "Add meg a jelenlegi admin jelszot a menteshez.",
      });
      return;
    }

    const adminAccount = await authenticateAdminPassword(currentPassword);
    if (!adminAccount) {
      res.status(401).json({
        ok: false,
        message: "A jelenlegi jelszo nem egyezik.",
      });
      return;
    }

    const conflictingUser = await findUserByEmail(email);
    if (conflictingUser) {
      res.status(409).json({
        ok: false,
        message: "Ez az e-mail cim mar hasznalatban van.",
      });
      return;
    }

    const updatedAdmin = await updateAdminContact(email, phone);
    const adminUser = buildAdminUser(updatedAdmin);

    res.json({
      ok: true,
      message: "Admin adatok frissitve.",
      user: adminUser,
      token: signAccessToken(adminUser, req.authSession.id, true),
    });
  }),
);

router.post(
  "/verification/request",
  verificationLimiter,
  asyncHandler(async (req, res) => {
    const rawIdentifier =
      emptyOrTrimmed(req.body?.identifier) || emptyOrTrimmed(req.body?.email);

    if (!rawIdentifier) {
      res.status(400).json({
        ok: false,
        message: "Add meg a fiokhoz tartozo e-mail cimet vagy felhasznalonevet.",
      });
      return;
    }

    const response = {
      ok: true,
      message:
        "Ha találtunk nem megerősített fiókot ehhez az azonosítóhoz, kiküldtük az új megerősítő levelet.",
      verificationEnabled: true,
    };

    if (config.nodeEnv === "production" && !canSendEmail()) {
      res.status(503).json({
        ok: false,
        message:
          "Az új megerősítő levél küldése ebben a környezetben nem érhető el. Jelentkezz be a jelszavaddal, és a rendszer megjeleníti a megerősítő linket.",
        verificationEnabled: true,
      });
      return;
    }

    if (!config.emailVerificationEnabled) {
      res.json(response);
      return;
    }

    const normalizedIdentifier = normalizeEmail(rawIdentifier);
    const emailError = validateEmail(normalizedIdentifier);
    const userRow = emailError
      ? await findUserByIdentifier(rawIdentifier)
      : (await findUserByEmail(normalizedIdentifier)) ??
        (await findUserByIdentifier(rawIdentifier));

    if (!userRow || userRow.email_verified) {
      res.json(response);
      return;
    }

    try {
      const result = await sendUserVerificationEmail({
        userId: userRow.id,
        email: userRow.email,
        username: userRow.username,
      });

      if (shouldExposeDirectAuthLink(result.sent)) {
        response.devVerificationUrl = result.verificationUrl;
        response.expiresAt = result.expiresAt;
      }

      response.message = result.sent
        ? "Ha találtunk nem megerősített fiókot ehhez az azonosítóhoz, kiküldtük az új megerősítő levelet."
        : "Ha találtunk nem megerősített fiókot ehhez az azonosítóhoz, létrehoztunk egy közvetlen megerősítő linket.";
    } catch (error) {
      console.error("Az új megerősítő e-mail küldése sikertelen.", error);
    }

    res.json(response);
  }),
);

router.post(
  "/verification/confirm",
  asyncHandler(async (req, res) => {
    const token = emptyOrTrimmed(req.body?.token);

    if (!token) {
      res.status(400).json({
        ok: false,
        message: "Hianyzik a megerosito token.",
      });
      return;
    }

    const tokenRow = await findEmailVerificationToken(hashToken(token));
    if (!tokenRow) {
      res.status(400).json({
        ok: false,
        message: "A megerosito link ervenytelen vagy lejart.",
      });
      return;
    }

    const userRow = await findUserById(tokenRow.user_id);
    if (!userRow) {
      res.status(404).json({
        ok: false,
        message: "A felhasznaloi fiok mar nem elerheto.",
      });
      return;
    }

    if (tokenRow.used_at) {
      if (
        userRow.email_verified &&
        normalizeEmail(userRow.email) === normalizeEmail(tokenRow.email)
      ) {
        res.json({
          ok: true,
          message:
            "Ez az e-mail cim mar korabban meg lett erositve. Most mar belephetsz a fiokodba.",
          verificationEnabled: config.emailVerificationEnabled,
        });
        return;
      }

      res.status(400).json({
        ok: false,
        message: "A megerosito link ervenytelen vagy lejart.",
      });
      return;
    }

    if (Date.parse(tokenRow.expires_at) <= Date.now()) {
      res.status(400).json({
        ok: false,
        message: "A megerosito link ervenytelen vagy lejart.",
      });
      return;
    }

    if (normalizeEmail(userRow.email) !== normalizeEmail(tokenRow.email)) {
      res.status(409).json({
        ok: false,
        message:
          "Ez a megerosito link mar nem a jelenlegi e-mail cimhez tartozik.",
      });
      return;
    }

    await markUserEmailVerified(userRow.id);
    await markEmailVerificationUsed(tokenRow.id);

    res.json({
      ok: true,
      message:
        "Az e-mail cimed sikeresen meg lett erositve. Most mar belephetsz a fiokodba.",
      verificationEnabled: config.emailVerificationEnabled,
    });
  }),
);

module.exports = router;
