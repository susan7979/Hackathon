const userStore = require("../services/userStore");
const { signToken } = require("../middleware/auth");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body) {
  const { email, password, displayName } = body || {};
  if (!email || !password || !displayName) {
    return "Email, password, and display name are required.";
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return "Invalid email address.";
  }
  if (String(password).length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (String(displayName).trim().length < 2) {
    return "Display name must be at least 2 characters.";
  }
  return null;
}

exports.postRegister = async (req, res) => {
  const err = validateRegister(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const user = await userStore.createUser({
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.displayName,
    });
    const token = signToken({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    });
    res.status(201).json({ token, user });
  } catch (e) {
    if (e.code === "EMAIL_TAKEN") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    res.status(500).json({ error: "Registration failed", detail: e.message });
  }
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const user = await userStore.verifyLogin(email, password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const token = signToken({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
  });
  res.json({ token, user });
};

exports.getMe = (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({
    user: {
      id: req.user.sub,
      email: req.user.email,
      displayName: req.user.displayName,
    },
  });
};
