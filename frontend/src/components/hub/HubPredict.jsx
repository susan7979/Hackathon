import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { postCalculate } from "../../api";
import { OPTIMIZED_SCENARIO_HABITS } from "../../data/hubContent";
import { formatTonnesFromKg } from "../../utils/formatEmissions";

export function HubPredict({ habits, footprint }) {
  const [scenario, setScenario] = useState(() => ({
    ...habits,
    commute: { ...habits.commute },
    flights: { ...habits.flights },
    shopping: { ...habits.shopping },
    home: { ...habits.home },
  }));
  const [simResult, setSimResult] = useState(null);
  const [optResult, setOptResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const opt = await postCalculate(OPTIMIZED_SCENARIO_HABITS);
        if (!cancel) setOptResult(opt);
      } catch {
        if (!cancel) setOptResult(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function runSim() {
    setErr(null);
    setLoading(true);
    try {
      const r = await postCalculate(scenario);
      setSimResult(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const baselineKg = footprint?.annualKgCO2e ?? 0;
  const scenarioKg = simResult?.annualKgCO2e ?? baselineKg;
  const optKg = optResult?.annualKgCO2e ?? Math.round(baselineKg * 0.7);

  const years = [1, 5];
  const maxBar = Math.max(scenarioKg * 5, optKg * 5, 1);

  return (
    <div className="hub-sections">
      <section className="hub-card">
        <h3 className="hub-card__title">“What-if” simulator</h3>
        <p className="hub-card__lead">
          Tweak a few levers and recalculate — instant projected footprint (same engine as the quiz).
        </p>
        <div className="hub-sim-grid">
          <label>
            Commute mode
            <select
              value={scenario.commute.mode}
              onChange={(e) =>
                setScenario((s) => ({
                  ...s,
                  commute: { ...s.commute, mode: e.target.value },
                }))
              }
            >
              <option value="car">Car</option>
              <option value="hybrid_ev">Hybrid / EV</option>
              <option value="transit">Transit</option>
              <option value="bike">Bike</option>
              <option value="walk">Walk</option>
              <option value="remote">Remote</option>
            </select>
          </label>
          <label>
            km / day
            <input
              type="number"
              min={0}
              max={150}
              value={scenario.commute.kmPerDay}
              onChange={(e) =>
                setScenario((s) => ({
                  ...s,
                  commute: { ...s.commute, kmPerDay: Number(e.target.value) },
                }))
              }
            />
          </label>
          <label>
            Short flights / yr
            <input
              type="number"
              min={0}
              max={24}
              value={scenario.flights.shortHaulPerYear}
              onChange={(e) =>
                setScenario((s) => ({
                  ...s,
                  flights: { ...s.flights, shortHaulPerYear: Number(e.target.value) },
                }))
              }
            />
          </label>
          <label>
            Diet
            <select
              value={scenario.diet}
              onChange={(e) => setScenario((s) => ({ ...s, diet: e.target.value }))}
            >
              <option value="meat_heavy">Meat-heavy</option>
              <option value="average">Average</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </label>
          <label>
            Shopping
            <select
              value={scenario.shopping.level}
              onChange={(e) =>
                setScenario((s) => ({
                  ...s,
                  shopping: { level: e.target.value },
                }))
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            kWh / month
            <input
              type="number"
              min={0}
              max={2000}
              step={10}
              value={scenario.home.kwhPerMonth}
              onChange={(e) =>
                setScenario((s) => ({
                  ...s,
                  home: { kwhPerMonth: Number(e.target.value) },
                }))
              }
            />
          </label>
        </div>
        <button type="button" className="btn-cta btn-cta--small" onClick={runSim} disabled={loading}>
          {loading ? "Running…" : "Recalculate scenario"}
        </button>
        {err && <p className="hub-error">{err}</p>}
        {simResult && (
          <p className="hub-sim-result">
            Scenario ≈ <strong>{formatTonnesFromKg(simResult.annualKgCO2e, 2)}</strong> metric tonnes
            CO₂e/yr vs your baseline <strong>{formatTonnesFromKg(baselineKg, 2)}</strong> t (
            <strong>
              {simResult.annualKgCO2e - baselineKg > 0 ? "+" : ""}
              {formatTonnesFromKg(simResult.annualKgCO2e - baselineKg, 2)} t
            </strong>
            )
          </p>
        )}
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Future impact forecast</h3>
        <p className="hub-card__lead">
          Linear projection of total CO₂e. The first bar uses your <strong>what-if</strong> result after
          you click Recalculate; before that it matches your quiz baseline. The second bar is the fixed
          “optimized” preset (transit, no flights, vegetarian, low shopping, lower kWh).
        </p>
        <div className="hub-forecast">
          {years.map((yr) => (
            <div key={yr} className="hub-forecast__block">
              <h4>{yr} year{yr > 1 ? "s" : ""} cumulative (tonnes CO₂e)</h4>
              <div className="hub-forecast__bars">
                <div className="hub-forecast__row">
                  <span>{simResult ? "What-if scenario" : "Quiz baseline"}</span>
                  <div className="hub-forecast__track">
                    <motion.div
                      key={`cur-${scenarioKg}-${yr}`}
                      className="hub-forecast__fill hub-forecast__fill--current"
                      initial={{ width: 0 }}
                      animate={{ width: `${(scenarioKg * yr) / maxBar * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <span>{((scenarioKg * yr) / 1000).toFixed(1)} t</span>
                </div>
                <div className="hub-forecast__row">
                  <span>Optimized preset</span>
                  <div className="hub-forecast__track">
                    <motion.div
                      className="hub-forecast__fill hub-forecast__fill--opt"
                      initial={{ width: 0 }}
                      animate={{ width: `${(optKg * yr) / maxBar * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>
                  <span>{((optKg * yr) / 1000).toFixed(1)} t</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Seasonal adjustments (illustrative)</h3>
        <ul className="hub-list">
          <li>
            <strong>Winter</strong> — heating degree-days push home energy up; EV range drops slightly
            in cold climates.
          </li>
          <li>
            <strong>Summer</strong> — AC load peaks; ground travel often rises with holidays.
          </li>
          <li>
            <strong>Travel peaks</strong> — short flight counts often spike around breaks; plan offsets
            or trains where possible.
          </li>
        </ul>
        <p className="hub-note">
          A production app would blend HDD/CDD weather normals and your actual smart-meter data.
        </p>
      </section>
    </div>
  );
}
