import backend from "./backend/index.js";

const { app, ensureReady } = backend;

function buildQueryString(searchParams) {
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function createVercelProxyHandler(basePath) {
  return async function handler(req, res) {
    await ensureReady();

    const originalUrl = new URL(req.url ?? "/", "http://localhost");
    const rewrittenUrl = new URL(originalUrl.pathname, "http://localhost");
    const path = originalUrl.searchParams.get("path");

    originalUrl.searchParams.delete("path");

    if (path) {
      const normalizedPath = path
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean)
        .join("/");

      req.url = `${basePath}/${normalizedPath}${buildQueryString(originalUrl.searchParams)}`;
    } else {
      req.url = `${basePath}${buildQueryString(originalUrl.searchParams)}`;
    }

    rewrittenUrl.pathname = req.url.split("?")[0] || basePath;

    return app(req, res);
  };
}
