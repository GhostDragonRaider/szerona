const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { config } = require("./config");
const { clearAllThrottles, initDatabase } = require("./db");
const adminRouter = require("./routes/admin");
const accountRouter = require("./routes/account");
const authRouter = require("./routes/auth");
const cartRouter = require("./routes/cart");
const commerceRouter = require("./routes/commerce");
const contactRouter = require("./routes/contact");
const ordersRouter = require("./routes/orders");
const paymentsRouter = require("./routes/payments");
const productsRouter = require("./routes/products");
const { startBackupScheduler } = require("./services/backup");

const app = express();
const serverStartedAt = new Date();
let readyPromise = null;

function getRequestOrigins(req) {
  const host =
    req.headers["x-forwarded-host"] || req.headers.host || req.get("host");
  const forwardedProto = String(
    req.headers["x-forwarded-proto"] || req.protocol || "http",
  )
    .split(",")[0]
    .trim();

  if (!host) {
    return [];
  }

  return [...new Set([
    `${forwardedProto}://${host}`,
    `http://${host}`,
    `https://${host}`,
  ])];
}

function isAllowedOrigin(origin, req) {
  if (!origin) {
    return true;
  }

  if (config.corsOrigins.includes(origin)) {
    return true;
  }

  return getRequestOrigins(req).includes(origin);
}

function ensureReady() {
  if (!readyPromise) {
    readyPromise = initDatabase().then(async (database) => {
      if (config.relaxedAuthGuards) {
        await clearAllThrottles();
      }
      startBackupScheduler();

      return database;
    });
  }

  return readyPromise;
}

function registerRoute(path, ...handlers) {
  app.use(path, ...handlers);

  if (path.startsWith("/api/")) {
    const unprefixedPath = path.slice(4);
    if (unprefixedPath) {
      app.use(unprefixedPath, ...handlers);
    }
  }
}

function sendHealth(res) {
  res.json({
    ok: true,
    message: "Serona API fut",
    ido: new Date().toISOString(),
    startedAt: serverStartedAt.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    emailVerificationEnabled: config.emailVerificationEnabled,
    backendVersion: "1.0",
    frontendVersion: "1.0",
    deployment: {
      isVercel: config.isVercel,
      relaxedAuthGuards: config.relaxedAuthGuards,
      sqlitePath: config.databaseUrl ? null : config.sqlitePath,
      hasFallbackJwtSecret: !process.env.JWT_SECRET,
      hasDatabaseUrl: Boolean(config.databaseUrl),
    },
    auth: {
      accessToken: config.accessTokenExpiresIn,
      refreshTokenDays: config.refreshTokenDays,
      passwordResetMinutes: config.passwordResetMinutes,
      emailVerificationMinutes: config.emailVerificationMinutes,
    },
    commerce: {
      cartReservationMinutes: config.cartReservationMinutes,
      transferPaymentDueDays: config.transferPaymentDueDays,
    },
  });
}

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors((req, callback) => {
    const origin = req.header("Origin");
    if (isAllowedOrigin(origin, req)) {
      callback(null, { origin: true });
      return;
    }

    callback(new Error("Not allowed by CORS"));
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "8mb" }));
app.use(
  "/uploads",
  express.static(path.join(path.dirname(config.sqlitePath), "uploads")),
);
app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (req, res) => sendHealth(res));
app.get("/health", (req, res) => sendHealth(res));

registerRoute("/api/auth", authRouter);
registerRoute("/api/admin", adminRouter);
registerRoute("/api/account", accountRouter);
registerRoute("/api/commerce", commerceRouter);
registerRoute("/api/contact", contactRouter);
registerRoute("/api/products", productsRouter);
registerRoute("/api/cart", cartRouter);
registerRoute("/api/orders", ordersRouter);
registerRoute("/api/payments", paymentsRouter);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "A keresett végpont nem létezik.",
  });
});

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    res.status(413).json({
      ok: false,
      message: "A beküldött adat túl nagy.",
    });
    return;
  }

  if (err?.message === "Not allowed by CORS") {
    res.status(403).json({
      ok: false,
      message: "Az eredet nincs engedélyezve.",
    });
    return;
  }

  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({
      ok: false,
      message: err.message || "A kérés nem sikerült.",
      ...(err.lockedUntil ? { lockedUntil: err.lockedUntil } : {}),
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    ok: false,
    message: "Váratlan szerverhiba történt.",
  });
});

async function start() {
  const database = await ensureReady();
  app.listen(config.port, () => {
    console.log(
      `API kész: http://localhost:${config.port}/api/health (${database.name})`,
    );
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error("A szerver nem tudott elindulni.", error);
    process.exit(1);
  });
}

module.exports = {
  app,
  ensureReady,
  serverStartedAt,
  start,
};
