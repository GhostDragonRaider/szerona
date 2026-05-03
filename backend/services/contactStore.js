const crypto = require("crypto");
const { readJsonFile, writeJsonFile } = require("./jsonStore");

const CONTACT_SETTINGS_FILE = "contact-settings.json";
const CONTACT_MESSAGES_FILE = "contact-messages.json";

const DEFAULT_CONTACT_SETTINGS = {
  phone: "+36 30 000 0000",
  email: "info@serona.hu",
  updatedAt: null,
};

function normalizeSettings(input = {}) {
  return {
    phone: String(input.phone ?? "").trim(),
    email: String(input.email ?? "").trim().toLowerCase(),
    updatedAt: new Date().toISOString(),
  };
}

function getContactSettings() {
  return {
    ...DEFAULT_CONTACT_SETTINGS,
    ...readJsonFile(CONTACT_SETTINGS_FILE, DEFAULT_CONTACT_SETTINGS),
  };
}

function updateContactSettings(input) {
  const settings = normalizeSettings(input);
  writeJsonFile(CONTACT_SETTINGS_FILE, settings);
  return settings;
}

function listContactMessages() {
  return readJsonFile(CONTACT_MESSAGES_FILE, []).sort((left, right) =>
    String(right.createdAt).localeCompare(String(left.createdAt)),
  );
}

function createContactMessage(input = {}) {
  const message = {
    id: `contact_${crypto.randomUUID()}`,
    name: String(input.name ?? "").trim(),
    email: String(input.email ?? "").trim().toLowerCase(),
    message: String(input.message ?? "").trim(),
    createdAt: new Date().toISOString(),
  };
  const messages = listContactMessages();
  writeJsonFile(CONTACT_MESSAGES_FILE, [message, ...messages]);
  return message;
}

function validateContactSettings(settings) {
  if (!settings.phone || settings.phone.length < 6) {
    return "Adj meg egy érvényes telefonszámot.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
    return "Adj meg egy érvényes e-mail címet.";
  }
  return null;
}

function validateContactMessage(message) {
  if (!message.name || message.name.length < 2) {
    return "A név legalább 2 karakter legyen.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.email)) {
    return "Adj meg egy érvényes e-mail címet.";
  }
  if (!message.message || message.message.length < 10) {
    return "Az üzenet legalább 10 karakter legyen.";
  }
  return null;
}

module.exports = {
  createContactMessage,
  getContactSettings,
  listContactMessages,
  updateContactSettings,
  validateContactMessage,
  validateContactSettings,
};
