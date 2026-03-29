/**
 * Renders HTML to PDF via Puppeteer (optional dependency).
 */

async function generatePdfBuffer(html) {
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    const err = new Error("PUPPETEER_UNAVAILABLE");
    err.code = "PUPPETEER_UNAVAILABLE";
    throw err;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    /* Match content width: A4 (~794px) minus ~18mm L/R margins (~136px) ≈ 658px */
    await page.setViewport({ width: 658, height: 1100, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "load", timeout: 60000 });
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "18mm", right: "18mm" },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = { generatePdfBuffer };
