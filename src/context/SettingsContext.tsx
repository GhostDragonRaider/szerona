/**
 * Oldal szintű beállítások: hero alcím, kiemelő szín, szekciók láthatósága.
 * Az admin „Általános” panel módosítja; localStorage-ban marad.
 * A jelszó módosítás (admin) külön kulcsban tárolódik.
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
import { seronaTheme } from "../theme/emotionTheme";

import {
  getStoredAdminPassword,
  setStoredAdminPassword,
} from "../utils/adminPassword";

const SETTINGS_KEY = "szerona_site_settings_v1";

export interface SiteSettings {
  heroSubtitle: string;
  /** Hex szín, pl. #ff3d5a – accent felülírás */
  accentColor: string;
  showNewsSection: boolean;
  showCategoryStrip: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  heroSubtitle: "Utcai divat. Merész színek. Te vagy a középpontban.",
  accentColor: seronaTheme.colors.accent,
  showNewsSection: true,
  showCategoryStrip: true,
};

function loadSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SiteSettings> & {
        heroTitle?: string;
      };
      const { heroTitle: _removed, ...rest } = parsed;
      return { ...DEFAULT_SETTINGS, ...rest };
    }
  } catch {
    /* */
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: SiteSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

interface SettingsContextValue {
  settings: SiteSettings;
  updateSettings: (patch: Partial<SiteSettings>) => void;
  /** Admin jelszó változtatás – következő bejelentkezéshez (admin felhasználó). */
  changeAdminPassword: (
    currentPassword: string,
    newPassword: string,
  ) => { ok: boolean; message?: string };
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() =>
    typeof window === "undefined" ? DEFAULT_SETTINGS : loadSettings(),
  );

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const changeAdminPassword = useCallback(
    (currentPassword: string, newPassword: string) => {
      const stored = getStoredAdminPassword();
      if (currentPassword !== stored) {
        return { ok: false, message: "A jelenlegi jelszó nem egyezik." };
      }
      if (newPassword.length < 4) {
        return { ok: false, message: "Az új jelszó legalább 4 karakter legyen." };
      }
      setStoredAdminPassword(newPassword);
      return { ok: true };
    },
    [],
  );

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      changeAdminPassword,
    }),
    [settings, updateSettings, changeAdminPassword],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
