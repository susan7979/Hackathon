import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getFactors, postCalculate } from "../../api";
import {
  OFFSET_MARKETPLACES,
  OPTIMIZED_SCENARIO_HABITS,
  TAX_INCENTIVE_HINTS,
} from "../../data/hubContent";
import { formatTonnesFromKg } from "../../utils/formatEmissions";

function downloadText(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function HubInsights({ habits, footprint, result }) {
  const [factorsData, setFactorsData] = useState(null);
  const [optKg, setOptKg] = useState(null);

  useEffect(() => {
    getFactors()
      .then(setFactorsData)
      .catch(() => setFactorsData(null));
  }, []);

  useEffect(() => {
    postCalculate(OPTIMIZED_SCENARIO_HABITS)
      .then((r) => setOptKg(r.annualKgCO2e))
      .catch(() => setOptKg(null));
  }, []);

  const b = footprint?.breakdownKg;
  const entries = b
    ? Object.entries(b).sort((x, y) => y[1] - x[1])
    : [];
  const max = entries[0]?.[1] || 1;

  const currentKg = footprint?.annualKgCO2e ?? 0;
  const savedKg = optKg != null ? Math.max(0, currentKg - optKg) : 0;
  /** Rough social cost of carbon ~ $51/t CO₂e (illustrative) */
  const savingsUsd = Math.round((savedKg / 1000) * 51);
  const gasLitersAvoided = Math.round(savedKg / 2.3);

  const months = 12;
  const monthlySave = savedKg / months;
  const cumulative = Array.from({ length: months }, (_, i) =>
    Math.round(monthlySave * (i + 1))
  );

  const global = footprint?.comparison?.globalAverageAnnualKg;
  const us = footprint?.comparison?.usAverageAnnualKg;

  const exportPayload = {
    generatedAt: new Date().toISOString(),
    habits,
    footprint,
    offsetsRanked: result?.offsetsRanked,
    ai: result?.ai,
  };

  return (
    <div className="hub-sections">
      <section className="hub-card">
        <h3 className="hub-card__title">Cost-of-carbon savings (illustrative)</h3>
        <p className="hub-card__lead">
          Compared to the built-in “optimized” preset: ~<strong>${savingsUsd}/yr</strong> avoided
          damages at ~$51/t CO₂e (rough social cost — not personal cash).
        </p>
        <ul className="hub-list">
          <li>
            Equivalent to skipping roughly <strong>{gasLitersAvoided}</strong> L of gasoline
            combustion CO₂ (order-of-magnitude proxy).
          </li>
          <li>Real money savings: lower driving → fuel; lower kWh → utility bill; diet shifts → grocery.</li>
        </ul>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Offset marketplace (external)</h3>
        <p className="hub-card__lead">We don’t process payments — browse certified programs:</p>
        <ul className="hub-links">
          {OFFSET_MARKETPLACES.map((m) => (
            <li key={m.name}>
              <a href={m.url} target="_blank" rel="noreferrer">
                {m.name} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Tax credits & incentives (generic)</h3>
        <ul className="hub-list">
          {TAX_INCENTIVE_HINTS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Habit heatmap (intensity)</h3>
        <p className="hub-card__lead">Cell size ∝ share of your modeled footprint.</p>
        <div className="hub-heat">
          {entries.map(([k, v]) => (
            <motion.div
              key={k}
              className="hub-heat__cell"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                flex: `${Math.max(1, v)} 1 0`,
                minHeight: 48,
                minWidth: 60,
                background: `rgba(110, 255, 177, ${0.25 + (v / max) * 0.55})`,
              }}
            >
              <span className="hub-heat__label">{k}</span>
              <span className="hub-heat__val">{formatTonnesFromKg(v, 2)} t</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Timeline of impact (demo animation)</h3>
        <p className="hub-card__lead">
          Cumulative modeled CO₂e avoided vs optimized preset, spread evenly across 12 months (linear
          toy model).
        </p>
        <div className="hub-timeline">
          {cumulative.map((kg, i) => (
            <motion.div
              key={i}
              className="hub-timeline__month"
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(8, (kg / (cumulative[11] || 1)) * 120)}px` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              title={`Month ${i + 1}: ~${formatTonnesFromKg(kg, 3)} t cumulative`}
            />
          ))}
        </div>
        <p className="hub-note">
          Month 12 cumulative: ~{formatTonnesFromKg(cumulative[11] ?? 0, 3)} metric tonnes CO₂e
          (avoided vs preset)
        </p>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Footprint source drilldown</h3>
        <p className="hub-card__lead">{factorsData?.methodology?.commute || "Loading factors…"}</p>
        {factorsData?.factors && (
          <details className="hub-details">
            <summary>Raw emission factors (JSON)</summary>
            <pre className="hub-pre">{JSON.stringify(factorsData.factors, null, 2)}</pre>
          </details>
        )}
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Benchmarking</h3>
        <ul className="hub-list">
          <li>
            Global avg: ~{global != null ? `${formatTonnesFromKg(global, 1)} metric tonnes/yr` : "—"} —
            you at {footprint?.comparison?.yourPercentOfGlobalAverage ?? "—"}%.
          </li>
          <li>
            US avg: ~{us != null ? `${formatTonnesFromKg(us, 1)} metric tonnes/yr` : "—"} — you at{" "}
            {footprint?.comparison?.yourPercentOfUsAverage ?? "—"}%.
          </li>
          <li>Paris-style personal target in this API: ~2.5 t CO₂e/yr (illustrative).</li>
        </ul>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Export report</h3>
        <div className="hub-export">
          <button
            type="button"
            className="btn-ghost"
            onClick={() =>
              downloadText(JSON.stringify(exportPayload, null, 2), "carbon-report.json", "application/json")
            }
          >
            Download JSON
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              const rows = [
                ["metric", "value"],
                ["annual_metric_tonnes_co2e", footprint?.annualKgCO2e != null ? (footprint.annualKgCO2e / 1000).toFixed(4) : ""],
                ["annual_kg_co2e", footprint?.annualKgCO2e],
                ["grade", footprint?.grade],
                ["commute_kg", b?.commute],
                ["flights_kg", b?.flights],
                ["diet_kg", b?.diet],
                ["shopping_kg", b?.shopping],
                ["home_kg", b?.home],
              ];
              const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
              downloadText(csv, "carbon-footprint.csv", "text/csv");
            }}
          >
            Download CSV
          </button>
        </div>
        <p className="hub-note">PDF export would use a server template or client library (e.g. jsPDF).</p>
      </section>

      <section className="hub-card hub-card--muted">
        <h3 className="hub-card__title">Augmented reality</h3>
        <p className="hub-card__lead">
          Future: WebXR / ARKit overlay of “trees equivalent” or a floating metric-tonne CO₂e blob in
          your room
          — needs device APIs and 3D assets.
        </p>
      </section>
    </div>
  );
}
