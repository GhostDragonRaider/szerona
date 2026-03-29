/**
 * Bejelentkezés, regisztráció, kijelentkezés – mock tároló localStorage-ban.
 * Profil (név, számlázás, kártyák) külön kulcsban, felhasználónév szerint.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BillingAddress,
  SavedCard,
  User,
  UserRole,
} from "../data/types";
import { getStoredAdminPassword } from "../utils/adminPassword";

const USERS_KEY = "szerona_users_v1";
const SESSION_KEY = "szerona_session_v1";
const PROFILES_KEY = "szerona_account_profiles_v1";

interface StoredUser {
  username: string;
  email: string;
  /** Demo: jelszó tárolása titkosítás nélkül – csak frontend prototípus! */
  password: string;
  role: UserRole;
}

interface Session {
  username: string;
  role: UserRole;
  email: string;
}

interface StoredProfile {
  displayName?: string;
  billing?: Partial<BillingAddress>;
  cards?: SavedCard[];
}

const DEFAULT_BILLING: BillingAddress = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  zip: "",
  country: "Magyarország",
};

/** Mindig jelen van a listában (localStorage felülírhatja ugyanazzal a névvel). */
const DEFAULT_USERS: StoredUser[] = [
  {
    username: "teszt",
    email: "teszt@serona.hu",
    password: "teszt",
    role: "user",
  },
];

function loadUsers(): StoredUser[] {
  let parsed: StoredUser[] = [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as StoredUser[];
      if (Array.isArray(p)) parsed = p;
    }
  } catch {
    /* */
  }
  const byName = new Map<string, StoredUser>();
  for (const d of DEFAULT_USERS) {
    byName.set(d.username, d);
  }
  for (const u of parsed) {
    byName.set(u.username, u);
  }
  return Array.from(byName.values());
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  if (!s) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function loadProfiles(): Record<string, StoredProfile> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Record<string, StoredProfile>;
      if (p && typeof p === "object") return p;
    }
  } catch {
    /* */
  }
  return {};
}

function saveProfiles(profiles: Record<string, StoredProfile>) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function mergeBilling(partial?: Partial<BillingAddress>): BillingAddress {
  return { ...DEFAULT_BILLING, ...partial };
}

function getStoredProfile(username: string): StoredProfile {
  return loadProfiles()[username] ?? {};
}

