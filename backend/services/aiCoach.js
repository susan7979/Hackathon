/**
 * Personal coach plan: OpenAI when configured, else a rule-based plan from footprint breakdown.
 */

const CATEGORY_ORDER = ["commute", "flights", "diet", "shopping", "home"];

function isValidPlan(obj) {
  return (
    obj &&
    typeof obj.intro === "string" &&
    typeof obj.closing === "string" &&
    Array.isArray(obj.steps) &&
    obj.steps.length > 0 &&
    obj.steps.every(
      (s) => s && typeof s.title === "string" && typeof s.detail === "string"
    )
  );
}

/**
 * Deterministic steps from highest-impact categories — works without any API key.
 */
function buildFallbackCoachPlan(habits, footprint) {
  const b = footprint.projectedBreakdownKg || footprint.breakdownKg || {};
  const sorted = CATEGORY_ORDER.map((k) => [k, b[k] || 0]).sort((a, x) => x[1] - a[1]);
  const annual = footprint.projectedAnnualKgCO2e || footprint.annualKgCO2e || 0;
  const weeklyKg = footprint.weeklyKgCO2e;
  const grade = footprint.grade || "?";
  const steps = [];
  const commute = habits?.commute || {};
  const diet = habits?.diet || "average";
  const flights = habits?.flights || {};

  const push = (title, detail, est) => {
    steps.push({
      title,
      detail,
      estimatedKgSavedPerYear: est != null ? Math.round(est) : null,
    });
  };

  const top = sorted[0]?.[0];
  const second = sorted[1]?.[0];

  if (top === "commute" || (b.commute || 0) > annual * 0.12) {
    const mode = commute.mode || "car";
    if (mode === "car" || mode === "hybrid_ev") {
      push(
        "Swap some drive days",
        "Try transit, carpool, or remote work 1–2 days per week if you can—often the biggest single lever for commute emissions.",
        (b.commute || 0) * 0.15
      );
    } else {
      push(
        "Keep low-carbon commute habits",
        "You’re already on a lighter mode; nudging trip distance down (combine errands) still trims kg.",
        (b.commute || 0) * 0.08
      );
    }
  }

  if (top === "flights" || second === "flights" || (b.flights || 0) > annual * 0.1) {
    push(
      "Rethink one flight a year",
      "Short hops add up fast; trains, buses, or one fewer return trip often saves hundreds of kg CO₂e.",
      Math.min(b.flights || 0, 800)
    );
  }

  if (top === "diet" || second === "diet" || diet === "meat_heavy") {
    push(
      "Shift one meal a day",
      "More plants, less red meat—even a few days a week—typically cuts food-related emissions meaningfully.",
      diet === "meat_heavy" ? 400 : (b.diet || 0) * 0.12
    );
  }

  if (top === "home" || second === "home" || (b.home || 0) > annual * 0.15) {
    push(
      "Trim home electricity",
      "LEDs, shorter heating/cooling cycles, and checking insulation often save kWh without big lifestyle hits.",
      (b.home || 0) * 0.1
    );
  }

  if (top === "shopping" || second === "shopping") {
    push(
      "Buy fewer, keep longer",
      "Repair, borrow, or buy second-hand for big-ticket goods to shrink the “stuff” footprint.",
      (b.shopping || 0) * 0.1
    );
  }

  push(
    "Track one habit for a month",
    "Pick the step above that feels easiest—consistency beats perfection.",
    null
  );

  const unique = [];
  const seen = new Set();
  for (const s of steps) {
    const k = s.title;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(s);
  }

  const fillers = [
    {
      title: "Line-dry laundry when you can",
      detail: "Dryers use a lot of kWh; air-drying even part of the time trims home electricity.",
      estimatedKgSavedPerYear: 40,
    },
    {
      title: "Offset what you can’t cut yet",
      detail:
        "Quality offsets aren’t a substitute for reduction, but they can cover residual emissions while you improve habits.",
      estimatedKgSavedPerYear: null,
    },
    {
      title: "Audit one monthly bill",
      detail: "Compare utility or fuel use month to month—awareness often surfaces easy wins.",
      estimatedKgSavedPerYear: null,
    },
  ];
  for (const g of fillers) {
    if (unique.length >= 4) break;
    if (!seen.has(g.title)) {
      seen.add(g.title);
      unique.push(g);
    }
  }

  const wk = weeklyKg != null ? `This week’s estimate is about ${Math.round(weeklyKg).toLocaleString()} kg CO₂e` : "Your footprint";
  return {
    intro: `${wk}; projected yearly ≈ ${Math.round(annual).toLocaleString()} kg CO₂e if every week looked like this (grade ${grade}). These steps focus on your larger impact areas—tailored without calling an AI model.`,
    steps: unique.slice(0, 6),
    closing:
      "Pick one change this week, then layer another. Small wins compound faster than an all-or-nothing overhaul.",
  };
}

async function fetchOpenAIPlan(habits, footprint) {
  const key =
    typeof process.env.OPENAI_API_KEY === "string"
      ? process.env.OPENAI_API_KEY.trim()
      : "";
  if (!key || typeof fetch !== "function") return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const payload = {
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You are a friendly carbon reduction coach. Return JSON only: {"intro":"1 sentence","steps":[{"title":"short","detail":"1-2 sentences","estimatedKgSavedPerYear":number or null}],"closing":"1 sentence"}. Give 4–6 concrete steps tailored to their highest-impact categories. estimatedKgSavedPerYear is optional rough kg CO2e/yr if plausible.',
      },
      {
        role: "user",
        content: JSON.stringify({ habits, footprint }),
      },
    ],
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("OpenAI coach failed:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = JSON.parse(text);
    return isValidPlan(parsed) ? parsed : null;
  } catch (e) {
    console.warn("OpenAI coach error:", e.message);
    return null;
  }
}

/**
 * @returns {{ plan: object, usedOpenAI: boolean }}
 */
async function getCoachPlan(habits, footprint) {
  const openaiPlan = await fetchOpenAIPlan(habits, footprint);
  if (openaiPlan) {
    return { plan: openaiPlan, usedOpenAI: true };
  }
  const fallback = buildFallbackCoachPlan(habits, footprint);
  return { plan: fallback, usedOpenAI: false };
}

module.exports = { getCoachPlan, buildFallbackCoachPlan };
