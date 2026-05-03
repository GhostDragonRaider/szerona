const path = require("path");
const dotenv = require("dotenv");

if (process.env.VERCEL !== "1") {
  dotenv.config({ path: path.join(__dirname, ".env") });
}

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

function parseBoolean(value, defaultValue = false) {
  const normalized = emptyStringToNull(value);
  if (normalized === null) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(String(normalized).toLowerCase());
}

function parseList(value, fallback = []) {
  const normalized = emptyStringToNull(value);
  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function extractEmailAddress(value) {
  const normalized = emptyStringToNull(value);
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/<([^>]+)>/);
  if (match?.[1]) {
    return match[1].trim();
  }

  return normalized.includes("@") ? normalized : null;
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
const isVercel = process.env.VERCEL === "1";
const transferPaymentDueDays = Number.parseInt(
  process.env.TRANSFER_PAYMENT_DUE_DAYS ?? "3",
  10,
);
const lowStockThreshold = Number.parseInt(
  process.env.LOW_STOCK_THRESHOLD ?? "5",
  10,
);
const sqlitePathFromEnv = emptyStringToNull(process.env.SQLITE_PATH);
const sqlitePath =
  isVercel && !process.env.DATABASE_URL
    ? path.join("/tmp", "serona.sqlite")
    : sqlitePathFromEnv
      ? path.resolve(__dirname, sqlitePathFromEnv)
      : path.join(__dirname, "data", "serona.sqlite");
const invoiceDirFromEnv = emptyStringToNull(process.env.INVOICE_DIR);
const invoiceDir = invoiceDirFromEnv
  ? path.resolve(__dirname, invoiceDirFromEnv)
  : path.join(path.dirname(sqlitePath), "invoices");
const paymentProviderFromEnv = emptyStringToNull(process.env.PAYMENT_PROVIDER);
const paymentProvider =
  paymentProviderFromEnv && ["stripe", "barion", "simplepay", "custom"].includes(paymentProviderFromEnv)
    ? paymentProviderFromEnv
    : "none";
const paymentPublicKey = emptyStringToNull(process.env.PAYMENT_PUBLIC_KEY);
const defaultContactEmail =
  extractEmailAddress(process.env.EMAIL_REPLY_TO) ??
  extractEmailAddress(process.env.EMAIL_FROM_ADDRESS);
const barionPosKey = emptyStringToNull(process.env.BARION_POS_KEY);
const barionSandbox = parseBoolean(process.env.BARION_SANDBOX, false);
const barionApiBaseUrl =
  emptyStringToNull(process.env.BARION_API_BASE_URL) ??
  (barionSandbox
    ? "https://api.test.barion.com/v2"
    : "https://api.barion.com/v2");
const barionPayee = emptyStringToNull(process.env.BARION_PAYEE);
const barionLocale =
  emptyStringToNull(process.env.BARION_LOCALE) ?? "hu-HU";
const barionCurrency =
  emptyStringToNull(process.env.BARION_CURRENCY) ?? "HUF";
const barionFundingSources = parseList(process.env.BARION_FUNDING_SOURCES, [
  "All",
]);
const mailerSendApiKey = emptyStringToNull(process.env.MAILERSEND_API_KEY);
const resendApiKey = emptyStringToNull(process.env.RESEND_API_KEY);
const emailProviderFromEnv = emptyStringToNull(process.env.EMAIL_PROVIDER);
const emailProvider =
  emailProviderFromEnv && ["resend", "mailersend"].includes(emailProviderFromEnv)
    ? emailProviderFromEnv
    : mailerSendApiKey
      ? "mailersend"
      : "resend";
const szamlazzAgentKey = emptyStringToNull(process.env.SZAMLAZZ_HU_AGENT_KEY);
const szamlazzApiBaseUrl =
  emptyStringToNull(process.env.SZAMLAZZ_HU_API_BASE_URL) ??
  "https://www.szamlazz.hu/szamla/";
const szamlazzInvoicePrefix = emptyStringToNull(
  process.env.SZAMLAZZ_HU_PREFIX,
);
const invoiceVatRate = Number.parseFloat(
  process.env.SZAMLAZZ_HU_VAT_RATE ?? "27",
);
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
const publicAppUrl = frontendBaseUrl;
const backendBaseUrl =
  emptyStringToNull(process.env.BACKEND_BASE_URL) ??
  (process.env.NODE_ENV === "development"
    ? `http://localhost:${Number.isFinite(port) ? port : 3000}`
    : publicAppUrl);
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
  relaxedAuthGuards: isVercel && !databaseUrl,
  databaseSsl:
    process.env.DATABASE_SSL === "true" ||
    process.env.NODE_ENV === "production",
  sqlitePath,
  invoiceDir,
  jwtSecret:
    jwtSecretFromEnv ??
    (isVercel
      ? `serona-vercel-fallback-${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "preview"}`
      : "serona-dev-secret-change-me"),
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  jwtIssuer: process.env.JWT_ISSUER ?? "serona-api",
  jwtAudience: process.env.JWT_AUDIENCE ?? "serona-web",
  emailProvider,
  resendApiKey,
  resendApiBaseUrl:
    process.env.RESEND_API_BASE_URL ?? "https://api.resend.com",
  mailerSendApiKey,
  mailerSendApiBaseUrl:
    process.env.MAILERSEND_API_BASE_URL ?? "https://api.mailersend.com/v1",
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
  emailVerificationEnabled:
    (emailProvider === "mailersend" && Boolean(mailerSendApiKey)) ||
    (emailProvider === "resend" && Boolean(resendApiKey)),
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
  publicAppUrl,
  backendBaseUrl,
  paymentProvider,
  paymentMode: paymentProvider === "barion" ? "redirect" : "tokenized",
  paymentPublicKey,
  barionSandbox,
  barionApiBaseUrl,
  barionPosKey,
  barionPayee,
  barionLocale,
  barionCurrency,
  barionFundingSources,
  barionRedirectUrl: `${publicAppUrl.replace(/\/+$/, "")}/checkout`,
  barionCallbackUrl: `${backendBaseUrl.replace(/\/+$/, "")}/api/payments/barion/callback`,
  barionEnabled:
    paymentProvider === "barion" &&
    Boolean(barionPosKey) &&
    Boolean(barionPayee),
  szamlazzApiBaseUrl,
  szamlazzAgentKey,
  szamlazzInvoicePrefix,
  szamlazzEInvoice: parseBoolean(process.env.SZAMLAZZ_HU_E_INVOICE, false),
  szamlazzDownloadPdf: parseBoolean(
    process.env.SZAMLAZZ_HU_DOWNLOAD_PDF,
    false,
  ),
  szamlazzEnabled: Boolean(szamlazzAgentKey),
  invoiceVatRate:
    Number.isFinite(invoiceVatRate) && invoiceVatRate >= 0
      ? invoiceVatRate
      : 27,
};

