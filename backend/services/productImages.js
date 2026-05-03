const fs = require("fs");
const path = require("path");
const { config } = require("../config");

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function sanitizeBaseName(filename) {
  return String(filename ?? "product")
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48) || "product";
}

function saveProductImageUpload({ filename, mimeType, data }) {
  const extension = ALLOWED_IMAGE_TYPES.get(mimeType);
  if (!extension) {
    const error = new Error("Csak JPG, PNG vagy WEBP kép tölthető fel.");
    error.status = 400;
    throw error;
  }

  const buffer = Buffer.from(String(data ?? ""), "base64");
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
    const error = new Error("A kép mérete legfeljebb 5 MB lehet.");
    error.status = 400;
    throw error;
  }

  const uploadDir = path.join(path.dirname(config.sqlitePath), "uploads", "products");
  fs.mkdirSync(uploadDir, { recursive: true });

  const safeName = sanitizeBaseName(filename);
  const targetName = `${Date.now()}-${safeName}.${extension}`;
  fs.writeFileSync(path.join(uploadDir, targetName), buffer, { mode: 0o640 });

  return `/uploads/products/${targetName}`;
}

module.exports = {
  saveProductImageUpload,
};
