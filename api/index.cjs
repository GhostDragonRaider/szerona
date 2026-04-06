const { app, ensureReady } = require("../backend/index");

module.exports = async (req, res) => {
  await ensureReady();
  return app(req, res);
};
