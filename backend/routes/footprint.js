const express = require("express");
const footprintController = require("../controllers/footprintController");

const router = express.Router();

router.post("/calculate", footprintController.postCalculate);
router.post("/recommendations", footprintController.postRecommendations);
router.post("/dashboard", footprintController.postDashboard);
router.get("/offsets", footprintController.getOffsetsCatalog);
router.get("/factors", footprintController.getFactors);
router.post("/coach", footprintController.postCoach);

module.exports = router;
