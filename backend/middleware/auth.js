const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.JWT_SECRET || "dev-only-change-JWT_SECRET-in-env";
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

function authOptional(req, _res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return next();
  const token = h.slice(7);
  try {
    req.user = jwt.verify(token, getSecret());
  } catch {
    req.user = null;
  }
  next();
}

function authRequired(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    req.user = jwt.verify(h.slice(7), getSecret());
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { signToken, authOptional, authRequired, getSecret };
