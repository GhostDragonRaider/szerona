const { PAYMENT_METHOD_IDS, SHIPPING_METHOD_IDS } = require("../constants/commerce");

function emptyOrTrimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email) {
  return emptyOrTrimmed(email).toLowerCase();
}

function normalizePhone(phone) {
  return emptyOrTrimmed(phone);
}

function normalizeBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function validateUsername(username) {
  if (username.length < 3 || username.length > 32) {
    return "A felhasznalonev 3 es 32 karakter kozott legyen.";
  }

  if (!/^[\p{L}\p{N}._-]+$/u.test(username)) {
    return "A felhasznalonev csak betuket, szamokat, pontot, alahuzast es kotujelet tartalmazhat.";
  }

  if (username.toLowerCase() === "admin") {
    return "Ez a felhasznalonev nem valaszthato.";
  }

  return null;
}

function validateEmail(email) {
  if (email.length < 6 || email.length > 320) {
    return "Adj meg egy ervenyes e-mail cimet.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Adj meg egy ervenyes e-mail cimet.";
  }

  return null;
}

function validatePassword(password, minimumLength = 8) {
  if (typeof password !== "string") {
    return "Add meg a jelszot.";
  }

  if (password.length < minimumLength) {
    return `A jelszo legalabb ${minimumLength} karakter legyen.`;
  }

  if (password.length > 72) {
    return "A jelszo legfeljebb 72 karakter lehet.";
  }

  return null;
}

function validatePhone(phone) {
  if (!phone) return null;

  if (phone.length > 32) {
    return "A telefonszam legfeljebb 32 karakter lehet.";
  }

  if (!/^[+\d\s()./-]+$/.test(phone)) {
    return "A telefonszam formatuma ervenytelen.";
  }

  return null;
}

function validateDisplayName(displayName) {
  if (!displayName) return null;

  if (displayName.length > 64) {
    return "A megjelenitett nev legfeljebb 64 karakter lehet.";
  }

  return null;
}

function normalizeAddress(raw) {
  const address = raw && typeof raw === "object" ? raw : {};

  return {
    fullName: emptyOrTrimmed(address.fullName),
    line1: emptyOrTrimmed(address.line1),
    line2: emptyOrTrimmed(address.line2),
    city: emptyOrTrimmed(address.city),
    zip: emptyOrTrimmed(address.zip),
    country: emptyOrTrimmed(address.country) || "Magyarorszag",
  };
}

function validateAddress(address, label = "cim", { optional = false } = {}) {
  if (
    optional &&
    !address.fullName &&
    !address.line1 &&
    !address.city &&
    !address.zip &&
    !address.country
  ) {
    return null;
  }

  if (!address.fullName || address.fullName.length > 120) {
    return `A ${label} nev mezot toltsd ki helyesen.`;
  }

  if (!address.line1 || address.line1.length > 160) {
    return `A ${label} utca, hazszam mezot toltsd ki helyesen.`;
  }

  if (address.line2.length > 160) {
    return `A ${label} kiegeszito cim mezo tul hosszu.`;
  }

  if (!address.city || address.city.length > 120) {
    return `A ${label} telepules mezot toltsd ki helyesen.`;
  }

  if (!/^[0-9A-Za-z -]{3,12}$/.test(address.zip)) {
    return `A ${label} iranyitoszam ervenytelen.`;
  }

  if (!address.country || address.country.length > 120) {
    return `A ${label} orszag mezot toltsd ki helyesen.`;
  }

  return null;
}

const allowedCategories = new Set(["polo", "pulover", "nadrag", "cipo"]);

function validateProductInput(product) {
  const name = emptyOrTrimmed(product.name);
  const description = emptyOrTrimmed(product.description);
  const image = emptyOrTrimmed(product.image);
  const category = emptyOrTrimmed(product.category);
  const price = Number(product.price);
  const stockQuantity = Number(product.stockQuantity);

  if (!name || name.length > 160) {
    return "A termek neve kotelezo, legfeljebb 160 karakterrel.";
  }

  if (!allowedCategories.has(category)) {
    return "A termek kategoriaja ervenytelen.";
  }

  if (!Number.isInteger(price) || price < 0 || price > 100000000) {
    return "A termek aranak pozitiv egesz szamnak kell lennie.";
  }

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 1000000) {
    return "A keszlet mennyisegenek 0 vagy nagyobb egesz szamnak kell lennie.";
  }

  if (!image || image.length > 500) {
    return "A termek kep URL-je kotelezo.";
  }

  if (!description || description.length > 2000) {
    return "A termek leirasa kotelezo, legfeljebb 2000 karakterrel.";
  }

  return null;
}

function validatePaymentMethod(method) {
  if (!PAYMENT_METHOD_IDS.has(method)) {
    return "Ervenytelen fizetesi mod.";
  }

  return null;
}

function validateShippingMethod(method) {
  if (!SHIPPING_METHOD_IDS.has(method)) {
    return "Ervenytelen szallitasi mod.";
  }

  return null;
}

module.exports = {
  allowedCategories,
  emptyOrTrimmed,
  normalizeAddress,
  normalizeBoolean,
  normalizeEmail,
  normalizePhone,
  validateAddress,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validatePaymentMethod,
  validatePhone,
  validateProductInput,
  validateUsername,
  validateShippingMethod,
};
