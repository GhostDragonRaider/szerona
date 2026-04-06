/**
 * Oldal szintu beallitasok: hero alcim, kiemelo szin, szekciok lathatosaga.
 * Ezek jelenleg tovabbra is localStorage-ban maradnak.
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

const SETTINGS_KEY = "szerona_site_settings_v1";

export interface SiteSettings {
  heroSubtitle: string;
  accentColor: string;
  showNewsSection: boolean;
  showCategoryStrip: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  heroSubtitle: "Utcai divat. Meresz szinek. Te vagy a kozeppontban.",
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

function saveSettings(settings: SiteSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

interface SettingsContextValue {
  settings: SiteSettings;
  updateSettings: (patch: Partial<SiteSettings>) => void;
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
    setSettings((previous) => ({ ...previous, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
    }),
    [settings, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