function applyPaymentIntegrationConfig(env = process.env) {
  const nextPaymentProviderFromEnv = emptyStringToNull(env.PAYMENT_PROVIDER);
  const nextPaymentProvider =
    nextPaymentProviderFromEnv &&
    ["stripe", "barion", "simplepay", "custom"].includes(nextPaymentProviderFromEnv)
      ? nextPaymentProviderFromEnv
      : "none";
  const nextBarionSandbox = parseBoolean(env.BARION_SANDBOX, false);
  const nextBarionApiBaseUrl =
    emptyStringToNull(env.BARION_API_BASE_URL) ??
    (nextBarionSandbox
      ? "https://api.test.barion.com/v2"
      : "https://api.barion.com/v2");
  const nextBarionPosKey = emptyStringToNull(env.BARION_POS_KEY);
  const nextBarionPayee = emptyStringToNull(env.BARION_PAYEE);

  config.paymentProvider = nextPaymentProvider;
  config.paymentMode = nextPaymentProvider === "barion" ? "redirect" : "tokenized";
  config.paymentPublicKey = emptyStringToNull(env.PAYMENT_PUBLIC_KEY);
  config.barionSandbox = nextBarionSandbox;
  config.barionApiBaseUrl = nextBarionApiBaseUrl;
  config.barionPosKey = nextBarionPosKey;
  config.barionPayee = nextBarionPayee;
  config.barionLocale = emptyStringToNull(env.BARION_LOCALE) ?? "hu-HU";
  config.barionCurrency = emptyStringToNull(env.BARION_CURRENCY) ?? "HUF";
  config.barionFundingSources = parseList(env.BARION_FUNDING_SOURCES, ["All"]);
  config.barionEnabled =
    nextPaymentProvider === "barion" &&
    Boolean(nextBarionPosKey) &&
    Boolean(nextBarionPayee);
  config.szamlazzApiBaseUrl =
    emptyStringToNull(env.SZAMLAZZ_HU_API_BASE_URL) ??
    "https://www.szamlazz.hu/szamla/";
  config.szamlazzAgentKey = emptyStringToNull(env.SZAMLAZZ_HU_AGENT_KEY);
  config.szamlazzInvoicePrefix = emptyStringToNull(env.SZAMLAZZ_HU_PREFIX);
  config.szamlazzEInvoice = parseBoolean(env.SZAMLAZZ_HU_E_INVOICE, false);
  config.szamlazzDownloadPdf = parseBoolean(
    env.SZAMLAZZ_HU_DOWNLOAD_PDF,
    false,
  );
  config.szamlazzEnabled = Boolean(config.szamlazzAgentKey);
}

if (config.nodeEnv === "production") {
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

  if (config.relaxedAuthGuards) {
    console.warn(
      "Vercel fallback mód: az auth rate limit és brute-force védelem lazított, amíg nincs tartós adatbázis.",
    );
  }
}

if (config.nodeEnv === "production" && !config.isVercel && !config.databaseUrl) {
  console.warn(
    `Production SQLite mód: nincs DATABASE_URL, a backend a helyi SQLite adatbázist használja (${config.sqlitePath}).`,
  );
}

module.exports = { applyPaymentIntegrationConfig, config };
