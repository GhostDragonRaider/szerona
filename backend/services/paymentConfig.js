const fs = require("fs");
const path = require("path");
const { applyPaymentIntegrationConfig, config } = require("../config");

const ENV_PATH = path.join(__dirname, "..", ".env");
const PAYMENT_ENV_KEYS = [
  "PAYMENT_PROVIDER",
  "PAYMENT_PUBLIC_KEY",
  "BARION_SANDBOX",
  "BARION_API_BASE_URL",
  "BARION_POS_KEY",
  "BARION_PAYEE",
  "BARION_LOCALE",
  "BARION_CURRENCY",
  "BARION_FUNDING_SOURCES",
  "SZAMLAZZ_HU_API_BASE_URL",
  "SZAMLAZZ_HU_AGENT_KEY",
  "SZAMLAZZ_HU_E_INVOICE",
  "SZAMLAZZ_HU_DOWNLOAD_PDF",
];

function getPaymentGatewayConfig() {
  const redirectGateway = config.paymentProvider === "barion";

  return {
    provider: config.paymentProvider,
    mode: redirectGateway ? "redirect" : "tokenized",
    readyForClientSetup: redirectGateway
      ? config.barionEnabled
      : config.paymentProvider !== "none" && Boolean(config.paymentPublicKey),
    supportsSavedCards: !redirectGateway,
  };
}

function parseEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    return {};
  }

  return fs
    .readFileSync(ENV_PATH, "utf8")
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !line.includes("=")) {
        return values;
      }

      const [rawKey, ...rawValue] = line.split("=");
      const key = rawKey.trim();
      const value = rawValue
        .join("=")
        .trim()
        .replace(/^['"]|['"]$/g, "");

      values[key] = value;
      return values;
    }, {});
}

function serializeEnvValue(value) {
  const nextValue = String(value ?? "");
  if (!nextValue || /^[A-Za-z0-9_./:@,+-]+$/.test(nextValue)) {
    return nextValue;
  }

  return JSON.stringify(nextValue);
}

function writePaymentEnv(updates) {
  const existing = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)
    : [];
  const nextValues = Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [key, String(value ?? "")]),
  );
  const seen = new Set();
  const nextLines = existing.map((line) => {
    if (!line.trim() || line.trim().startsWith("#") || !line.includes("=")) {
      return line;
    }

    const key = line.split("=", 1)[0].trim();
    if (!Object.prototype.hasOwnProperty.call(nextValues, key)) {
      return line;
    }

    seen.add(key);
    return `${key}=${serializeEnvValue(nextValues[key])}`;
  });

  for (const key of PAYMENT_ENV_KEYS) {
    if (Object.prototype.hasOwnProperty.call(nextValues, key) && !seen.has(key)) {
      nextLines.push(`${key}=${serializeEnvValue(nextValues[key])}`);
    }
  }

  fs.writeFileSync(ENV_PATH, `${nextLines.join("\n").replace(/\n+$/, "")}\n`, {
    mode: 0o600,
  });

  for (const [key, value] of Object.entries(nextValues)) {
    if (value) {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }

  applyPaymentIntegrationConfig(process.env);
}

function getPaymentIntegrationSettings() {
  const env = parseEnvFile();
  return {
    paymentProvider: env.PAYMENT_PROVIDER || config.paymentProvider,
    paymentPublicKey: env.PAYMENT_PUBLIC_KEY || "",
    barionSandbox: (env.BARION_SANDBOX || String(config.barionSandbox)) === "true",
    barionApiBaseUrl: env.BARION_API_BASE_URL || "",
    barionPosKey: env.BARION_POS_KEY || "",
    barionPayee: env.BARION_PAYEE || "",
    barionLocale: env.BARION_LOCALE || config.barionLocale,
    barionCurrency: env.BARION_CURRENCY || config.barionCurrency,
    barionFundingSources:
      env.BARION_FUNDING_SOURCES || config.barionFundingSources.join(","),
    szamlazzApiBaseUrl: env.SZAMLAZZ_HU_API_BASE_URL || config.szamlazzApiBaseUrl,
    szamlazzAgentKey: env.SZAMLAZZ_HU_AGENT_KEY || "",
    szamlazzEInvoice: (env.SZAMLAZZ_HU_E_INVOICE || "false") === "true",
    szamlazzDownloadPdf: (env.SZAMLAZZ_HU_DOWNLOAD_PDF || "false") === "true",
    gateway: getPaymentGatewayConfig(),
    barionEnabled: config.barionEnabled,
    szamlazzEnabled: config.szamlazzEnabled,
  };
}

function updatePaymentIntegrationSettings(input) {
  const nextProvider = String(input?.paymentProvider ?? "barion").trim();
  const paymentProvider = ["none", "stripe", "barion", "simplepay", "custom"].includes(
    nextProvider,
  )
    ? nextProvider
    : "barion";
  const updates = {
    PAYMENT_PROVIDER: paymentProvider,
    PAYMENT_PUBLIC_KEY: String(input?.paymentPublicKey ?? "").trim(),
    BARION_SANDBOX: input?.barionSandbox === false ? "false" : "true",
    BARION_API_BASE_URL: String(input?.barionApiBaseUrl ?? "").trim(),
    BARION_POS_KEY: String(input?.barionPosKey ?? "").trim(),
    BARION_PAYEE: String(input?.barionPayee ?? "").trim(),
    BARION_LOCALE: String(input?.barionLocale ?? "hu-HU").trim() || "hu-HU",
    BARION_CURRENCY: String(input?.barionCurrency ?? "HUF").trim() || "HUF",
    BARION_FUNDING_SOURCES:
      String(input?.barionFundingSources ?? "All").trim() || "All",
    SZAMLAZZ_HU_API_BASE_URL:
      String(input?.szamlazzApiBaseUrl ?? "https://www.szamlazz.hu/szamla/")
        .trim() || "https://www.szamlazz.hu/szamla/",
    SZAMLAZZ_HU_AGENT_KEY: String(input?.szamlazzAgentKey ?? "").trim(),
    SZAMLAZZ_HU_E_INVOICE: input?.szamlazzEInvoice === true ? "true" : "false",
    SZAMLAZZ_HU_DOWNLOAD_PDF:
      input?.szamlazzDownloadPdf === true ? "true" : "false",
  };

  writePaymentEnv(updates);
  return getPaymentIntegrationSettings();
}

module.exports = {
  getPaymentGatewayConfig,
  getPaymentIntegrationSettings,
  updatePaymentIntegrationSettings,
};
