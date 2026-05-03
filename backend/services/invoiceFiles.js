const fs = require("fs");
const path = require("path");
const { config } = require("../config");

function getInvoiceDirectory() {
  return config.invoiceDir;
}

function sanitizeInvoiceNumber(invoiceNumber) {
  return String(invoiceNumber ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_.-]/g, "_");
}

function getInvoicePdfPath(invoiceNumber) {
  const safeName = sanitizeInvoiceNumber(invoiceNumber);
  if (!safeName) {
    return null;
  }

  return path.join(getInvoiceDirectory(), `${safeName}.pdf`);
}

function ensureInvoiceDirectory() {
  fs.mkdirSync(getInvoiceDirectory(), { recursive: true });
}

function extractXmlValue(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i");
  const value = String(xml ?? "").match(pattern)?.[1] ?? null;
  if (!value) return null;

  return value.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
}

function saveInvoicePdfFromResponse({ invoiceNumber, responseText }) {
  const pdfBase64 = extractXmlValue(responseText, "pdf");
  if (!pdfBase64) {
    return null;
  }

  const targetPath = getInvoicePdfPath(invoiceNumber);
  if (!targetPath) {
    return null;
  }

  ensureInvoiceDirectory();
  const pdfBuffer = Buffer.from(pdfBase64.replace(/\s+/g, ""), "base64");
  fs.writeFileSync(targetPath, pdfBuffer, { mode: 0o640 });
  return targetPath;
}

function invoicePdfExists(invoiceNumber) {
  const targetPath = getInvoicePdfPath(invoiceNumber);
  return Boolean(targetPath && fs.existsSync(targetPath));
}

function getInvoicePdf(invoiceNumber) {
  const targetPath = getInvoicePdfPath(invoiceNumber);
  if (!targetPath || !fs.existsSync(targetPath)) {
    return null;
  }

  return {
    path: targetPath,
    filename: `${sanitizeInvoiceNumber(invoiceNumber)}.pdf`,
  };
}

module.exports = {
  getInvoiceDirectory,
  getInvoicePdf,
  invoicePdfExists,
  saveInvoicePdfFromResponse,
};
