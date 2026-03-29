/**
 * Alkalmazás szintű provider-ek: beállítások → színséma (világos/sötét) → dinamikus Emotion téma → auth → …
 */
import type { ReactNode } from "react";
import { ThemeProvider, useTheme } from "@emotion/react";
import { useEffect, useMemo } from "react";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ProductsProvider } from "../context/ProductsContext";
import { SearchProvider } from "../context/SearchContext";
import { SettingsProvider, useSettings } from "../context/SettingsContext";
import { ThemeModeProvider, useThemeMode } from "../context/ThemeModeContext";
import {
  seronaThemeDark,
  seronaThemeLight,
} from "../theme/emotionTheme";

/** Szinkronizálja a body háttér/szöveg színét a kiválasztott Emotion témával. */
function BodyThemeSync() {
  const theme = useTheme();
  useEffect(() => {
    document.body.style.backgroundColor = theme.colors.bg;
    document.body.style.color = theme.colors.text;
  }, [theme]);
  return null;
}

function DynamicTheme({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const { mode } = useThemeMode();
  const theme = useMemo(() => {
    const base = mode === "light" ? seronaThemeLight : seronaThemeDark;
    const accent = settings.accentColor || base.colors.accent;
    return {
      ...base,
      colors: {
        ...base.colors,
        accent,
        accentSoft: `${accent}26`,
        gradientAccent: `linear-gradient(90deg, ${accent}, #f97316, #eab308)`,
      },
    };
  }, [settings, mode]);

  return (
    <ThemeProvider theme={theme}>
      <BodyThemeSync />
      {children}
    </ThemeProvider>
  );
}

function SettingsThemeAndMode({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ThemeModeProvider>
        <DynamicTheme>{children}</DynamicTheme>
      </ThemeModeProvider>
    </SettingsProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsThemeAndMode>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <SearchProvider>{children}</SearchProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </SettingsThemeAndMode>
  );
}
