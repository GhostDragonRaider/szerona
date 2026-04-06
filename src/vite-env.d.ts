/**
 * Vite környezeti típusdeklarációk (pl. import.meta.env típusai).
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Éles domain (pl. https://serona.hu) – OG/sitemap abszolút URL-ekhez buildnél vagy előnézetnél. */
  readonly VITE_SITE_URL?: string;
  /** Backend API alap URL fejlesztéshez vagy külön hosztolt API-hoz. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
