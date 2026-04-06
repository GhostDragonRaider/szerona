const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { generateOpaqueToken, hashToken } = require("./security");

function createSessionId() {
  return `sess_${generateOpaqueToken(18)}`;
}

function createResetToken() {
  return generateOpaqueToken(32);
}

function createVerificationToken() {
  return generateOpaqueToken(32);
}

function buildRefreshToken(sessionId) {
  return `${sessionId}.${generateOpaqueToken(48)}`;
}

function parseRefreshToken(refreshToken) {
  if (typeof refreshToken !== "string") return null;

  const [sessionId] = refreshToken.split(".", 1);
  if (!sessionId || !sessionId.startsWith("sess_")) {
    return null;
  }

  return {
    sessionId,
    refreshTokenHash: hashToken(refreshToken),
  };
}

function signAccessToken(user, sessionId, isAdminAccount = false) {
  return jwt.sign(
    {
      sub: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role,
      isAdminAccount,
      sid: sessionId,
    },
    config.jwtSecret,
    {
      expiresIn: config.accessTokenExpiresIn,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    },
  );
}

module.exports = {
  buildRefreshToken,
  createResetToken,
  createSessionId,
  createVerificationToken,
  parseRefreshToken,
  signAccessToken,
};
