/**
 * Vite bundler konfiguráció: React plugin, dev szerver, build kimenet.
 * Ez a fájl határozza meg, hogyan fordul a React alkalmazás éles és fejlesztői módban.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "public",
});
