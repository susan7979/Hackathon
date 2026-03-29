/**
 * Client-side Carbon Score report PDF (matches backend calculateScore + emissionFactors).
 */
import { formatTonnesFromKg } from "./formatEmissions";

const FACTORS = {
  commuteKgPerKm: {
    car: 0.21,
    hybrid_ev: 0.08,
    transit: 0.05,
    bike: 0,
    walk: 0,
    remote: 0,
  },
  flightKgPerTrip: { shortHaul: 250, longHaul: 1100 },
  dietAnnualKg: {
    meat_heavy: 3600,
    average: 2500,
    vegetarian: 1700,
    vegan: 1500,
  },
  shoppingAnnualKg: { low: 500, medium: 1200, high: 2500 },
  electricityKgPerKwh: 0.42,
  benchmarks: {
    globalAverageAnnualKg: 4700,
    usAverageAnnualKg: 14900,
    parisAlignedPersonalAnnualKg: 2500,
  },
};

const WEEKS_PER_YEAR = 52;

const CATEGORY_LABELS = {
  commute: "Transportation",
  flights: "Flights",
  diet: "Food & diet",
  shopping: "Shopping & goods",
  home: "Home energy",
};

const TIER_LABELS = {
  below_average: "Below US average",
  average: "Near US average",
  above_average: "Above US average",
};

const COMMUTE_MODE_LABEL = {
  car: "Car",
  hybrid_ev: "Hybrid / electric vehicle",
  transit: "Public transit",
  bike: "Bicycle",
  walk: "Walking",
  remote: "Remote / no commute",
};

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function legacyToHabits(data) {
  if (!data || typeof data !== "object") return null;
  if (data.commute || data.flights !== undefined || data.shopping || data.home) {
    return data;
  }
  const miles = num(data.milesDriven, 0);
  const milesPerWeek = miles / 52;
  const dietMap = { meat: "meat_heavy", vegetarian: "vegetarian", vegan: "vegan" };
  const dietKey = dietMap[String(data.diet || "").toLowerCase()] || "average";
  return {
    commute: { mode: "car", commuteKmThisWeek: milesPerWeek * 1.60934 },
    flights: { shortHaulThisWeek: 0, longHaulThisWeek: Math.max(0, num(data.flights, 0)) },
    diet: dietKey,
    shopping: { level: "medium" },
    home: { kwhThisWeek: num(data.electricity, 0) },
  };
}