function buildUserFromSession(session: Session | null): User | null {
  if (!session) return null;
  const prof = getStoredProfile(session.username);
  const billing = mergeBilling(prof.billing);
  const cards = prof.cards ?? [];

  if (session.username === "admin") {
    return {
      username: "admin",
      email: session.email,
      role: "admin",
      displayName: prof.displayName?.trim() || "Admin",
      billing,
      cards,
    };
  }

  const u = loadUsers().find((x) => x.username === session.username);
  if (!u) return null;
  return {
    username: u.username,
    email: u.email,
    role: u.role,
    displayName: prof.displayName?.trim() || u.username,
    billing,
    cards,
  };
}

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => { ok: boolean; message?: string };
  register: (
    username: string,
    email: string,
    password: string,
  ) => { ok: boolean; message?: string };
  logout: () => void;
  isAdmin: boolean;
  updateDisplayName: (displayName: string) => void;
  updateBilling: (billing: BillingAddress) => void;
  addCard: (card: Omit<SavedCard, "id">) => { ok: boolean; message?: string };
  removeCard: (cardId: string) => void;
  changeAccountEmail: (
    newEmail: string,
    currentPassword: string,
  ) => { ok: boolean; message?: string };
  changeAccountPassword: (
    currentPassword: string,
    newPassword: string,
  ) => { ok: boolean; message?: string };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return buildUserFromSession(loadSession());
  });

  useEffect(() => {
    setUser(buildUserFromSession(loadSession()));
  }, []);

  const refreshUser = useCallback(() => {
    setUser(buildUserFromSession(loadSession()));
  }, []);

  const login = useCallback((username: string, password: string) => {
    const u = username.trim();
    const p = password;
    if (u === "admin" && p === getStoredAdminPassword()) {
      const session: Session = {
        username: "admin",
        email: "admin@serona.hu",
        role: "admin",
      };
      saveSession(session);
      setUser(buildUserFromSession(session));
      return { ok: true };
    }
    const users = loadUsers();
    const found = users.find((x) => x.username === u && x.password === p);
    if (!found) {
      return { ok: false, message: "Hibás felhasználónév vagy jelszó." };
    }
    const session: Session = {
      username: found.username,
      email: found.email,
      role: found.role,
    };
    saveSession(session);
    setUser(buildUserFromSession(session));
    return { ok: true };
  }, []);

  const register = useCallback(
    (username: string, email: string, password: string) => {
      const u = username.trim();
      if (u.length < 3) {
        return { ok: false, message: "A felhasználónév legalább 3 karakter legyen." };
      }
      if (password.length < 4) {
        return { ok: false, message: "A jelszó legalább 4 karakter legyen." };
      }
      if (u === "admin") {
        return { ok: false, message: "Ez a felhasználónév nem választható." };
      }
      const users = loadUsers();
      if (users.some((x) => x.username === u)) {
        return { ok: false, message: "Ez a felhasználónév már foglalt." };
      }
      const newUser: StoredUser = {
        username: u,
        email: email.trim(),
        password,
        role: "user",
      };
      saveUsers([...users, newUser]);
      const session: Session = {
        username: newUser.username,
        email: newUser.email,
        role: "user",
      };
      saveSession(session);
      setUser(buildUserFromSession(session));
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    saveSession(null);
    setUser(null);
  }, []);

  const patchProfile = useCallback(
    (username: string, patch: StoredProfile) => {
      const all = loadProfiles();
      const prev = all[username] ?? {};
      all[username] = { ...prev, ...patch };
      saveProfiles(all);
      refreshUser();
    },
    [refreshUser],
  );

  const updateDisplayName = useCallback(
    (displayName: string) => {
      const s = loadSession();
      if (!s) return;
      patchProfile(s.username, { displayName: displayName.trim() });
    },
    [patchProfile],
  );

  const updateBilling = useCallback(
    (billing: BillingAddress) => {
      const s = loadSession();
      if (!s) return;
      patchProfile(s.username, { billing });
    },
    [patchProfile],
  );

  const addCard = useCallback(
    (card: Omit<SavedCard, "id">) => {
      const s = loadSession();
      if (!s) return { ok: false, message: "Nincs bejelentkezve." };
      const last4 = card.last4.replace(/\D/g, "").slice(-4);
      if (last4.length !== 4) {
        return { ok: false, message: "Add meg a kártya utolsó 4 számjegyét." };
      }
      const prof = getStoredProfile(s.username);
      const cards = [...(prof.cards ?? [])];
      const newCard: SavedCard = {
        ...card,
        id: randomId(),
        last4,
      };
      cards.push(newCard);
      patchProfile(s.username, { cards });
      return { ok: true };
    },
    [patchProfile],
  );

  const removeCard = useCallback(
    (cardId: string) => {
      const s = loadSession();
      if (!s) return;
      const prof = getStoredProfile(s.username);
      const cards = (prof.cards ?? []).filter((c) => c.id !== cardId);
      patchProfile(s.username, { cards });
    },
    [patchProfile],
  );

  const changeAccountEmail = useCallback(
    (newEmail: string, currentPassword: string) => {
      const s = loadSession();
      if (!s) return { ok: false, message: "Nincs bejelentkezve." };
      const email = newEmail.trim();
      if (!email.includes("@")) {
        return { ok: false, message: "Érvénytelen e-mail cím." };
      }

      if (s.username === "admin") {
        if (currentPassword !== getStoredAdminPassword()) {
          return { ok: false, message: "A jelenlegi jelszó nem egyezik." };
        }
        const next: Session = { ...s, email };
        saveSession(next);
        refreshUser();
        return { ok: true };
      }

      const users = loadUsers();
      const idx = users.findIndex((x) => x.username === s.username);
      if (idx < 0) return { ok: false, message: "Felhasználó nem található." };
      if (users[idx].password !== currentPassword) {
        return { ok: false, message: "A jelenlegi jelszó nem egyezik." };
      }
      users[idx] = { ...users[idx], email };
      saveUsers(users);
      const next: Session = { ...s, email };
      saveSession(next);
      refreshUser();
      return { ok: true };
    },
    [refreshUser],
  );

  const changeAccountPassword = useCallback(
    (currentPassword: string, newPassword: string) => {
      const s = loadSession();
      if (!s) return { ok: false, message: "Nincs bejelentkezve." };
      if (s.username === "admin") {
        return {
          ok: false,
          message: "Admin jelszót az Admin → Általános beállításokban változtathatod.",
        };
      }
      if (newPassword.length < 4) {
        return { ok: false, message: "Az új jelszó legalább 4 karakter legyen." };
      }
      const users = loadUsers();
      const idx = users.findIndex((x) => x.username === s.username);
      if (idx < 0) return { ok: false, message: "Felhasználó nem található." };
      if (users[idx].password !== currentPassword) {
        return { ok: false, message: "A jelenlegi jelszó nem egyezik." };
      }
      users[idx] = { ...users[idx], password: newPassword };
      saveUsers(users);
      return { ok: true };
    },
    [],
  );

  const isAdmin = user?.role === "admin";

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      isAdmin,
      updateDisplayName,
      updateBilling,
      addCard,
      removeCard,
      changeAccountEmail,
      changeAccountPassword,
    }),
    [
      user,
      login,
      register,
      logout,
      isAdmin,
      updateDisplayName,
      updateBilling,
      addCard,
      removeCard,
      changeAccountEmail,
      changeAccountPassword,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
