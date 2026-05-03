const { config } = require("../config");
const { saveInvoicePdfFromResponse } = require("./invoiceFiles");

function isSzamlazzConfigured() {
  return Boolean(config.szamlazzEnabled);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateLike) {
  const date = new Date(dateLike);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function grossToNet(gross, vatRate) {
  if (!vatRate) {
    return roundMoney(gross);
  }

  return roundMoney(Number(gross) / (1 + vatRate / 100));
}

function buildInvoiceItems(order) {
  const vatRate = config.invoiceVatRate;
  const items = order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    grossUnitPrice: item.unitPrice,
    note: item.category,
  }));

  if (order.shippingPrice > 0) {
    items.push({
      name: "Szállítási díj",
      quantity: 1,
      grossUnitPrice: order.shippingPrice,
      note: order.shippingMethod,
    });
  }

  if (order.discountAmount > 0) {
    items.push({
      name: `Kedvezmény${order.discountCode ? ` (${order.discountCode})` : ""}`,
      quantity: 1,
      grossUnitPrice: -order.discountAmount,
      note: "Kuponkedvezmény",
    });
  }

  return items.map((item) => {
    const netUnitPrice = grossToNet(item.grossUnitPrice, vatRate);
    const netTotal = roundMoney(netUnitPrice * item.quantity);
    const grossTotal = roundMoney(item.grossUnitPrice * item.quantity);
    const vatTotal = roundMoney(grossTotal - netTotal);

    return {
      ...item,
      netUnitPrice,
      netTotal,
      grossTotal,
      vatTotal,
      vatRate,
    };
  });
}

function resolveInvoicePaymentMethod(order) {
  if (order.paymentMethod === "transfer") {
    return "Átutalás";
  }

  if (order.paymentMethod === "card") {
    return "Bankkártya";
  }

  return "Utánvét";
}

function resolvePaymentDueDate(order) {
  if (order.paymentMethod !== "transfer") {
    return formatDate(order.confirmedAt || order.createdAt || new Date());
  }

  const created = new Date(order.createdAt || Date.now());
  created.setDate(created.getDate() + config.transferPaymentDueDays);
  return formatDate(created);
}

function buildInvoiceXml(order) {
  const invoiceDate = formatDate(order.confirmedAt || order.createdAt || new Date());
  const completionDate = invoiceDate;
  const paymentDueDate = resolvePaymentDueDate(order);
  const itemsXml = buildInvoiceItems(order)
    .map(
      (item) => `
      <tetel>
        <megnevezes>${escapeXml(item.name)}</megnevezes>
        <mennyiseg>${escapeXml(item.quantity)}</mennyiseg>
        <mennyisegiEgyseg>db</mennyisegiEgyseg>
        <nettoEgysegar>${escapeXml(item.netUnitPrice.toFixed(2))}</nettoEgysegar>
        <afakulcs>${escapeXml(item.vatRate)}</afakulcs>
        <nettoErtek>${escapeXml(item.netTotal.toFixed(2))}</nettoErtek>
        <afaErtek>${escapeXml(item.vatTotal.toFixed(2))}</afaErtek>
        <bruttoErtek>${escapeXml(item.grossTotal.toFixed(2))}</bruttoErtek>
        <megjegyzes>${escapeXml(item.note || "")}</megjegyzes>
      </tetel>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla">
  <beallitasok>
    <szamlaagentkulcs>${escapeXml(config.szamlazzAgentKey)}</szamlaagentkulcs>
    <eszamla>${config.szamlazzEInvoice ? "true" : "false"}</eszamla>
    <szamlaLetoltes>${config.szamlazzDownloadPdf ? "true" : "false"}</szamlaLetoltes>
    <valaszVerzio>2</valaszVerzio>
  </beallitasok>
  <fejlec>
    <keltDatum>${invoiceDate}</keltDatum>
    <teljesitesDatum>${completionDate}</teljesitesDatum>
    <fizetesiHataridoDatum>${paymentDueDate}</fizetesiHataridoDatum>
    <fizmod>${escapeXml(resolveInvoicePaymentMethod(order))}</fizmod>
    <penznem>HUF</penznem>
    <szamlaNyelve>hu</szamlaNyelve>
    <megjegyzes>${escapeXml(`Serona rendelés ${order.id}`)}</megjegyzes>
    <rendelesSzam>${escapeXml(order.id)}</rendelesSzam>
  </fejlec>
  <elado></elado>
  <vevo>
    <nev>${escapeXml(order.billing.fullName || order.shipping.fullName)}</nev>
    <orszag>${escapeXml(order.billing.country || "Magyarország")}</orszag>
    <irsz>${escapeXml(order.billing.zip)}</irsz>
    <telepules>${escapeXml(order.billing.city)}</telepules>
    <cim>${escapeXml(
      [order.billing.line1, order.billing.line2].filter(Boolean).join(", "),
    )}</cim>
    <email>${escapeXml(order.contactEmail)}</email>
    <sendEmail>true</sendEmail>
  </vevo>
  <tetelek>${itemsXml}
  </tetelek>
</xmlszamla>`;
}

function extractHeader(headers, key) {
  return headers.get(key) || headers.get(key.toLowerCase());
}

function extractXmlValue(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>([^<]+)</${tagName}>`, "i");
  return xml.match(pattern)?.[1] ?? null;
}

async function createInvoiceForOrder(order) {
  if (!isSzamlazzConfigured()) {
    const error = new Error(
      "A Számlázz.hu integráció még nincs készre konfigurálva a szerveren.",
    );
    error.code = "SZAMLAZZ_NOT_CONFIGURED";
    throw error;
  }

  const xml = buildInvoiceXml(order);
  const form = new FormData();
  form.set(
    "action-xmlagentxmlfile",
    new Blob([xml], { type: "application/xml" }),
    "invoice.xml",
  );

  const response = await fetch(config.szamlazzApiBaseUrl, {
    method: "POST",
    body: form,
  });
  const bodyText = await response.text();

  if (!response.ok) {
    const error = new Error(
      bodyText || "A Számlázz.hu számlagenerálás sikertelen volt.",
    );
    error.code = "SZAMLAZZ_API_ERROR";
    error.status = response.status;
    throw error;
  }

  const invoiceNumber =
    extractHeader(response.headers, "szlahu_szamlaszam") ||
    extractHeader(response.headers, "szlahu_invoice_number") ||
    extractXmlValue(bodyText, "szamlaszam");

  if (!invoiceNumber) {
    const error = new Error(
      "A Számlázz.hu válaszból nem sikerült kiolvasni a számlaszámot.",
    );
    error.code = "SZAMLAZZ_INVALID_RESPONSE";
    error.payload = bodyText;
    throw error;
  }

  const pdfPath = saveInvoicePdfFromResponse({
    invoiceNumber,
    responseText: bodyText,
  });

  return {
    provider: "szamlazzhu",
    invoiceNumber,
    createdAt: new Date().toISOString(),
    pdfPath,
    rawResponse: bodyText,
  };
}

module.exports = {
  createInvoiceForOrder,
  isSzamlazzConfigured,
};