/** Weekly model — matches backend `calculateWeeklyFootprint` (PDF uses weekly kg; projects × 52 for annual lines). */
function habitInputsForPdf(habits) {
  const data = legacyToHabits(habits) || {};
  const commute = data.commute || {};
  const mode = String(commute.mode || "car").toLowerCase();
  const kmWeek =
    commute.commuteKmThisWeek != null
      ? num(commute.commuteKmThisWeek, 0)
      : num(commute.kmPerDay, 0) * Math.min(7, Math.max(0, num(commute.daysPerWeek, 5)));
  const kgPerKm = FACTORS.commuteKgPerKm[mode];
  const commuteKg = kgPerKm !== undefined ? kmWeek * kgPerKm : 0;

  const flights = data.flights || {};
  const shortN = Math.max(0, num(flights.shortHaulThisWeek, num(flights.shortHaulPerYear, 0) / 52));
  const longN = Math.max(0, num(flights.longHaulThisWeek, num(flights.longHaulPerYear, 0) / 52));
  const flightsKg = shortN * FACTORS.flightKgPerTrip.shortHaul + longN * FACTORS.flightKgPerTrip.longHaul;

  const dietKey = String(data.diet || "average").toLowerCase();
  const dietKgAnnual = FACTORS.dietAnnualKg[dietKey] ?? FACTORS.dietAnnualKg.average;
  const dietKg = dietKgAnnual / WEEKS_PER_YEAR;

  const shopping = data.shopping || {};
  const level = String(shopping.level || "medium").toLowerCase();
  const shopAnnual = FACTORS.shoppingAnnualKg[level] ?? FACTORS.shoppingAnnualKg.medium;
  const shoppingKg = shopAnnual / WEEKS_PER_YEAR;

  const home = data.home || {};
  const kwhWeek =
    home.kwhThisWeek != null ? num(home.kwhThisWeek, 0) : (num(home.kwhPerMonth, 0) * 12) / WEEKS_PER_YEAR;
  const homeKg = kwhWeek > 0 ? kwhWeek * FACTORS.electricityKgPerKwh : 0;

  return {
    commute: {
      label: COMMUTE_MODE_LABEL[mode] || mode,
      mode,
      kmWeek,
      kgPerKm: kgPerKm ?? 0,
      kg: commuteKg,
      factorNote: `${kgPerKm ?? 0} kg CO₂e per km traveled (${mode})`,
    },
    flights: {
      shortHaulThisWeek: shortN,
      longHaulThisWeek: longN,
      kg: flightsKg,
      factorNote: `${FACTORS.flightKgPerTrip.shortHaul} kg per short-haul trip, ${FACTORS.flightKgPerTrip.longHaul} kg per long-haul trip (model estimates)`,
    },
    diet: {
      key: dietKey,
      label:
        {
          meat_heavy: "Meat-heavy",
          average: "Average",
          vegetarian: "Vegetarian",
          vegan: "Vegan",
        }[dietKey] || dietKey,
      kg: dietKg,
      factorNote: "Diet tier annual estimate ÷ 52 → weekly food-system footprint",
    },
    shopping: {
      level,
      label: { low: "Low", medium: "Medium", high: "High" }[level] || level,
      kg: shoppingKg,
      factorNote: "Shopping tier annual estimate ÷ 52 → weekly goods & services proxy",
    },
    home: {
      kwhWeek,
      kg: homeKg,
      factorNote: `${FACTORS.electricityKgPerKwh} kg CO₂e per kWh (grid electricity model)`,
    },
  };
}

function topCategory(breakdownKg) {
  const keys = ["commute", "flights", "diet", "shopping", "home"];
  let maxK = "commute";
  let maxV = -1;
  for (const k of keys) {
    const v = breakdownKg?.[k] ?? 0;
    if (v > maxV) {
      maxV = v;
      maxK = k;
    }
  }
  return { key: maxK, kg: maxV };
}

function recommendations(footprint) {
  const b = footprint?.breakdownKg || {};
  const tips = {
    commute: "Reduce driving miles: combine trips, use transit or carpool, or choose a lower-emission commute mode when possible.",
    flights: "Fewer flights—especially long-haul—sharply reduce aviation emissions in this model.",
    diet: "Shifting toward more plant-forward meals often lowers food-related emissions over time.",
    shopping: "Buying less, choosing durable goods, and reducing waste lowers shopping-related emissions.",
    home: "Lower electricity use and improve efficiency to shrink home energy emissions.",
  };
  const keys = ["commute", "flights", "diet", "shopping", "home"];
  const ranked = keys.map((k) => ({ k, kg: b[k] ?? 0 })).sort((a, b) => b.kg - a.kg);
  const out = [];
  for (const { k, kg } of ranked) {
    if (kg > 0 && tips[k]) out.push(tips[k]);
    if (out.length >= 5) break;
  }
  if (out.length === 0) out.push("Revisit your inputs as your lifestyle changes to keep this estimate meaningful.");
  return out;
}

/**
 * jsPDF measures lines using built-in font metrics. Unicode (subscripts, smart quotes) breaks
 * splitTextToSize and causes overflow / fake “justified” stretching — normalize to ASCII for PDF.
 * @param {string} s
 */
function sanitizePdfText(s) {
  return String(s)
    .replace(/\u2082/g, "2")
    .replace(/CO₂/g, "CO2")
    .replace(/O₂/g, "O2")
    .replace(/[–—]/g, "-")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/×/g, "x")
    .replace(/≈/g, "~")
    .replace(/\u00a0/g, " ");
}

/**
 * @param {import('jspdf').jsPDF} doc
 */
/* ~18mm top/bottom margin; generous side margins so text stays inside the page */
const PAGE_TOP_MM = 18;
const PAGE_SIDE_MM = 18;
/** Slight inset so lines never clip at the right edge */
function contentWidthMm(pageWidthMm) {
  return Math.max(20, pageWidthMm - 2 * PAGE_SIDE_MM - 1);
}

