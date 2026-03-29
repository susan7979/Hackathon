/**
 * Printable HTML for Carbon Score PDF (Puppeteer). Matches weekly footprint model.
 */
const factors = require("../data/emissionFactors.json");
const { legacyToWeeklyHabits } = require("../utils/calculateWeeklyFootprint");

function escapeHtml(s) {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tonnesFromKg(kg, decimals = 2) {
  const n = Number(kg);
  if (!Number.isFinite(n)) return "—";
  return (n / 1000).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

const TIER_LABEL = {
  below_average: "Below US average",
  average: "Near US average",
  above_average: "Above US average",
};

const MODE_LABEL = {
  car: "Car",
  hybrid_ev: "Hybrid / EV",
  transit: "Public transit",
  bike: "Bike",
  walk: "Walk",
  remote: "Remote",
};

function topCategoryKey(breakdownKg) {
  const keys = ["commute", "flights", "diet", "shopping", "home"];
  let best = "commute";
  let max = -1;
  for (const k of keys) {
    const v = breakdownKg?.[k] ?? 0;
    if (v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

function recommendationsFromBreakdown(breakdownKg) {
  const tips = {
    commute: "Reduce weekly driving: combine trips, try transit or carpool.",
    flights: "Fewer flights—especially long-haul—lowers aviation emissions quickly.",
    diet: "More plant-forward meals typically lowers food-related emissions.",
    shopping: "Buy fewer new goods and choose durable items to trim consumption emissions.",
    home: "Lower electricity use and improve efficiency at home.",
  };
  const ranked = ["commute", "flights", "diet", "shopping", "home"]
    .map((k) => ({ k, kg: breakdownKg?.[k] ?? 0 }))
    .sort((a, b) => b.kg - a.kg);
  const out = [];
  for (const { k } of ranked) {
    if ((breakdownKg?.[k] ?? 0) > 0 && tips[k]) out.push(tips[k]);
    if (out.length >= 5) break;
  }
  if (out.length === 0) out.push("Keep logging each week to spot trends and focus on your largest categories.");
  return out;
}

/**
 * @param {object} footprint — from calculateWeeklyFootprint
 * @param {object} habits — raw request habits
 * @param {string} displayName
 */
function buildCarbonReportHtml(footprint, habits, displayName) {
  const name = escapeHtml(displayName || "Guest");
  const dateStr = escapeHtml(
    new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
  );
  const h = legacyToWeeklyHabits(habits || {});
  const comp = footprint.comparison || {};
  const budget = footprint.carbonBudget || {};
  const tier = TIER_LABEL[comp.relativeToUs] || TIER_LABEL.average;
  const weeklyKg = footprint.weeklyKgCO2e ?? 0;
  const projectedAnnual = footprint.projectedAnnualKgCO2e ?? footprint.annualKgCO2e ?? 0;
  const mode = String(h.commute?.mode || "car").toLowerCase();
  const kgPerKm = factors.commuteKgPerKm[mode] ?? 0;
  const topKey = topCategoryKey(footprint.breakdownKg);
  const topLabel = {
    commute: "Transportation",
    flights: "Flights",
    diet: "Food & diet",
    shopping: "Shopping & goods",
    home: "Home energy",
  }[topKey];
  const recs = recommendationsFromBreakdown(footprint.breakdownKg);

  const commute = h.commute || {};
  const flights = h.flights || {};
  const home = h.home || {};
  const shopping = h.shopping || {};

  const strength =
    comp.relativeToUs === "below_average"
      ? "You are below the modeled US average for this week’s projection—a relative strength."
      : comp.relativeToUs === "average"
        ? "You are near the modeled US average; small shifts in your top categories can move the needle."
        : "Your projected footprint is above the modeled US average; focusing on your largest categories will help most.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>CUTThecarbon — Carbon Score Report</title>
  <style>
    /* Times = readable serif (closest to Latin Modern text in stock fonts). Courier for numeric / formula blocks. */
    @page {
      size: A4;
      margin: 0;
    }
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    html {
      margin: 0;
      padding: 0;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow-x: hidden;
      font-family: "Times New Roman", Times, "Liberation Serif", "Noto Serif", serif;
      font-weight: 400;
      color: #1a2e24;
      font-size: 10pt;
      line-height: 1.65;
      letter-spacing: normal;
      word-spacing: normal;
      text-align: left;
      text-justify: none;
      hyphens: none;
      -webkit-hyphens: none;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: normal;
    }
    p,
    li,
    td,
    .callout,
    .meta,
    .section-note,
    .cat,
    footer {
      letter-spacing: normal;
      word-spacing: normal;
      text-align: left;
    }
    .wrap {
      max-width: 100%;
      width: 100%;
      min-width: 0;
      margin: 0;
      padding: 0;
    }
    .brand {
      font-family: "Times New Roman", Times, "Liberation Serif", serif;
      font-size: 13pt;
      font-weight: 700;
      color: #0f5132;
      letter-spacing: normal;
      line-height: 1.35;
      margin: 0 0 4px;
    }
    .doc-title {
      font-family: "Times New Roman", Times, "Liberation Serif", serif;
      font-size: 16pt;
      font-weight: 700;
      line-height: 1.25;
      color: #1b4332;
      margin: 0 0 14px;
    }
    .meta {
      font-size: 9.5pt;
      line-height: 1.55;
      color: #4a5c52;
      margin: 0 0 20px;
    }
    h2 {
      font-family: "Times New Roman", Times, "Liberation Serif", serif;
      font-size: 11pt;
      font-weight: 700;
      line-height: 1.35;
      color: #1b4332;
      border-bottom: 2px solid rgba(45, 106, 79, 0.35);
      padding-bottom: 6px;
      margin: 28px 0 14px;
      text-align: left;
      letter-spacing: normal;
    }
    h2:first-of-type {
      margin-top: 20px;
    }
    p {
      margin: 0 0 12px;
      line-height: 1.65;
      max-width: 100%;
    }
    ul {
      margin: 0 0 16px;
      padding: 0 0 0 1.1rem;
    }
    li {
      margin: 0 0 8px;
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .summary-grid {
      display: table;
      table-layout: fixed;
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px;
      font-size: 10pt;
      line-height: 1.55;
    }
    .summary-grid tr:nth-child(even) { background: #f4faf6; }
    .summary-grid td {
      border: 1px solid #cfe8d8;
      padding: 8px 10px;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: anywhere;
      max-width: 0;
    }
    .summary-grid td:first-child {
      font-weight: 600;
      color: #1b4332;
      width: 38%;
    }
    .summary-grid td:nth-child(2) {
      font-family: "Courier New", Courier, "Liberation Mono", monospace;
      font-size: 9.5pt;
    }
    .callout {
      font-family: "Courier New", Courier, "Liberation Mono", monospace;
      background: linear-gradient(135deg, rgba(57, 255, 136, 0.12), rgba(27, 67, 50, 0.06));
      border: 1px solid rgba(45, 106, 79, 0.35);
      border-radius: 8px;
      padding: 12px 14px;
      margin: 14px 0 18px;
      font-size: 9.5pt;
      line-height: 1.65;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }
    .muted { color: #5c6d64; font-size: 9.5pt; }
    .section-note {
      font-size: 9.5pt;
      color: #4a5c52;
      margin: 0 0 12px;
      line-height: 1.55;
    }
    .cat {
      margin: 16px 0;
      padding: 12px 14px;
      border-left: 4px solid #2d6a4f;
      background: #fafdfb;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .cat h3 {
      font-family: "Times New Roman", Times, "Liberation Serif", serif;
      margin: 0 0 10px;
      font-size: 10pt;
      font-weight: 700;
      line-height: 1.35;
      color: #1b4332;
      letter-spacing: normal;
    }
    .cat p:last-child {
      margin-bottom: 0;
    }
    footer {
      margin: 30px 0 0;
      padding-top: 14px;
      border-top: 1px solid #cfe8d8;
      font-size: 9pt;
      line-height: 1.55;
      color: #6b7a72;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    strong {
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">CUTThecarbon</div>
    <h1 class="doc-title">Carbon Score Report</h1>
    <div class="meta">
      <strong>Prepared for:</strong> ${name}<br/>
      <strong>Date generated:</strong> ${dateStr}<br/>
      <span class="muted">Reporting period: this check-in week (${escapeHtml(footprint.weekStart || "")} – ${escapeHtml(footprint.weekEnd || "")}, ${escapeHtml(footprint.weekKey || "")})</span>
    </div>

    <h2>1. Summary</h2>
    <p>These figures use the same model as your on-screen Carbon Score. Weekly values are primary; yearly numbers are a <em>projection</em> (this week × 52) for comparison to annual benchmarks.</p>
    <table class="summary-grid" role="presentation">
      <tr><td>This week’s footprint</td><td>${tonnesFromKg(weeklyKg)} metric tonnes CO₂e / week</td></tr>
      <tr><td>Projected yearly footprint</td><td>${tonnesFromKg(projectedAnnual)} metric tonnes CO₂e / year (×52)</td></tr>
      <tr><td>Sustainability score</td><td>${footprint.footprintScore ?? "—"} (0–100)</td></tr>
      <tr><td>Letter grade</td><td>${escapeHtml(String(footprint.grade ?? "—"))}</td></tr>
      <tr><td>Status vs US benchmark</td><td>${escapeHtml(tier)}</td></tr>
      <tr><td>Global benchmark (yearly ref.)</td><td>${tonnesFromKg(comp.globalAverageAnnualKg ?? 4700, 1)} t CO₂e / yr — you are at <strong>${comp.yourPercentOfGlobalAverage ?? "—"}%</strong></td></tr>
      <tr><td>US benchmark (yearly ref.)</td><td>${tonnesFromKg(comp.usAverageAnnualKg ?? 14900, 1)} t CO₂e / yr — you are at <strong>${comp.yourPercentOfUsAverage ?? "—"}%</strong></td></tr>
      <tr><td>Fair-share target (yearly ref.)</td><td>${tonnesFromKg(budget.targetAnnualKg ?? 2500, 2)} t CO₂e / yr</td></tr>
    </table>
    <div class="callout">
      <strong>Short summary:</strong> This week’s modeled total is <strong>${tonnesFromKg(weeklyKg)} t CO₂e / week</strong>
      (${escapeHtml(tier)} vs the US benchmark in this model). Projected yearly: <strong>${tonnesFromKg(projectedAnnual)} t</strong> if every week matched this one.
    </div>

    <h2>2. What each number means</h2>
    <ul>
      <li><strong>This week’s footprint:</strong> Estimated greenhouse gases from the activities you logged for the week, in CO₂-equivalent.</li>
      <li><strong>Projected yearly footprint:</strong> Weekly total × 52 — a steady-state estimate to compare with annual benchmarks (not a forecast of your exact year).</li>
      <li><strong>Sustainability score:</strong> Summarizes how your weekly total compares to a global reference slice; higher usually means lower relative emissions in this model.</li>
      <li><strong>Grade:</strong> Compares your weekly total to a weekly fair-share slice aligned with a simple climate goal in the app.</li>
      <li><strong>US / global percentages:</strong> Your projected annual total vs reference averages — same ratios as comparing week to week.</li>
      <li><strong>Fair-share target:</strong> A simplified per-person budget used for grading and context, not a regulatory limit.</li>
    </ul>

    <h2>3. Calculation breakdown</h2>
    <p class="section-note">Categories add up to this week’s total. Factors come from the app’s emission factor table.</p>

    <div class="cat">
      <h3>Transportation</h3>
      <p><strong>Your input:</strong> mode ${escapeHtml(MODE_LABEL[mode] || mode)}; ~${Math.round(Number(commute.commuteKmThisWeek) || 0)} km this week.</p>
      <p><strong>Factor:</strong> ${kgPerKm} kg CO₂e per km.</p>
      <p><strong>This week’s contribution:</strong> ${tonnesFromKg(footprint.breakdownKg?.commute ?? 0)} t CO₂e / week.</p>
      <p><strong>Why it matters:</strong> More distance or higher-emission modes increases this block.</p>
    </div>
    <div class="cat">
      <h3>Flights</h3>
      <p><strong>Your input:</strong> ${Number(flights.shortHaulThisWeek) || 0} short-haul and ${Number(flights.longHaulThisWeek) || 0} long-haul trip(s) this week.</p>
      <p><strong>Factor:</strong> ${factors.flightKgPerTrip.shortHaul} kg per short trip, ${factors.flightKgPerTrip.longHaul} kg per long trip (approximate).</p>
      <p><strong>This week’s contribution:</strong> ${tonnesFromKg(footprint.breakdownKg?.flights ?? 0)} t CO₂e / week.</p>
    </div>
    <div class="cat">
      <h3>Food &amp; diet</h3>
      <p><strong>Your input:</strong> diet pattern <strong>${escapeHtml(String(h.diet || "average"))}</strong>.</p>
      <p><strong>Factor:</strong> Annual tier estimate ÷ 52 for a weekly food-system footprint.</p>
      <p><strong>This week’s contribution:</strong> ${tonnesFromKg(footprint.breakdownKg?.diet ?? 0)} t CO₂e / week.</p>
    </div>
    <div class="cat">
      <h3>Shopping &amp; consumption</h3>
      <p><strong>Your input:</strong> level <strong>${escapeHtml(String(shopping.level || "medium"))}</strong>.</p>
      <p><strong>Factor:</strong> Annual tier ÷ 52 (goods &amp; services proxy).</p>
      <p><strong>This week’s contribution:</strong> ${tonnesFromKg(footprint.breakdownKg?.shopping ?? 0)} t CO₂e / week.</p>
    </div>
    <div class="cat">
      <h3>Home energy</h3>
      <p><strong>Your input:</strong> ~${Math.round(Number(home.kwhThisWeek) || 0)} kWh this week.</p>
      <p><strong>Factor:</strong> ${factors.electricityKgPerKwh} kg CO₂e per kWh (grid mix proxy).</p>
      <p><strong>This week’s contribution:</strong> ${tonnesFromKg(footprint.breakdownKg?.home ?? 0)} t CO₂e / week.</p>
    </div>

    <h2>4. How your score was determined</h2>
    <p>The sustainability score compares this week’s total to a <strong>weekly slice</strong> of the global reference (same idea as on screen). The letter grade compares your weekly total to a weekly fair-share slice. It’s an educational model—plain, transparent, not a legal or official rating.</p>

    <h2>5. Benchmark comparison</h2>
    <p><strong>Global average</strong> is a worldwide per-person reference. <strong>US average</strong> is higher (typical per-capita emissions). Your percentages show how your <em>projected annual</em> total compares—useful for apples-to-apples with those yearly figures.</p>

    <h2>6. Personalized interpretation</h2>
    <p><strong>Largest share this week:</strong> ${escapeHtml(topLabel)} (${tonnesFromKg(footprint.breakdownKg?.[topKey] ?? 0)} t CO₂e / week).</p>
    <p>${strength}</p>

    <h2>7. Suggestions</h2>
    <ul>
      ${recs.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
    </ul>

    <footer>
      CUTThecarbon — educational estimate only; not a certified carbon audit. Factors and benchmarks are simplified for learning and planning.
    </footer>
  </div>
</body>
</html>`;
}

module.exports = { buildCarbonReportHtml, escapeHtml, tonnesFromKg };
