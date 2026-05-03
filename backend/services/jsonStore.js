const fs = require("fs");
const path = require("path");
const { config } = require("../config");

function getDataFilePath(filename) {
  const dataDir = path.dirname(config.sqlitePath);
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, filename);
}

function readJsonFile(filename, fallback) {
  const targetPath = getDataFilePath(filename);
  if (!fs.existsSync(targetPath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(targetPath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filename, value) {
  const targetPath = getDataFilePath(filename);
  fs.writeFileSync(targetPath, JSON.stringify(value, null, 2), { mode: 0o640 });
}

module.exports = {
  getDataFilePath,
  readJsonFile,
  writeJsonFile,
};
