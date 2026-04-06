/**
 * Világos / sötét színséma váltása; localStorage + opcionális prefers-color-scheme első betöltéskor.
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
import { useCookieConsent } from "./CookieConsentContext";

const STORAGE_KEY = "szerona_color_mode_v1";

export type ColorMode = "light" | "dark";

interface ThemeModeContextValue {
  mode: ColorMode;
  setMode: (m: ColorMode) => void;
  /** Gyors váltás a két mód között. */
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function getInitialMode(): ColorMode {
  /** Egyelőre mindig sötét indulás (nincs téma gomb; régi localStorage light nem maradhat). */
  return "dark";
}

function readStoredMode(): ColorMode | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "light" || raw === "dark" ? raw : null;
  } catch {
    return null;
  }
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const { hasConsent } = useCookieConsent();
  const [mode, setMode] = useState<ColorMode>(getInitialMode);
  const canPersistPreference = hasConsent("preferences");

  useEffect(() => {
    if (!canPersistPreference) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* */
      }
      return;
    }

    const storedMode = readStoredMode();
    if (storedMode && storedMode !== mode) {
      setMode(storedMode);
    }
  }, [canPersistPreference, mode]);

  useEffect(() => {
    if (canPersistPreference) {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        /* */
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* */
      }
    }
    document.documentElement.dataset.colorMode = mode;
    document.documentElement.style.colorScheme = mode;
  }, [canPersistPreference, mode]);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, toggleMode }),
    [mode, toggleMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return ctx;
}
