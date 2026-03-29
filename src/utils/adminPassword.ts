/**
 * Admin jelszó olvasása localStorage-ból (alapértelmezés: "admin").
 * Külön fájl, hogy az Auth és a Settings kontextus ne körkörösen importáljon.
 */
const ADMIN_PASS_KEY = "szerona_admin_password_v1";

export function getStoredAdminPassword(): string {
  if (typeof window === "undefined") return "admin";
  return localStorage.getItem(ADMIN_PASS_KEY) ?? "admin";
}

export function setStoredAdminPassword(password: string): void {
  localStorage.setItem(ADMIN_PASS_KEY, password);
}
