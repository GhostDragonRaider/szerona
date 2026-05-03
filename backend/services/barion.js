const { config } = require("../config");

const BARION_SUCCESS_STATUSES = new Set(["Succeeded"]);
const BARION_CANCELLED_STATUSES = new Set([
  "Canceled",
  "Cancelled",
  "Failed",
  "Expired",
]);

function isBarionConfigured() {
  return Boolean(config.barionEnabled);
}

function buildBarionUrl(path) {
  return `${config.barionApiBaseUrl.replace(/\/+$/, "")}/${path.replace(
    /^\/+/,
    "",
  )}`;
}

function normalizeBarionStatus(status) {
  return String(status ?? "").trim() || "Unknown";
}

function isBarionPaymentSuccessful(status) {
  return BARION_SUCCESS_STATUSES.has(normalizeBarionStatus(status));
}

function isBarionPaymentCancelled(status) {
  return BARION_CANCELLED_STATUSES.has(normalizeBarionStatus(status));
}

function buildCheckoutRedirectUrl(order) {
  const base = config.barionRedirectUrl.replace(/\/+$/, "");
  const query = new URLSearchParams({
    barionOrderId: order.id,
  });
  return `${base}?${query.toString()}`;
}

function buildCallbackUrl(order) {
  const base = config.barionCallbackUrl.replace(/\/+$/, "");
  const query = new URLSearchParams({
    orderId: order.id,
  });
  return `${base}?${query.toString()}`;
}

function buildTransactionItems(order) {
  const items = order.items.map((item) => ({
    Name: item.name,
    Description: item.category,
    Quantity: item.quantity,
    Unit: "db",
    UnitPrice: item.unitPrice,
    ItemTotal: item.lineTotal,
  }));

  if (order.shippingPrice > 0) {
    items.push({
      Name: "Szállítási díj",
      Description: order.shippingMethod,
      Quantity: 1,
      Unit: "db",
      UnitPrice: order.shippingPrice,
      ItemTotal: order.shippingPrice,
    });
  }

  if (order.discountAmount > 0) {
    items.push({
      Name: "Kedvezmény",
      Description: order.discountCode || "Kuponkedvezmény",
      Quantity: 1,
      Unit: "db",
      UnitPrice: -order.discountAmount,
      ItemTotal: -order.discountAmount,
    });
  }

  return items;
}

async function barionRequest(path, payload) {
  const response = await fetch(buildBarionUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.Errors?.length) {
    const error = new Error(
      body?.Errors?.[0]?.Description ||
        body?.Errors?.[0]?.Title ||
        body?.Description ||
        "A Barion API-hívás sikertelen volt.",
    );
    error.code = "BARION_API_ERROR";
    error.status = response.status;
    error.payload = body;
    throw error;
  }

  return body;
}

async function barionGet(path, query) {
  const url = new URL(buildBarionUrl(path));
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const body = await response.json().catch(() => null);

  if (!response.ok || body?.Errors?.length) {
    const error = new Error(
      body?.Errors?.[0]?.Description ||
        body?.Errors?.[0]?.Title ||
        body?.Description ||
        "A Barion API-hívás sikertelen volt.",
    );
    error.code = "BARION_API_ERROR";
    error.status = response.status;
    error.payload = body;
    throw error;
  }

  return body;
}

async function startBarionPayment(order) {
  if (!isBarionConfigured()) {
    const error = new Error(
      "A Barion integráció még nincs készre konfigurálva a szerveren.",
    );
    error.code = "BARION_NOT_CONFIGURED";
    throw error;
  }

  const payload = {
    POSKey: config.barionPosKey,
    PaymentType: "Immediate",
    GuestCheckOut: true,
    FundingSources: config.barionFundingSources,
    PaymentRequestId: order.id,
    OrderNumber: order.id,
    Currency: config.barionCurrency,
    Locale: config.barionLocale,
    PayerHint: order.contactEmail,
    RedirectUrl: buildCheckoutRedirectUrl(order),
    CallbackUrl: buildCallbackUrl(order),
    Transactions: [
      {
        POSTransactionId: `${order.id}-1`,
        Payee: config.barionPayee,
        Total: order.total,
        Comment: `Serona rendelés ${order.id}`,
        Items: buildTransactionItems(order),
      },
    ],
  };

  const response = await barionRequest("/Payment/Start", payload);

  return {
    provider: "barion",
    paymentId: response.PaymentId,
    paymentRequestId: response.PaymentRequestId || order.id,
    status: normalizeBarionStatus(response.Status),
    redirectUrl: response.GatewayUrl,
    raw: response,
  };
}

async function getBarionPaymentState(paymentId) {
  const response = await barionGet("/Payment/GetPaymentState", {
    POSKey: config.barionPosKey,
    PaymentId: paymentId,
  });

  return {
    paymentId: response.PaymentId,
    paymentRequestId: response.PaymentRequestId || null,
    status: normalizeBarionStatus(response.Status),
    raw: response,
  };
}

module.exports = {
  getBarionPaymentState,
  isBarionConfigured,
  isBarionPaymentCancelled,
  isBarionPaymentSuccessful,
  normalizeBarionStatus,
  startBarionPayment,
};
