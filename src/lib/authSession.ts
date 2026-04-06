import type { BillingAddress, UserRole } from "../data/types";

export const AUTH_SESSION_EVENT = "serona-auth-session-changed";

const SESSION_KEY = "szerona_auth_session_v3";
const LEGACY_KEYS = ["szerona_auth_session_v2"];

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  phone?: string;
  displayName: string;
  billing: BillingAddress;
  emailVerified?: boolean;
}

export interface StoredAuthSession {
  token: string;
  refreshToken: string;
  user: SessionUser;
}

function emitSessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

function removeLegacySessions() {
  if (typeof window === "undefined") return;
  for (const legacyKey of LEGACY_KEYS) {
    localStorage.removeItem(legacyKey);
  }
}

export function loadAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;

  removeLegacySessions();

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.token || !parsed?.refreshToken || !parsed?.user?.username) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: StoredAuthSession | null) {
  if (typeof window === "undefined") return;

  removeLegacySessions();

  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    emitSessionChange();
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emitSessionChange();
}

export function clearAuthSession() {
  saveAuthSession(null);
}
