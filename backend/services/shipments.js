const { config } = require("../config");

function isGlsConfigured() {
  return Boolean(
    config.glsApiBaseUrl &&
      config.glsClientNumber &&
      config.glsUsername &&
      config.glsPassword,
  );
}

async function createGlsShipmentForOrder(order) {
  if (!isGlsConfigured()) {
    const error = new Error(
      "A GLS integráció még nincs beállítva. Töltsd ki a GLS API-hitelesítési adatokat.",
    );
    error.code = "GLS_NOT_CONFIGURED";
    throw error;
  }

  const error = new Error(
    "A GLS shipment létrehozása scaffold szinten előkészítve van, de a konkrét API-mappinget a kapott GLS szerződéses adatokhoz kell illeszteni.",
  );
  error.code = "GLS_IMPLEMENTATION_PENDING";
  error.details = {
    orderId: order.id,
    clientReference: order.id,
    baseUrl: config.glsApiBaseUrl,
  };
  throw error;
}

module.exports = {
  createGlsShipmentForOrder,
  isGlsConfigured,
};
