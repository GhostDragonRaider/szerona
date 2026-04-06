import backend from "../../backend/index.js";

const { app, ensureReady } = backend;

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
