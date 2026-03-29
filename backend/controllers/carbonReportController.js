const { calculateWeeklyFootprint } = require("../utils/calculateWeeklyFootprint");
const { buildCarbonReportHtml } = require("../services/carbonReportHtml");
const { generatePdfBuffer } = require("../services/carbonReportPdf");

function validateHabitsBody(body) {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  return null;
}

/**
 * POST /api/footprint/report/pdf
 * Body: { habits, displayName? } OR habits at root (same shape as /dashboard)
 * Recalculates footprint on server (source of truth) and returns application/pdf.
 */
exports.postCarbonScorePdf = async (req, res) => {
  const err = validateHabitsBody(req.body);
  if (err) return res.status(400).json({ error: err });

  try {
    const habits = req.body.habits != null ? req.body.habits : req.body;
    const fromJwt = req.user?.displayName;
    const fromBody = req.body.displayName;
    const displayName = String(fromBody || fromJwt || "Guest").trim().slice(0, 120) || "Guest";

    const footprint = calculateWeeklyFootprint(habits);
    const html = buildCarbonReportHtml(footprint, habits, displayName);
    const pdf = await generatePdfBuffer(html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="CUTThecarbon-Carbon-Score-Report.pdf"');
    res.setHeader("Content-Length", pdf.length);
    return res.send(Buffer.from(pdf));
  } catch (e) {
    if (e && e.code === "PUPPETEER_UNAVAILABLE") {
      return res.status(503).json({
        error: "PDF engine not installed",
        detail: "Run npm install puppeteer in the project root, then restart the API.",
      });
    }
    console.error("carbonReportPdf:", e);
    return res.status(500).json({
      error: "PDF generation failed",
      detail: e.message || String(e),
    });
  }
};
