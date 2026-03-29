const express = require("express");
const footprintController = require("../controllers/footprintController");
const carbonReportController = require("../controllers/carbonReportController");
const { authOptional, authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/calculate", authOptional, footprintController.postCalculate);
router.post("/recommendations", authOptional, footprintController.postRecommendations);
router.post("/dashboard", authOptional, footprintController.postDashboard);
router.get("/weekly/history", authRequired, footprintController.getWeeklyHistory);
router.get("/offsets", footprintController.getOffsetsCatalog);
router.get("/factors", footprintController.getFactors);
router.post("/coach", authOptional, footprintController.postCoach);
router.post("/report/pdf", authOptional, carbonReportController.postCarbonScorePdf);

module.exports = router;
