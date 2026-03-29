const express = require("express");
const authController = require("../controllers/authController");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/register", authController.postRegister);
router.post("/login", authController.postLogin);
router.get("/me", authRequired, authController.getMe);

module.exports = router;
