/**
 * Emotion ThemeProvider számára: közös tipográfia/térközök, külön sötét és világos színpaletta.
 * A DynamicTheme (AppProviders) választ köztük, és az admin accent színt fújja rá.
 */
const shared = {
  fonts: {
    display: '"Bebas Neue", Impact, sans-serif',
    body: '"DM Sans", system-ui, sans-serif',
  },
  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem",
  },
  radii: {
    sm: "6px",
    md: "12px",
    lg: "20px",
    pill: "999px",
  },
  breakpoints: {
    sm: "480px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },
} as const;

/** Sötét mód: minimalista fekete, fehér szöveg, erős jelenlét (kontraszt, finom mélység). */
export const seronaThemeDark = {
  ...shared,
  colors: {
    bg: "#050505",
    surface: "#0a0a0a",
    surfaceElevated: "#111111",
    /** Egységes fehér szöveg (secondary / címkék is) */
    text: "#ffffff",
    textMuted: "#ffffff",
    accent: "#ff3d5a",
    accentSoft: "rgba(255, 61, 90, 0.12)",
    /** Másodlagos gombok / gradiens egyik színe – olvasható fehér szöveggel */
    secondary: "#3b82f6",
    secondarySoft: "rgba(255, 255, 255, 0.06)",
    success: "#4ade80",
    border: "rgba(255,255,255,0.1)",
    /** Egyszerű, mély háttér – kevés színzaj */
    gradientHero:
      "linear-gradient(165deg, #050505 0%, #0a0a0a 42%, #050505 100%)",
    gradientAccent: "linear-gradient(90deg, #ff3d5a, #f97316, #eab308)",
    overlay: "rgba(0, 0, 0, 0.65)",
    headerBg: "rgba(5, 5, 5, 0.88)",
    productImageBg: "#ffffff",
    onAccent: "#ffffff",
  },
  shadows: {
    /** Vékony fény + mély árnyék: „maximális jelenlét” minimál elemekkel */
    card: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px rgba(0,0,0,0.55)",
    glow: "0 0 48px rgba(255, 61, 90, 0.22)",
  },
} as const;

/** Világos mód – világos háttér, sötét szöveg, finomabb árnyékok. */
export const seronaThemeLight = {
  ...shared,
  colors: {
    bg: "#f4f6fb",
    surface: "#ffffff",
    surfaceElevated: "#eef1f8",
    text: "#0f172a",
    textMuted: "#64748b",
    accent: "#e11d48",
    accentSoft: "rgba(225, 29, 72, 0.12)",
    secondary: "#2563eb",
    secondarySoft: "rgba(37, 99, 235, 0.12)",
    success: "#16a34a",
    border: "rgba(15, 23, 42, 0.1)",
    gradientHero:
      "linear-gradient(135deg, #f4f6fb 0%, #fff5f7 38%, #eef2ff 72%, #f4f6fb 100%)",
    gradientAccent: "linear-gradient(90deg, #e11d48, #f97316, #ca8a04)",
    overlay: "rgba(15, 23, 42, 0.45)",
    headerBg: "rgba(255, 255, 255, 0.9)",
    productImageBg: "#ffffff",
    onAccent: "#ffffff",
  },
  shadows: {
    card: "0 8px 32px rgba(15, 23, 42, 0.08)",
    glow: "0 0 36px rgba(225, 29, 72, 0.2)",
  },
} as const;

/** Visszafelé kompatibilitás: a korábbi importok a sötét témát kapják. */
export const seronaTheme = seronaThemeDark;

export type SeronaThemeShape =
  | typeof seronaThemeDark
  | typeof seronaThemeLight;
