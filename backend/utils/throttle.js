const { config } = require("../config");
const { addMinutes, getThrottle, upsertThrottle, clearThrottle } = require("../db");

function isLocked(record, now) {
  return Boolean(record?.locked_until && Date.parse(record.locked_until) > Date.parse(now));
}

async function ensureNotLocked(scope, throttleKey, now) {
  const record = await getThrottle(scope, throttleKey);

  if (record && isLocked(record, now)) {
    const error = new Error("Tul sok sikertelen probalkozas. Probald meg kesobb.");
    error.code = "THROTTLED";
    error.status = 429;
    error.lockedUntil = record.locked_until;
    throw error;
  }
}

async function registerFailure(scope, throttleKey, now) {
  const record = await getThrottle(scope, throttleKey);
  const windowStart = Date.parse(now) - config.bruteForceWindowMinutes * 60 * 1000;

  let attemptCount = 1;
  let firstAttemptAt = now;

  if (record && Date.parse(record.first_attempt_at) >= windowStart) {
    attemptCount = Number(record.attempt_count) + 1;
    firstAttemptAt = record.first_attempt_at;
  }

  const lockedUntil =
    attemptCount >= config.bruteForceMaxAttempts
      ? addMinutes(now, config.bruteForceLockMinutes)
      : null;

  await upsertThrottle({
    scope,
    throttleKey,
    attemptCount,
    firstAttemptAt,
    lastAttemptAt: now,
    lockedUntil,
  });

  return {
    attemptCount,
    lockedUntil,
  };
}

async function clearFailures(scope, throttleKey) {
  await clearThrottle(scope, throttleKey);
}

module.exports = {
  clearFailures,
  ensureNotLocked,
  registerFailure,
};
