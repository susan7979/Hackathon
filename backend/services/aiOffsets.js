/**
 * Optional OpenAI enrichment for offset recommendations.
 * Set OPENAI_API_KEY in environment. Falls back to null if missing or on error.
 */

async function enrichRecommendations(footprintSummary, rankedOffsets) {
  const key =
    typeof process.env.OPENAI_API_KEY === "string"
      ? process.env.OPENAI_API_KEY.trim()
      : "";
  if (!key || typeof fetch !== "function") {
    return null;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const payload = {
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a concise sustainability advisor. Given a user's annual CO2e footprint and ranked offset options, return JSON only: {\"summary\":\"1-2 sentences\",\"picks\":[{\"offsetId\":\"...\",\"rank\":1,\"reason\":\"one short sentence\"}]}. picks must reference offsetId values from the provided list only. Max 3 picks.",
      },
      {
        role: "user",
        content: JSON.stringify({
          footprint: footprintSummary,
          options: rankedOffsets.map((o) => ({
            offsetId: o.id,
            name: o.name,
            type: o.type,
            costUsdPerTonne: o.costUsdPerTonne,
            credibility: o.credibility,
            valueScore: o.valueScore,
          })),
        }),
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
      const err = await res.text();
      console.warn("OpenAI offset enrichment failed:", res.status, err);
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    console.warn("OpenAI offset enrichment error:", e.message);
    return null;
  }
}

module.exports = { enrichRecommendations };
