const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { config } = require("./config");
const { clearAllThrottles, getDatabaseDriver, initDatabase } = require("./db");
const adminRouter = require("./routes/admin");
const accountRouter = require("./routes/account");
const authRouter = require("./routes/auth");
const cartRouter = require("./routes/cart");
const commerceRouter = require("./routes/commerce");
const ordersRouter = require("./routes/orders");
const productsRouter = require("./routes/products");

const app = express();
const serverStartedAt = new Date();
let readyPromise = null;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = initDatabase().then(async (database) => {
      if (config.relaxedAuthGuards) {
        await clearAllThrottles();
      }

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
    database: getDatabaseDriver(),
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
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
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
app.use(express.json({ limit: "10kb" }));
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
registerRoute("/api/products", productsRouter);
registerRoute("/api/cart", cartRouter);
registerRoute("/api/orders", ordersRouter);

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