function ensureY(doc, y, needMm) {
  const bottom = 268;
  if (y + needMm > bottom) {
    doc.addPage();
    return PAGE_TOP_MM;
  }
  return y;
}

function paragraph(doc, text, x, y, maxW, fontSize = 9.5, style = "normal") {
  const safe = sanitizePdfText(text);
  doc.setFont("times", style);
  doc.setFontSize(fontSize);
  if (typeof doc.setCharSpace === "function") doc.setCharSpace(0);
  const lines = doc.splitTextToSize(safe, maxW);
  const lh = fontSize * 0.48;
  let yy = y;
  for (const line of lines) {
    yy = ensureY(doc, yy, lh + 1);
    doc.text(line, x, yy, { align: "left", charSpace: 0 });
    yy += lh;
  }
  doc.setFont("times", "normal");
  return yy + 2;
}

/** Latin Modern–style math in PDF: built-in Courier (monospace TeX/code–like; embed-free). */
function paragraphFormula(doc, text, x, y, maxW, fontSize = 9.5) {
  const safe = sanitizePdfText(text);
  doc.setFont("courier", "normal");
  doc.setFontSize(fontSize);
  if (typeof doc.setCharSpace === "function") doc.setCharSpace(0);
  const lines = doc.splitTextToSize(safe, maxW);
  const lh = fontSize * 0.48;
  let yy = y;
  for (const line of lines) {
    yy = ensureY(doc, yy, lh + 1);
    doc.text(line, x, yy, { align: "left", charSpace: 0 });
    yy += lh;
  }
  doc.setFont("times", "normal");
  return yy + 2;
}

function heading(doc, text, x, y) {
  let yy = ensureY(doc, y, 10);
  doc.setFont("times", "bold");
  doc.setFontSize(11.5);
  if (typeof doc.setCharSpace === "function") doc.setCharSpace(0);
  doc.setTextColor(18, 75, 45);
  doc.text(sanitizePdfText(text), x, yy, { align: "left", charSpace: 0 });
  doc.setTextColor(30, 30, 30);
  return yy + 8;
}

function line(doc, x, y, maxW, parts, fontSize = 9.5) {
  const text = parts.filter(Boolean).join(" ");
  return paragraphFormula(doc, text, x, y, maxW, fontSize);
}

/**
 * @param {{ footprint: object, habits: object, userDisplayName: string }} opts
 */
