const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { getSessionById, touchSession } = require("../db");

function extractBearerToken(headerValue) {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function requireAuth(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      ok: false,
      message: "Hianyzik a hitelesitesi token.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      audience: config.jwtAudience,
      issuer: config.jwtIssuer,
    });

    const sessionId = payload?.sid;
    if (!sessionId) {
      res.status(401).json({
        ok: false,
        message: "Ervenytelen munkamenet.",
      });
      return;
    }

    const session = await getSessionById(sessionId);
    if (!session || session.revoked || Date.parse(session.expires_at) <= Date.now()) {
      res.status(401).json({
        ok: false,
        message: "Ervenytelen vagy lejart bejelentkezes.",
      });
      return;
    }

    await touchSession(sessionId);

    req.auth = payload;
    req.authToken = token;
    req.authSession = session;
    next();
  } catch {
    res.status(401).json({
      ok: false,
      message: "Ervenytelen vagy lejart bejelentkezes.",
    });
  }
}

module.exports = { requireAuth };
