export const COOKIE_CONSENT_COOKIE_NAME = "serona_cookie_consent";
export const COOKIE_CONSENT_VERSION = "2026-04-06";
export const COOKIE_CONSENT_MAX_AGE_DAYS = 180;

export type CookieConsentOptionalCategory =
  | "preferences"
  | "analytics"
  | "marketing";

export interface CookieConsentPreferences {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  version: string;
  decidedAt: string;
  preferences: CookieConsentPreferences;
}

const DEFAULT_PREFERENCES: CookieConsentPreferences = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

function isBrowser() {
  return typeof document !== "undefined";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function defaultCookieConsentPreferences(): CookieConsentPreferences {
  return { ...DEFAULT_PREFERENCES };
}

export function acceptAllCookieConsentPreferences(): CookieConsentPreferences {
  return {
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
  };
}

export function normalizeCookieConsentPreferences(
  value?: Partial<CookieConsentPreferences>,
): CookieConsentPreferences {
  return {
    necessary: true,
    preferences: Boolean(value?.preferences),
    analytics: Boolean(value?.analytics),
    marketing: Boolean(value?.marketing),
  };
}

function findCookieValue(name: string) {
  if (!isBrowser()) return null;

  const prefix = `${name}=`;
  const entry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(prefix));

  return entry ? entry.slice(prefix.length) : null;
}

export function readCookieConsentRecord(): CookieConsentRecord | null {
  const raw = findCookieValue(COOKIE_CONSENT_COOKIE_NAME);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      decodeURIComponent(raw),
    ) as Partial<CookieConsentRecord>;

    if (!isObject(parsed)) return null;
    if (typeof parsed.version !== "string") return null;
    if (typeof parsed.decidedAt !== "string") return null;

    return {
      version: parsed.version,
      decidedAt: parsed.decidedAt,
      preferences: normalizeCookieConsentPreferences(parsed.preferences),
    };
  } catch {
    return null;
  }
}

export function isCookieConsentCurrent(record: CookieConsentRecord | null) {
  return Boolean(record && record.version === COOKIE_CONSENT_VERSION);
}

export function buildCookieConsentRecord(
  preferences: Partial<CookieConsentPreferences>,
): CookieConsentRecord {
  return {
    version: COOKIE_CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    preferences: normalizeCookieConsentPreferences(preferences),
  };
}

export function writeCookieConsentRecord(record: CookieConsentRecord) {
  if (!isBrowser()) return;

  const normalizedRecord: CookieConsentRecord = {
    version: COOKIE_CONSENT_VERSION,
    decidedAt: record.decidedAt,
    preferences: normalizeCookieConsentPreferences(record.preferences),
  };

  const encoded = encodeURIComponent(JSON.stringify(normalizedRecord));
  const maxAge = COOKIE_CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearCookieConsentRecord() {
  if (!isBrowser()) return;

  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
