const fs = require("fs");
const path = require("path");
const { config } = require("../config");
const { getDataFilePath, readJsonFile, writeJsonFile } = require("./jsonStore");

const BACKUP_META_FILE = "backup-meta.json";
const BACKUP_DIR = path.join(path.dirname(config.sqlitePath), "backups");
const BACKUP_INTERVAL_MS = 60 * 1000;

let backupTimer = null;

function getBackupMeta() {
  return readJsonFile(BACKUP_META_FILE, {
    lastBackupAt: null,
    lastBackupPath: null,
    lastRestoreAt: null,
  });
}

function writeBackupMeta(meta) {
  writeJsonFile(BACKUP_META_FILE, meta);
}

function getTimestampName(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function createDatabaseBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  if (!fs.existsSync(config.sqlitePath)) {
    return getBackupMeta();
  }

  const createdAt = new Date().toISOString();
  const backupPath = path.join(BACKUP_DIR, `serona-${getTimestampName(new Date(createdAt))}.sqlite`);
  fs.copyFileSync(config.sqlitePath, backupPath);

  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((entry) => entry.endsWith(".sqlite"))
    .map((entry) => path.join(BACKUP_DIR, entry))
    .sort();

  while (backups.length > 120) {
    fs.rmSync(backups.shift(), { force: true });
  }

  const meta = {
    ...getBackupMeta(),
    lastBackupAt: createdAt,
    lastBackupPath: backupPath,
  };
  writeBackupMeta(meta);
  return meta;
}

function restoreLatestDatabaseBackup() {
  const meta = getBackupMeta();
  if (!meta.lastBackupPath || !fs.existsSync(meta.lastBackupPath)) {
    const error = new Error("Nincs visszaállítható biztonsági mentés.");
    error.code = "NO_BACKUP";
    throw error;
  }

  const safetyCopyPath = getDataFilePath(
    `pre-restore-${getTimestampName()}.sqlite`,
  );
  if (fs.existsSync(config.sqlitePath)) {
    fs.copyFileSync(config.sqlitePath, safetyCopyPath);
  }

  fs.copyFileSync(meta.lastBackupPath, config.sqlitePath);
  const nextMeta = {
    ...meta,
    lastRestoreAt: new Date().toISOString(),
    preRestoreBackupPath: safetyCopyPath,
  };
  writeBackupMeta(nextMeta);
  return nextMeta;
}

function startBackupScheduler() {
  if (backupTimer || config.databaseUrl) {
    return;
  }

  try {
    createDatabaseBackup();
  } catch (error) {
    console.error("Az adatbázis biztonsági mentése sikertelen:", error);
  }

  backupTimer = setInterval(() => {
    try {
      createDatabaseBackup();
    } catch (error) {
      console.error("Az adatbázis biztonsági mentése sikertelen:", error);
    }
  }, BACKUP_INTERVAL_MS);
  backupTimer.unref?.();
}

module.exports = {
  createDatabaseBackup,
  getBackupMeta,
  restoreLatestDatabaseBackup,
  startBackupScheduler,
};
