const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { config } = require("./config");
const { getDatabaseDriver, initDatabase } = require("./db");
const adminRouter = require("./routes/admin");
const accountRouter = require("./routes/account");
const authRouter = require("./routes/auth");
const cartRouter = require("./routes/cart");
const commerceRouter = require("./routes/commerce");
const ordersRouter = require("./routes/orders");
const productsRouter = require("./routes/products");

const app = express();
const serverStartedAt = new Date();

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

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Serona API fut",
    ido: new Date().toISOString(),
    startedAt: serverStartedAt.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    emailVerificationEnabled: config.emailVerificationEnabled,
    database: getDatabaseDriver(),
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
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/account", accountRouter);
app.use("/api/commerce", commerceRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);

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
  const database = await initDatabase();
  app.listen(config.port, () => {
    console.log(
      `API kész: http://localhost:${config.port}/api/health (${database.name})`,
    );
  });
}

start().catch((error) => {
  console.error("A szerver nem tudott elindulni.", error);
  process.exit(1);
});