export async function downloadCarbonScorePdf(opts) {
  const { footprint, habits = {}, userDisplayName = "Guest" } = opts;
  const wkKg = footprint?.weeklyKgCO2e ?? footprint?.annualKgCO2e / 52;
  if (wkKg == null || Number.isNaN(Number(wkKg))) {
    throw new Error("Missing footprint data for this report.");
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (typeof doc.setCharSpace === "function") doc.setCharSpace(0);
  const M = PAGE_SIDE_MM;
  const W = contentWidthMm(210);
  let y = PAGE_TOP_MM;

  const name = String(userDisplayName || "Guest").trim() || "Guest";
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const h = habitInputsForPdf(habits);
  const comp = footprint.comparison || {};
  const budget = footprint.carbonBudget || {};
  const tierKey = comp.relativeToUs || "average";
  const tierLabel = TIER_LABELS[tierKey] || TIER_LABELS.average;
  const globalAvg = comp.globalAverageAnnualKg ?? FACTORS.benchmarks.globalAverageAnnualKg;
  const usAvg = comp.usAverageAnnualKg ?? FACTORS.benchmarks.usAverageAnnualKg;
  const targetKg = budget.targetAnnualKg ?? FACTORS.benchmarks.parisAlignedPersonalAnnualKg;
  const sustainabilityFormula = `Your sustainability score (0–100) compares this week’s total to a weekly slice of the global reference: score ≈ 100 minus 35 × (your weekly kg ÷ global weekly kg), capped at 0–100.`;
  const { key: topKey } = topCategory(footprint.breakdownKg);
  const recs = recommendations(footprint);

  // --- Header (Times = serif body, closest to Latin Modern text without embedding) ---
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  if (typeof doc.setCharSpace === "function") doc.setCharSpace(0);
  doc.setTextColor(18, 90, 55);
  doc.text("CUTThecarbon", M, y, { align: "left", charSpace: 0 });
  doc.setTextColor(35, 35, 35);
  y += 9;
  doc.setFontSize(13);
  doc.text("Weekly Carbon Score Report", M, y, { align: "left", charSpace: 0 });
  y += 7;
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.text(`Prepared for: ${name}`, M, y, { align: "left", charSpace: 0 });
  y += 5;
  doc.text(`Date generated: ${dateStr}`, M, y, { align: "left", charSpace: 0 });
  y += 10;

  // --- Summary ---
  y = heading(doc, "1. Summary", M, y);
  y = line(
    doc,
    M,
    y,
    W,
    [
      `This week’s carbon footprint: ${formatTonnesFromKg(footprint.weeklyKgCO2e ?? wkKg, 2)} metric tonnes CO₂e per week.`,
      `Projected yearly footprint (×52): ${formatTonnesFromKg(footprint.projectedAnnualKgCO2e ?? footprint.annualKgCO2e, 2)} t CO₂e / yr.`,
      `Sustainability score: ${footprint.footprintScore ?? "—"} (0–100).`,
      `Letter grade: ${footprint.grade ?? "—"}.`,
      `Status vs US benchmark: ${tierLabel}.`,
      `Global benchmark reference: ${formatTonnesFromKg(globalAvg, 1)} t CO₂e / yr. You are at ${comp.yourPercentOfGlobalAverage ?? "—"}% of that.`,
      `US benchmark reference: ${formatTonnesFromKg(usAvg, 1)} t CO₂e / yr. You are at ${comp.yourPercentOfUsAverage ?? "—"}% of that.`,
      `Fair-share target (model, yearly): ${formatTonnesFromKg(targetKg, 2)} t CO₂e / yr.`,
    ],
    9.5,
  );
  y = paragraphFormula(
    doc,
    `In short: this week ${formatTonnesFromKg(footprint.weeklyKgCO2e ?? wkKg, 2)} t CO₂e / week; projected yearly ${formatTonnesFromKg(footprint.projectedAnnualKgCO2e ?? footprint.annualKgCO2e, 2)} t (${tierLabel}); score ${footprint.footprintScore ?? "—"}; grade ${footprint.grade ?? "—"}.`,
    M,
    y,
    W,
  );
  y = paragraph(
    doc,
    "This summary reflects the same totals and comparisons shown on your Carbon Score screen, using the app’s calculation model.",
    M,
    y,
    W,
  );

  // --- Explain every number ---
  y = ensureY(doc, y, 14);
  y = heading(doc, "2. What each number means (plain English)", M, y);
  const explanations = [
    [
      "Weekly carbon footprint (tonnes / week)",
      "This week’s estimate of greenhouse gases from your logged activity, in CO₂e. The app also shows a projected yearly total (this week × 52) for comparison to annual benchmarks.",
    ],
    [
      "Sustainability score",
      "A single 0–100 number that summarizes how your total footprint compares to a global reference. Higher usually means lower relative emissions in this model—not a judgment of you as a person.",
    ],
    [
      "Letter grade (A–F)",
      "Compares your annual footprint to a fair-share target aligned with global climate goals in this app. Better grades mean your total is closer to or below that target.",
    ],
    [
      "Below / near / above US average",
      "Compares your footprint to a modeled US per-person average. “Below” means lower than that benchmark; “above” means higher.",
    ],
    [
      "Global average benchmark",
      "A reference total used worldwide in this app so you can see how your footprint compares in percentage terms.",
    ],
    [
      "US average benchmark",
      "A higher reference than the global one (typical for higher per-capita emissions). Your percentage shows how you compare to that US benchmark.",
    ],
    [
      "Percent of global / US benchmark",
      "If you are at 100%, your footprint equals the benchmark; below 100% means lower than the benchmark; above 100% means higher.",
    ],
    [
      "Carbon budget — your footprint vs fair-share target",
      "Your yearly emissions compared to a simplified fair-share target. If you are under the target, the “headroom” is how much room you still have before reaching it; if over, it shows how much you exceed it.",
    ],
    [
      "Emissions breakdown (by category)",
      "Each bar is that category’s share of your total: transportation, flights, food & diet, shopping, and home energy.",
    ],
    [
      "Ring gauge (on screen)",
      "The ring compares your footprint to the global benchmark visually; the PDF uses the same underlying numbers as this report.",
    ],
  ];
  for (const [title, body] of explanations) {
    y = ensureY(doc, y, 20);
    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    if (typeof doc.setCharSpace === "function") doc.setCharSpace(0);
    doc.text(sanitizePdfText(`${title}:`), M, y, { align: "left", charSpace: 0 });
    y += 4.5;
    doc.setFont("times", "normal");
    y = paragraph(doc, body, M, y, W, 9.5);
  }

  // --- Calculation breakdown ---
  y = ensureY(doc, y, 14);
  y = heading(doc, "3. Calculation breakdown (by category)", M, y);
  y = paragraphFormula(
    doc,
    "Each category below lists what you entered (or the app default), the factor the model used, the resulting yearly CO₂e, and a short explanation. Totals are rounded like the backend.",
    M,
    y,
    W,
  );

  const sections = [
    {
      title: "Transportation",
      lines: [
        `Your input: ${h.commute.label}; about ${Math.round(h.commute.kmWeek)} km traveled this week.`,
        `Weekly distance: ${Math.round(h.commute.kmWeek)} km.`,
        `Factor used: ${h.commute.factorNote}.`,
        `Resulting contribution: ${formatTonnesFromKg(h.commute.kg, 2)} t CO₂e / year.`,
        `Explanation: More kilometers or higher-emission modes increase this share.`,
      ],
    },
    {
      title: "Flights",
      lines: [
        `Your input: ${h.flights.shortHaulThisWeek} short-haul trip(s) this week; ${h.flights.longHaulThisWeek} long-haul trip(s) this week.`,
        `Factor used: ${h.flights.factorNote}.`,
        `Resulting contribution: ${formatTonnesFromKg(h.flights.kg, 2)} t CO₂e / year.`,
        `Explanation: Long flights add more per trip than short ones in this model.`,
      ],
    },
    {
      title: "Food & diet",
      lines: [
        `Your input: diet style “${h.diet.label}”.`,
        `Factor used: ${h.diet.factorNote} for your tier (${formatTonnesFromKg(h.diet.kg, 2)} t CO₂e / year).`,
        `Explanation: Diet tiers capture typical emissions from food choices in a simple way.`,
      ],
    },
    {
      title: "Shopping & consumption",
      lines: [
        `Your input: consumption level “${h.shopping.label}”.`,
        `Factor used: ${h.shopping.factorNote}.`,
        `Resulting contribution: ${formatTonnesFromKg(h.shopping.kg, 2)} t CO₂e / year.`,
        `Explanation: Higher consumption levels assume more goods and services-related emissions.`,
      ],
    },
    {
      title: "Home energy",
      lines: [
        `Your input: ${Math.round(h.home.kwhWeek)} kWh this week (electricity model).`,
        `Factor used: ${h.home.factorNote}.`,
        `Resulting contribution: ${formatTonnesFromKg(h.home.kg, 2)} t CO₂e / year.`,
        `Explanation: More electricity use increases this block; efficiency and clean power lower it in real life.`,
      ],
    },
  ];

  for (const block of sections) {
    y = ensureY(doc, y, 12);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    if (typeof doc.setCharSpace === "function") doc.setCharSpace(0);
    doc.text(sanitizePdfText(block.title), M, y, { align: "left", charSpace: 0 });
    y += 5;
    doc.setFont("times", "normal");
    doc.setFontSize(9.5);
    for (const row of block.lines) {
      y = paragraphFormula(doc, `• ${row}`, M, y, W, 9.5);
    }
    y += 2;
  }

  y = paragraphFormula(
    doc,
    `Total modeled this week: ${formatTonnesFromKg(footprint.weeklyKgCO2e ?? wkKg, 2)} t CO₂e / week (sum of categories). Projected annual: ${formatTonnesFromKg(footprint.projectedAnnualKgCO2e ?? footprint.annualKgCO2e, 2)} t CO₂e / year (×52).`,
    M,
    y,
    W,
  );

  // --- Final score ---
  y = ensureY(doc, y, 14);
  y = heading(doc, "4. How your sustainability score and grade were determined", M, y);
  y = paragraphFormula(doc, sustainabilityFormula, M, y, W);
  y = paragraph(
    doc,
    "The letter grade compares your annual total to the fair-share target: staying at or under the target earns stronger grades; larger gaps earn lower grades. This is a simplified educational model, not a regulatory or official rating.",
    M,
    y,
    W,
  );
  y = paragraph(
    doc,
    "The final score is driven by the combined impact of transportation, flights, diet, shopping, and home energy. Lower-emission choices in those areas improve your score in this app; higher totals reduce it.",
    M,
    y,
    W,
  );

  // --- Benchmarks ---
  y = ensureY(doc, y, 14);
  y = heading(doc, "5. Benchmark comparison (what you saw on the score page)", M, y);
  y = paragraphFormula(
    doc,
    `Global average (${formatTonnesFromKg(globalAvg, 1)} t CO₂e / yr): used so you can see your footprint as a percentage of a global reference. Your value: ${comp.yourPercentOfGlobalAverage ?? "—"}% of that benchmark.`,
    M,
    y,
    W,
  );
  y = paragraphFormula(
    doc,
    `US average (${formatTonnesFromKg(usAvg, 1)} t CO₂e / yr): a higher per-person reference. Your value: ${comp.yourPercentOfUsAverage ?? "—"}% of that benchmark. ${tierLabel} summarizes whether you are below, near, or above that US comparison in this model.`,
    M,
    y,
    W,
  );
  y = paragraphFormula(
    doc,
    `Fair-share target (${formatTonnesFromKg(targetKg, 2)} t CO₂e / yr): used for the carbon budget and grade. Status in the app: ${budget.status === "within" ? "within or at the target" : budget.status === "over" ? "over the target (moderate)" : "well over the target"}.`,
    M,
    y,
    W,
  );

  // --- Personalized ---
  y = ensureY(doc, y, 14);
  y = heading(doc, "6. Personalized interpretation", M, y);
  const biggest = CATEGORY_LABELS[topKey] || topKey;
  y = paragraphFormula(
    doc,
    `Largest modeled category in your results: ${biggest} (${formatTonnesFromKg(footprint.breakdownKg?.[topKey] ?? 0, 2)} t CO₂e / year). That is the strongest single contributor in this breakdown.`,
    M,
    y,
    W,
  );
  const strength =
    tierKey === "below_average"
      ? "You are below the modeled US average — that is a relative strength in this comparison."
      : tierKey === "average"
        ? "You are near the modeled US average, so targeted changes in your top categories can have a clear impact."
        : "Focusing on your largest categories (above) is the most direct way to lower this modeled footprint.";
  y = paragraph(doc, strength, M, y, W);
  y = paragraph(
    doc,
    `Relative to the US benchmark you appear ${tierKey === "below_average" ? "lower than typical in this model." : tierKey === "above_average" ? "higher than typical — a useful focus for reductions." : "close to typical — small changes can still move the needle."}`,
    M,
    y,
    W,
  );

  // --- Recommendations ---
  y = ensureY(doc, y, 14);
  y = heading(doc, "7. Suggestions based on your breakdown", M, y);
  for (const r of recs) {
    y = paragraph(doc, `• ${r}`, M, y, W, 9.5);
  }

  y = ensureY(doc, y, 10);
  doc.setTextColor(80, 80, 80);
  y = paragraph(
    doc,
    "This report is generated from the same data as your Carbon Score screen. Figures are estimates for learning and planning, not professional carbon accounting.",
    M,
    y,
    W,
    8.5,
    "italic",
  );
  doc.setTextColor(30, 30, 30);

  doc.save("CUTThecarbon-Carbon-Score-Report.pdf");
}
