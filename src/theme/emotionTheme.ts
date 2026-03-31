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

/** Sötét: mély szürke–fekete rétegek, finom „központi fény”, referencia szerint. */
const darkPageMesh = `
  radial-gradient(ellipse 130% 95% at 50% -8%, rgba(38, 38, 44, 0.5) 0%, transparent 52%),
  radial-gradient(ellipse 75% 55% at 88% 12%, rgba(22, 22, 28, 0.42) 0%, transparent 48%),
  radial-gradient(ellipse 60% 45% at 15% 35%, rgba(18, 18, 22, 0.35) 0%, transparent 45%),
  linear-gradient(180deg, #0a0a0c 0%, #000000 40%, #050506 100%)
`.trim();

/** Világos: halvány fekete → fehér átmenet (korábban a logó mögött); alatta a mező szürke alapszín. */
const lightPageMesh = `
  linear-gradient(
    145deg,
    rgba(15, 23, 42, 0.1) 0%,
    rgba(255, 255, 255, 0.78) 42%,
    #ffffff 100%
  ),
  #f0f2f5
`.trim();

/** Sötét mód: minimalista fekete, fehér szöveg, erős jelenlét (kontraszt, finom mélység). */
export const seronaThemeDark = {
  ...shared,
  colors: {
    bg: "#000000",
    surface: "#0a0a0a",
    surfaceElevated: "#111111",
    text: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.82)",
    accent: "#ff3d5a",
    accentSoft: "rgba(255, 61, 90, 0.12)",
    secondary: "#3b82f6",
    secondarySoft: "rgba(255, 255, 255, 0.06)",
    success: "#4ade80",
    border: "rgba(255,255,255,0.1)",
    pageBackground: darkPageMesh,
    gradientHero: darkPageMesh,
    gradientAccent: "linear-gradient(90deg, #ff3d5a, #f97316, #eab308)",
    overlay: "rgba(0, 0, 0, 0.65)",
    headerBg: "rgba(5, 5, 5, 0.88)",
    productImageBg: "#ffffff",
    onAccent: "#ffffff",
    headerSurface: "#000000",
    headerText: "#ffffff",
    headerTextMuted: "rgba(255, 255, 255, 0.78)",
    headerBorder: "rgba(255, 255, 255, 0.12)",
    headerInputBg: "rgba(255, 255, 255, 0.08)",
    headerInputBorder: "rgba(255, 255, 255, 0.28)",
    mobileNavBg: "#000000",
    mobileNavText: "rgba(255, 255, 255, 0.55)",
    mobileNavTextActive: "#ffffff",
  },
  shadows: {
    card: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px rgba(0,0,0,0.55)",
    glow: "0 0 48px rgba(255, 61, 90, 0.22)",
  },
} as const;

/** Világos mód – fehér alap, finom szürke átmenetek, sötét szöveg. */
export const seronaThemeLight = {
  ...shared,
  colors: {
    bg: "#f0f2f5",
    surface: "#ffffff",
    surfaceElevated: "#f1f5f9",
    text: "#0f172a",
    textMuted: "#64748b",
    accent: "#e11d48",
    accentSoft: "rgba(225, 29, 72, 0.12)",
    secondary: "#2563eb",
    secondarySoft: "rgba(37, 99, 235, 0.12)",
    success: "#16a34a",
    border: "rgba(15, 23, 42, 0.1)",
    pageBackground: lightPageMesh,
    gradientHero: lightPageMesh,
    gradientAccent: "linear-gradient(90deg, #e11d48, #f97316, #ca8a04)",
    overlay: "rgba(15, 23, 42, 0.45)",
    headerBg: "rgba(255, 255, 255, 0.96)",
    productImageBg: "#ffffff",
    onAccent: "#ffffff",
    headerSurface: "#ffffff",
    headerText: "#0f172a",
    headerTextMuted: "rgba(15, 23, 42, 0.62)",
    headerBorder: "rgba(15, 23, 42, 0.1)",
    headerInputBg: "rgba(15, 23, 42, 0.05)",
    headerInputBorder: "rgba(15, 23, 42, 0.14)",
    mobileNavBg: "#ffffff",
    mobileNavText: "rgba(15, 23, 42, 0.5)",
    mobileNavTextActive: "#0f172a",
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
