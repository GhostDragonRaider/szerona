/**
 * Emotion Theme interfész – sötét és világos mód ugyanazokat a kulcsokat használja.
 */
import "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
    colors: {
      bg: string;
      surface: string;
      surfaceElevated: string;
      text: string;
      textMuted: string;
      accent: string;
      accentSoft: string;
      secondary: string;
      secondarySoft: string;
      success: string;
      border: string;
      /** Teljes oldal / hero: rétegzett háttér (gradiens + sugár). */
      pageBackground: string;
      gradientHero: string;
      gradientAccent: string;
      overlay: string;
      headerBg: string;
      productImageBg: string;
      onAccent: string;
      /** Fejléc sáv (világos/sötét egyező szerep). */
      headerSurface: string;
      headerText: string;
      headerTextMuted: string;
      headerBorder: string;
      headerInputBg: string;
      headerInputBorder: string;
      /** Mobil alsó navigáció. */
      mobileNavBg: string;
      mobileNavText: string;
      mobileNavTextActive: string;
    };
    fonts: { display: string; body: string };
    space: Record<string, string>;
    radii: Record<string, string>;
    shadows: Record<string, string>;
    breakpoints: Record<string, string>;
  }
}
