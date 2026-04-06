const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function buildHttpsUrl(hostname) {
  const normalized = emptyStringToNull(hostname);
  return normalized ? `https://${normalized}` : null;
}

function uniqueOrigins(origins) {
  return [...new Set(origins.filter(Boolean))];
}

function emptyStringToNull(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const bcryptRounds = Number.parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
const refreshTokenDays = Number.parseInt(
  process.env.REFRESH_TOKEN_DAYS ?? "30",
  10,
);
const passwordResetMinutes = Number.parseInt(
  process.env.PASSWORD_RESET_MINUTES ?? "60",
  10,
);
const emailVerificationMinutes = Number.parseInt(
  process.env.EMAIL_VERIFICATION_MINUTES ?? "1440",
  10,
);
const cartReservationMinutes = Number.parseInt(
  process.env.CART_RESERVATION_MINUTES ?? "30",
  10,
);
const bruteForceWindowMinutes = Number.parseInt(
  process.env.BRUTE_FORCE_WINDOW_MINUTES ?? "15",
  10,
);
const bruteForceLockMinutes = Number.parseInt(
  process.env.BRUTE_FORCE_LOCK_MINUTES ?? "30",
  10,
);
const bruteForceMaxAttempts = Number.parseInt(
  process.env.BRUTE_FORCE_MAX_ATTEMPTS ?? "5",
  10,
);
const transferPaymentDueDays = Number.parseInt(
  process.env.TRANSFER_PAYMENT_DUE_DAYS ?? "3",
  10,
);
const lowStockThreshold = Number.parseInt(
  process.env.LOW_STOCK_THRESHOLD ?? "5",
  10,
);
const isVercel = process.env.VERCEL === "1";
const sqlitePathFromEnv = emptyStringToNull(process.env.SQLITE_PATH);
const sqlitePath = sqlitePathFromEnv
  ? path.resolve(__dirname, sqlitePathFromEnv)
  : isVercel && !process.env.DATABASE_URL
    ? path.join("/tmp", "serona.sqlite")
  : path.join(__dirname, "data", "serona.sqlite");
const paymentProviderFromEnv = emptyStringToNull(process.env.PAYMENT_PROVIDER);
const paymentProvider =
  paymentProviderFromEnv && ["stripe", "barion", "simplepay", "custom"].includes(paymentProviderFromEnv)
    ? paymentProviderFromEnv
    : "none";
const paymentPublicKey = emptyStringToNull(process.env.PAYMENT_PUBLIC_KEY);
const vercelDeploymentUrl = buildHttpsUrl(process.env.VERCEL_URL);
const vercelBranchUrl = buildHttpsUrl(process.env.VERCEL_BRANCH_URL);
const vercelProductionUrl = buildHttpsUrl(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
);
const databaseUrl = emptyStringToNull(process.env.DATABASE_URL);
const jwtSecretFromEnv = emptyStringToNull(process.env.JWT_SECRET);
const frontendBaseUrl =
  emptyStringToNull(process.env.FRONTEND_BASE_URL) ??
  vercelProductionUrl ??
  vercelDeploymentUrl ??
  DEFAULT_CORS_ORIGINS[0];
const corsOrigins = uniqueOrigins([
  ...(process.env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  frontendBaseUrl,
  vercelDeploymentUrl,
  vercelBranchUrl,
  vercelProductionUrl,
]);

const config = {
  port: Number.isFinite(port) ? port : 3000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  isVercel,
  databaseUrl,
  databaseSsl:
    process.env.DATABASE_SSL === "true" ||
    process.env.NODE_ENV === "production",
  sqlitePath,
  jwtSecret:
    jwtSecretFromEnv ??
    (isVercel
      ? `serona-vercel-fallback-${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "preview"}`
      : "serona-dev-secret-change-me"),
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  jwtIssuer: process.env.JWT_ISSUER ?? "serona-api",
  jwtAudience: process.env.JWT_AUDIENCE ?? "serona-web",
  resendApiKey: emptyStringToNull(process.env.RESEND_API_KEY),
  resendApiBaseUrl:
    process.env.RESEND_API_BASE_URL ?? "https://api.resend.com",
  emailFromAddress:
    process.env.EMAIL_FROM_ADDRESS ?? "Serona <onboarding@resend.dev>",
  emailReplyTo: emptyStringToNull(process.env.EMAIL_REPLY_TO),
  orderAutomationSecret: emptyStringToNull(process.env.ORDER_AUTOMATION_SECRET),
  transferBankAccountHolder:
    process.env.TRANSFER_BANK_ACCOUNT_HOLDER ?? "Serona",
  transferBankAccountNumber: emptyStringToNull(
    process.env.TRANSFER_BANK_ACCOUNT_NUMBER,
  ),
  transferBankName: emptyStringToNull(process.env.TRANSFER_BANK_NAME),
  bcryptRounds:
    Number.isFinite(bcryptRounds) && bcryptRounds >= 10 && bcryptRounds <= 14
      ? bcryptRounds
      : 12,
  corsOrigins,
  emailVerificationEnabled: Boolean(emptyStringToNull(process.env.RESEND_API_KEY)),
  frontendBaseUrl,
  refreshTokenDays:
    Number.isFinite(refreshTokenDays) && refreshTokenDays >= 1
      ? refreshTokenDays
      : 30,
  passwordResetMinutes:
    Number.isFinite(passwordResetMinutes) && passwordResetMinutes >= 5
      ? passwordResetMinutes
      : 60,
  emailVerificationMinutes:
    Number.isFinite(emailVerificationMinutes) && emailVerificationMinutes >= 15
      ? emailVerificationMinutes
      : 1440,
  cartReservationMinutes:
    Number.isFinite(cartReservationMinutes) && cartReservationMinutes >= 5
      ? cartReservationMinutes
      : 30,
  bruteForceWindowMinutes:
    Number.isFinite(bruteForceWindowMinutes) && bruteForceWindowMinutes >= 1
      ? bruteForceWindowMinutes
      : 15,
  bruteForceLockMinutes:
    Number.isFinite(bruteForceLockMinutes) && bruteForceLockMinutes >= 1
      ? bruteForceLockMinutes
      : 30,
  bruteForceMaxAttempts:
    Number.isFinite(bruteForceMaxAttempts) && bruteForceMaxAttempts >= 3
      ? bruteForceMaxAttempts
      : 5,
  transferPaymentDueDays:
    Number.isFinite(transferPaymentDueDays) && transferPaymentDueDays >= 1
      ? transferPaymentDueDays
      : 3,
  lowStockThreshold:
    Number.isFinite(lowStockThreshold) && lowStockThreshold >= 0
      ? lowStockThreshold
      : 5,
  glsApiBaseUrl: emptyStringToNull(process.env.GLS_API_BASE_URL),
  glsClientNumber: emptyStringToNull(process.env.GLS_CLIENT_NUMBER),
  glsUsername: emptyStringToNull(process.env.GLS_USERNAME),
  glsPassword: emptyStringToNull(process.env.GLS_PASSWORD),
  paymentProvider,
  paymentPublicKey,
};

if (config.nodeEnv === "production") {
  if (!config.databaseUrl && !config.isVercel) {
    throw new Error("Hiányzó DATABASE_URL beállítás production módban.");
  }
  if (!jwtSecretFromEnv && !config.isVercel) {
    throw new Error("Hiányzó JWT_SECRET beállítás production módban.");
  }
}

if (config.nodeEnv === "production" && config.isVercel) {
  if (!config.databaseUrl) {
    console.warn(
      "Vercel fallback mód: nincs DATABASE_URL, ideiglenes /tmp SQLite adatbázis indul.",
    );
  }

  if (!jwtSecretFromEnv) {
    console.warn(
      "Vercel fallback mód: nincs JWT_SECRET, ideiglenes deploy-szintű titok kerül használatra.",
    );
  }
}

module.exports = { config };
