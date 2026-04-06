/**
 * Backendes auth: regisztracio, belepes, session-visszatoltes, refresh token,
 * elfelejtett jelszo es szerveroldali profil/szamlazasi adatok.
 * A mentett fizetesi modok kulon backendes vegpontokon keresztul kezelhetok.
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
import { apiFetch, type ApiError } from "../lib/api";
import {
  AUTH_SESSION_EVENT,
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  type SessionUser,
  type StoredAuthSession,
} from "../lib/authSession";
import type { BillingAddress, User, UserRole } from "../data/types";

interface ApiAuthUser extends SessionUser {
  role: UserRole;
}

interface ApiAuthResponse {
  ok: boolean;
  message?: string;
  token: string;
  refreshToken?: string;
  user: ApiAuthUser;
}

interface ApiMessageResponse {
  ok: boolean;
  message?: string;
}

interface ApiRegisterResponse {
  ok: boolean;
  message?: string;
  emailVerification?: {
    enabled: boolean;
    sent?: boolean;
    message?: string;
    expiresAt?: string | null;
    devVerificationUrl?: string | null;
  };
}

interface ApiForgotPasswordResponse extends ApiMessageResponse {
  devResetToken?: string;
  devResetUrl?: string;
  devTargetEmail?: string;
  expiresAt?: string;
}

interface ApiVerificationResponse extends ApiMessageResponse {
  verificationEnabled?: boolean;
  devVerificationUrl?: string;
  expiresAt?: string;
}

interface AuthActionResult {
  ok: boolean;
  message?: string;
  user?: ApiAuthUser;
  devResetToken?: string;
  devResetUrl?: string;
  devVerificationUrl?: string;
  expiresAt?: string;
}

function buildUserFromSession(session: StoredAuthSession | null): User | null {
  if (!session) return null;

  return {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    role: session.user.role,
    phone: session.user.phone,
    displayName: session.user.displayName?.trim() || session.user.username,
    billing: session.user.billing,
    emailVerified: session.user.emailVerified,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const apiError = error as ApiError | null;
  if (apiError?.message) {
    return apiError.message;
  }

  return fallback;
}

function mergeSessionResponse(
  session: StoredAuthSession | null,
  response: ApiAuthResponse,
): StoredAuthSession {
  return {
    token: response.token,
    refreshToken: response.refreshToken ?? session?.refreshToken ?? "",
    user: response.user,
  };
}

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthActionResult>;
  register: (
    username: string,
    email: string,
    password: string,
    consents: {
      acceptTerms: boolean;
      acceptPrivacy: boolean;
    },
  ) => Promise<AuthActionResult>;
  logout: () => void;
  logoutAllSessions: () => Promise<AuthActionResult>;
  updateDisplayName: (displayName: string) => Promise<AuthActionResult>;
  updateBilling: (billing: BillingAddress) => Promise<AuthActionResult>;
  changeAccountEmail: (
    newEmail: string,
    currentPassword: string,
  ) => Promise<AuthActionResult>;
  changeAccountPassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<AuthActionResult>;
  updateAdminContact: (
    email: string,
    phone: string,
    currentPassword: string,
  ) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  requestEmailVerification: (identifier: string) => Promise<AuthActionResult>;
  confirmEmailVerification: (token: string) => Promise<AuthActionResult>;
  resetPassword: (
    token: string,
    newPassword: string,
  ) => Promise<AuthActionResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return buildUserFromSession(loadAuthSession());
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(loadAuthSession()?.token);
  });

  const applySession = useCallback((session: StoredAuthSession | null) => {
    if (session && !session.refreshToken) {
      saveAuthSession(null);
      setUser(null);
      return;
    }

    saveAuthSession(session);
    setUser(buildUserFromSession(session));
  }, []);

  useEffect(() => {
    function handleSessionEvent() {
      setUser(buildUserFromSession(loadAuthSession()));
      setIsLoading(false);
    }

    window.addEventListener(AUTH_SESSION_EVENT, handleSessionEvent);
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, handleSessionEvent);
    };
  }, []);

  useEffect(() => {
    const session = loadAuthSession();
    if (!session?.token || !session.refreshToken) {
      setIsLoading(false);
      return;
    }

    const initialRefreshToken = session.refreshToken;
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await apiFetch<ApiAuthResponse>("/api/auth/me", {
          auth: true,
        });

        if (cancelled) return;

        const latest = loadAuthSession();
        applySession(
          mergeSessionResponse(latest ?? session, {
            ...response,
            refreshToken: latest?.refreshToken ?? initialRefreshToken,
          }),
        );
      } catch {
        if (cancelled) return;
        applySession(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthActionResult> => {
      try {
        const response = await apiFetch<ApiAuthResponse>("/api/auth/login", {
          method: "POST",
          json: { username, password },
        });

        applySession({
          token: response.token,
          refreshToken: response.refreshToken ?? "",
          user: response.user,
        });

        return { ok: true, user: response.user };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(error, "Nem sikerult a belepes."),
        };
      }
    },
    [applySession],
  );

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      consents: {
        acceptTerms: boolean;
        acceptPrivacy: boolean;
      },
    ): Promise<AuthActionResult> => {
      try {
        const response = await apiFetch<ApiRegisterResponse>(
          "/api/auth/register",
          {
            method: "POST",
            json: { username, email, password, ...consents },
          },
        );

        return {
          ok: true,
          message: response.message,
          devVerificationUrl:
            response.emailVerification?.devVerificationUrl ?? undefined,
          expiresAt: response.emailVerification?.expiresAt ?? undefined,
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(error, "Nem sikerult a regisztracio."),
        };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    void apiFetch<ApiMessageResponse>("/api/auth/logout", {
      method: "POST",
      auth: true,
    }).catch(() => undefined);
    clearAuthSession();
    setUser(null);
  }, []);

  const logoutAllSessions = useCallback(async (): Promise<AuthActionResult> => {
    try {
      const response = await apiFetch<ApiMessageResponse>("/api/auth/logout-all", {
        method: "POST",
        auth: true,
      });

      applySession(null);
      return {
        ok: true,
        message: response.message ?? "Minden eszkozrol kijelentkeztettel.",
      };
    } catch (error) {
      return {
        ok: false,
        message: getErrorMessage(
          error,
          "Nem sikerult minden eszkozrol kijelentkezni.",
        ),
      };
    }
  }, [applySession]);

  const updateDisplayName = useCallback(
    async (displayName: string): Promise<AuthActionResult> => {
      const session = loadAuthSession();
      if (!session) {
        return { ok: false, message: "Nincs bejelentkezve." };
      }

      try {
        const response = await apiFetch<ApiAuthResponse & ApiMessageResponse>(
          "/api/account/profile",
          {
            method: "PATCH",
            auth: true,
            json: { displayName },
          },
        );

        applySession(mergeSessionResponse(session, response));

        return {
          ok: true,
          message: response.message ?? "Profil frissitve.",
          user: response.user,
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(error, "Nem sikerult a profil mentese."),
        };
      }
    },
    [applySession],
  );

  const updateBilling = useCallback(
    async (billing: BillingAddress): Promise<AuthActionResult> => {
      const session = loadAuthSession();
      if (!session) {
        return { ok: false, message: "Nincs bejelentkezve." };
      }

      try {
        const response = await apiFetch<ApiAuthResponse & ApiMessageResponse>(
          "/api/account/profile",
          {
            method: "PATCH",
            auth: true,
            json: { billing },
          },
        );

        applySession(mergeSessionResponse(session, response));

        return {
          ok: true,
          message: response.message ?? "Szamlazasi cim frissitve.",
          user: response.user,
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(
            error,
            "Nem sikerult a szamlazasi cim mentese.",
          ),
        };
      }
    },
    [applySession],
  );

  const changeAccountEmail = useCallback(
    async (
      newEmail: string,
      currentPassword: string,
    ): Promise<AuthActionResult> => {
      const session = loadAuthSession();
      if (!session) {
        return { ok: false, message: "Nincs bejelentkezve." };
      }

      try {
        const response = await apiFetch<ApiAuthResponse & ApiMessageResponse>(
          "/api/auth/email",
          {
            method: "PATCH",
            auth: true,
            json: { newEmail, currentPassword },
          },
        );

        applySession(mergeSessionResponse(session, response));

        return {
          ok: true,
          message: response.message ?? "E-mail cim frissitve.",
          user: response.user,
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(error, "Nem sikerult az e-mail csere."),
        };
      }
    },
    [applySession],
  );

  const changeAccountPassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<AuthActionResult> => {
      try {
        const response = await apiFetch<ApiMessageResponse>(
          "/api/auth/password",
          {
            method: "PATCH",
            auth: true,
            json: { currentPassword, newPassword },
          },
        );

        return {
          ok: true,
          message: response.message ?? "Jelszo frissitve.",
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(error, "Nem sikerult a jelszocsere."),
        };
      }
    },
    [],
  );

  const updateAdminContact = useCallback(
    async (
      email: string,
      phone: string,
      currentPassword: string,
    ): Promise<AuthActionResult> => {
      const session = loadAuthSession();
      if (!session) {
        return { ok: false, message: "Nincs bejelentkezve." };
      }

      if (session.user.role !== "admin") {
        return {
          ok: false,
          message: "Ehhez admin jogosultsag kell.",
        };
      }

      try {
        const response = await apiFetch<ApiAuthResponse & ApiMessageResponse>(
          "/api/auth/admin/profile",
          {
            method: "PATCH",
            auth: true,
            json: { email, phone, currentPassword },
          },
        );

        applySession(mergeSessionResponse(session, response));

        return {
          ok: true,
          message: response.message ?? "Admin adatok frissitve.",
          user: response.user,
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(
            error,
            "Nem sikerult az admin adatok frissitese.",
          ),
        };
      }
    },
    [applySession],
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      try {
        const response = await apiFetch<ApiForgotPasswordResponse>(
          "/api/auth/password/forgot",
          {
            method: "POST",
            json: { email },
          },
        );

        return {
          ok: true,
          message: response.message,
          devResetToken: response.devResetToken,
          devResetUrl: response.devResetUrl,
          expiresAt: response.expiresAt,
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(
            error,
            "Nem sikerult elinditani a jelszo-visszaallitast.",
          ),
        };
      }
    },
    [],
  );

  const requestEmailVerification = useCallback(
    async (identifier: string): Promise<AuthActionResult> => {
      try {
        const response = await apiFetch<ApiVerificationResponse>(
          "/api/auth/verification/request",
          {
            method: "POST",
            json: { identifier },
          },
        );

        return {
          ok: true,
          message: response.message,
          devVerificationUrl: response.devVerificationUrl,
          expiresAt: response.expiresAt,
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(
            error,
            "Nem sikerult uj megerosito levelet kerni.",
          ),
        };
      }
    },
    [],
  );

  const confirmEmailVerification = useCallback(
    async (token: string): Promise<AuthActionResult> => {
      try {
        const response = await apiFetch<ApiMessageResponse>(
          "/api/auth/verification/confirm",
          {
            method: "POST",
            json: { token },
          },
        );

        return {
          ok: true,
          message:
            response.message ?? "Az e-mail cimed sikeresen megerositesre kerult.",
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(
            error,
            "Nem sikerult megerositeni az e-mail cimet.",
          ),
        };
      }
    },
    [],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<AuthActionResult> => {
      try {
        const response = await apiFetch<ApiMessageResponse>(
          "/api/auth/password/reset",
          {
            method: "POST",
            json: { token, newPassword },
          },
        );

        return {
          ok: true,
          message: response.message ?? "A jelszo sikeresen frissult.",
        };
      } catch (error) {
        return {
          ok: false,
          message: getErrorMessage(
            error,
            "Nem sikerult visszaallitani a jelszot.",
          ),
        };
      }
    },
    [],
  );

  const isAdmin = user?.role === "admin";

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      isLoading,
      login,
      register,
      logout,
      logoutAllSessions,
      updateDisplayName,
      updateBilling,
      changeAccountEmail,
      changeAccountPassword,
      updateAdminContact,
      requestPasswordReset,
      requestEmailVerification,
      confirmEmailVerification,
      resetPassword,
    }),
    [
      user,
      isAdmin,
      isLoading,
      login,
      register,
      logout,
      logoutAllSessions,
      updateDisplayName,
      updateBilling,
      changeAccountEmail,
      changeAccountPassword,
      updateAdminContact,
      requestPasswordReset,
      requestEmailVerification,
      confirmEmailVerification,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
