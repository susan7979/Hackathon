const express = require("express");
const router = express.Router();
const { authOptional, authRequired } = require("../middleware/auth");
const pledgesController = require("../controllers/pledgesController");

router.get("/", authOptional, pledgesController.list);
router.post("/", authRequired, pledgesController.create);

module.exports = router;
