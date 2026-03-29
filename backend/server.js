const path = require("path");
// Project root .env, then backend/.env (backend wins for duplicate keys)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "carbon-footprint-negotiator" });
});

const footprintRoutes = require("./routes/footprint");
const authRoutes = require("./routes/auth");
const leaderboardRoutes = require("./routes/leaderboard");

app.use("/api/footprint", footprintRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.get("/api", (_req, res) => {
  res.json({
    name: "Carbon Footprint Negotiator API",
    endpoints: {
      health: "GET /health",
      authRegister: "POST /api/auth/register",
      authLogin: "POST /api/auth/login",
      authMe: "GET /api/auth/me",
      leaderboard: "GET /api/leaderboard",
      leaderboardSubmit: "POST /api/leaderboard/submit",
      calculate: "POST /api/footprint/calculate",
      recommendations: "POST /api/footprint/recommendations",
      dashboard: "POST /api/footprint/dashboard",
      offsetsCatalog: "GET /api/footprint/offsets",
      factors: "GET /api/footprint/factors",
      coach: "POST /api/footprint/coach",
    },
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Carbon API on port ${PORT}`);
  console.log("  POST /api/footprint/dashboard | calculate | recommendations | coach");
  console.log("  GET  /api/footprint/offsets | factors");
  if (process.env.OPENAI_API_KEY) {
    console.log("  OPENAI_API_KEY loaded — AI coach / offset tips enabled");
  } else {
    console.log("  (Set OPENAI_API_KEY in backend/.env or project .env for AI coach)");
  }
  console.log("  POST /api/auth/register | login   GET /api/auth/me");
  console.log("  GET /api/leaderboard   POST /api/leaderboard/submit (auth)");
});