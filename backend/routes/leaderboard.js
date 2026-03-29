const express = require("express");
const leaderboardController = require("../controllers/leaderboardController");
const { authOptional, authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authOptional, leaderboardController.getLeaderboard);
router.post("/submit", authRequired, leaderboardController.postSubmitFootprint);

module.exports = router;
