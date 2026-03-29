import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";

import { normalizeWeeklyCheckInHabits, postCalculate } from "../../api";

import { OPTIMIZED_SCENARIO_HABITS } from "../../data/hubContent";

import { formatTonnesFromKg } from "../../utils/formatEmissions";



const COMMUTE_LABEL = {

  car: "Car (solo)",

  hybrid_ev: "Hybrid / EV",

  transit: "Public transit",

  bike: "Bike",

  walk: "Walk",

  remote: "Remote — no commute",

};



const DIET_LABEL = {

  meat_heavy: "Meat-heavy",

  average: "Average / mixed",

  vegetarian: "Vegetarian",

  vegan: "Vegan",

};



const SHOP_LABEL = {

  low: "Low — mindful",

  medium: "Medium shopping",

  high: "High — frequent new",

};



const WEEKS_PER_YEAR = 52;

const BAR_PLOT_PX = 132;

const DEBOUNCE_MS = 360;



/** Same weekly units as Step1 / `normalizeWeeklyCheckInHabits` → `calculateWeeklyFootprint` weekly path. */
function scenarioFromHabits(habits) {
  const c = habits.commute || {};
  const f = habits.flights || {};
  const h = habits.home || {};
  let kmWeek = Math.max(0, Number(c.commuteKmThisWeek) || 0);
  if (!kmWeek && c.kmPerDay != null && Number.isFinite(Number(c.kmPerDay))) {
    const days = Math.min(7, Math.max(0, Number(c.daysPerWeek ?? 5)));
    kmWeek = Math.round((Number(c.kmPerDay) || 0) * (days || 5));
  }
  let shortW = Math.max(0, Number(f.shortHaulThisWeek) || 0);
  let longW = Math.max(0, Number(f.longHaulThisWeek) || 0);
  if (!shortW && !longW && (f.shortHaulPerYear != null || f.longHaulPerYear != null)) {
    shortW = Math.round((Number(f.shortHaulPerYear) || 0) / 52);
    longW = Math.round((Number(f.longHaulPerYear) || 0) / 52);
  }
  let kwhWeek = Math.max(0, Number(h.kwhThisWeek) || 0);
  if (!kwhWeek && h.kwhPerMonth != null && Number.isFinite(Number(h.kwhPerMonth))) {
    kwhWeek = Math.round(((Number(h.kwhPerMonth) || 0) * 12) / 52);
  }
  return {
    diet: habits.diet ?? "average",
    shopping: { level: habits.shopping?.level ?? "medium" },
    commute: { mode: c.mode ?? "car", commuteKmThisWeek: kmWeek },
    flights: { shortHaulThisWeek: shortW, longHaulThisWeek: longW },
    home: { kwhThisWeek: kwhWeek },
  };
}



function tonnesCumulative(kgAnnual, years) {

  return (Number(kgAnnual) * years) / 1000;

}



function tonnesWeekly(kgAnnual) {

  return Number(kgAnnual) / WEEKS_PER_YEAR / 1000;

}



function deltaTonnes(kgA, kgB, years) {

  return ((Number(kgA) - Number(kgB)) * years) / 1000;

}



function deltaTonnesWeekly(kgA, kgB) {

  return (Number(kgA) - Number(kgB)) / WEEKS_PER_YEAR / 1000;

}



function formatDeltaTonnes(dt) {

  if (Math.abs(dt) < 0.000005) return "0 t";

  const sign = dt > 0 ? "+" : "";

  const d = Math.abs(dt) < 2 ? 2 : 1;

  return `${sign}${dt.toFixed(d)} t`;

}



function ImpactForecastBars({ mode = "years", years = 1, baselineKg, adjustedKg, optKg }) {

  const weekly = mode === "week";

  const tBase = weekly ? tonnesWeekly(baselineKg) : tonnesCumulative(baselineKg, years);

  const tAdj = weekly ? tonnesWeekly(adjustedKg) : tonnesCumulative(adjustedKg, years);

  const tOpt = weekly ? tonnesWeekly(optKg) : tonnesCumulative(optKg, years);

  const maxT = Math.max(tBase, tAdj, tOpt, weekly ? 0.0001 : 0.01);

  const dAdj = weekly ? deltaTonnesWeekly(adjustedKg, baselineKg) : deltaTonnes(adjustedKg, baselineKg, years);

  const dOpt = weekly ? deltaTonnesWeekly(optKg, baselineKg) : deltaTonnes(optKg, baselineKg, years);



  const rows = [

    {

      key: "base",

      label: "Quiz baseline",

      shortLabel: "Baseline",

      tonnes: tBase,

      deltaText: "vs base",

      subDelta: "—",

    },

    {

      key: "adj",

      label: "What-if (your inputs)",

      shortLabel: "What-if",

      tonnes: tAdj,

      deltaText: "vs baseline",

      subDelta: formatDeltaTonnes(dAdj),

    },

    {

      key: "opt",

      label: "Optimized preset",

      shortLabel: "Optimized",

      tonnes: tOpt,

      deltaText: "vs baseline",

      subDelta: formatDeltaTonnes(dOpt),

    },

  ];



  const title = weekly ? "Weekly footprint" : "One-year total";

  const unitHint = weekly ? "tonnes CO₂e per week (annual model ÷ 52)" : "tonnes CO₂e over one year";

  const ariaLabel = `${title}: baseline ${tBase.toFixed(weekly ? 3 : 2)}, what-if ${tAdj.toFixed(weekly ? 3 : 2)}, optimized ${tOpt.toFixed(weekly ? 3 : 2)} tonnes`;



  return (

    <div className="hub-impact-bars">

      <h4 className="hub-impact-bars__chart-title">{title}</h4>

      <p className="hub-impact-bars__unit-hint">{unitHint}</p>

      <div className="hub-impact-bars__plot" role="img" aria-label={ariaLabel}>

        {rows.map((row) => {

          const hPx = Math.max(6, (row.tonnes / maxT) * BAR_PLOT_PX);

          const tonnesStr = weekly ? row.tonnes.toFixed(2) : row.tonnes.toFixed(1);

          return (

            <div key={row.key} className="hub-impact-bars__cluster">

              <div className="hub-impact-bars__bar-column">

                <motion.div

                  className={`hub-impact-bars__bar hub-impact-bars__bar--${row.key}`}

                  initial={{ height: 0 }}

                  animate={{ height: hPx }}

                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}

                />

              </div>

              <span className="hub-impact-bars__tonnes">

                {tonnesStr} <span className="hub-impact-bars__t-unit">t</span>

              </span>

              <span className="hub-impact-bars__delta">{row.subDelta}</span>

              <span className="hub-impact-bars__col-label">{row.shortLabel}</span>

            </div>

          );

        })}

      </div>

      <div className="hub-impact-bars__legend">

        <span>

          <span className="hub-impact-bars__swatch hub-impact-bars__swatch--base" aria-hidden /> Baseline

        </span>

        <span>

          <span className="hub-impact-bars__swatch hub-impact-bars__swatch--adj" aria-hidden /> What-if

        </span>

        <span>

          <span className="hub-impact-bars__swatch hub-impact-bars__swatch--opt" aria-hidden /> Optimized

        </span>

      </div>

    </div>

  );

}



export function HubPredict({ habits, footprint }) {

  const [scenario, setScenario] = useState(() => scenarioFromHabits(habits));

  const [scenarioCalc, setScenarioCalc] = useState(null);

  const [optResult, setOptResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [err, setErr] = useState(null);

  const seqRef = useRef(0);



  useEffect(() => {

    let cancel = false;

    (async () => {

      try {

        const opt = await postCalculate(normalizeWeeklyCheckInHabits(OPTIMIZED_SCENARIO_HABITS));

        if (!cancel) setOptResult(opt);

      } catch {

        if (!cancel) setOptResult(null);

      }

    })();

    return () => {

      cancel = true;

    };

  }, []);



  const runCalculate = useCallback(async (habitsPayload) => {

    const r = await postCalculate(habitsPayload);

    setScenarioCalc(r);

    setErr(null);

  }, []);



  useEffect(() => {

    let cancelled = false;

    const mySeq = ++seqRef.current;

    const id = setTimeout(async () => {

      try {

        const r = await postCalculate(normalizeWeeklyCheckInHabits(scenario));

        if (cancelled || mySeq !== seqRef.current) return;

        setScenarioCalc(r);

        setErr(null);

      } catch (e) {

        if (!cancelled && mySeq === seqRef.current) setErr(e.message);

      }

    }, DEBOUNCE_MS);

    return () => {

      cancelled = true;

      clearTimeout(id);

    };

  }, [scenario]);



  async function runSim() {

    setErr(null);

    setLoading(true);

    try {

      await runCalculate(habitsToCalculatePayload(scenario));

    } catch (e) {

      setErr(e.message);

    } finally {

      setLoading(false);

    }

  }



  const baselineKg = footprint?.annualKgCO2e ?? 0;

  const adjustedKg = scenarioCalc?.annualKgCO2e ?? baselineKg;

  const optKg = optResult?.annualKgCO2e ?? Math.round(baselineKg * 0.7);



  const flightSummary = useMemo(() => {

    const s = scenario.flights.shortHaulThisWeek || 0;

    const l = scenario.flights.longHaulThisWeek || 0;

    if (l > 0) return `${s} short · ${l} long (this week)`;

    return `${s} short-haul (this week)`;

  }, [scenario.flights]);



  return (

    <div className="hub-predict">

      <section className="hub-predict__panel">

        <h3 className="hub-predict__title">“What-if” simulator</h3>

        <p className="hub-predict__lead">

          Same units as weekly check-in (km, flights, and kWh <strong>this week</strong>) — same

          calculator as the quiz; projected yearly = weekly × 52.

        </p>



        <div className="hub-predict__pills">

          <div className="hub-predict-pill">

            <span className="hub-predict-pill__icon" aria-hidden>

              🚗

            </span>

            <span className="hub-predict-pill__name">Car</span>

            <select

              className="hub-predict-pill__select"

              value={scenario.commute.mode}

              onChange={(e) =>

                setScenario((s) => ({

                  ...s,

                  commute: { ...s.commute, mode: e.target.value },

                }))

              }

              aria-label="Commute mode"

            >

              {Object.entries(COMMUTE_LABEL).map(([k, lab]) => (

                <option key={k} value={k}>

                  {lab}

                </option>

              ))}

            </select>

          </div>



          <div className="hub-predict-pill">

            <span className="hub-predict-pill__icon" aria-hidden>

              🛣️

            </span>

            <span className="hub-predict-pill__name">Distance</span>

            <label className="hub-predict-pill__field">

              <input

                type="number"

                min={0}

                max={800}

                step={5}

                value={scenario.commute.commuteKmThisWeek ?? 0}

                onChange={(e) =>

                  setScenario((s) => ({

                    ...s,

                    commute: { ...s.commute, commuteKmThisWeek: Number(e.target.value) },

                  }))

                }

              />

              <span className="hub-predict-pill__suffix">km / week</span>

            </label>

          </div>



          <div className="hub-predict-pill">

            <span className="hub-predict-pill__icon" aria-hidden>

              ✈

            </span>

            <span className="hub-predict-pill__name">Flights</span>

            <div className="hub-predict-pill__stack hub-predict-pill__stack--flights">

              <label className="hub-predict-pill__field hub-predict-pill__field--inline">

                <span className="hub-predict-pill__mini">Short</span>

                <input

                  type="number"

                  min={0}

                  max={8}

                  step={1}

                  value={scenario.flights.shortHaulThisWeek ?? 0}

                  onChange={(e) =>

                    setScenario((s) => ({

                      ...s,

                      flights: { ...s.flights, shortHaulThisWeek: Number(e.target.value) },

                    }))

                  }

                  aria-label="Short-haul flights this week"

                />

              </label>

              <label className="hub-predict-pill__field hub-predict-pill__field--inline">

                <span className="hub-predict-pill__mini">Long</span>

                <input

                  type="number"

                  min={0}

                  max={4}

                  step={1}

                  value={scenario.flights.longHaulThisWeek ?? 0}

                  onChange={(e) =>

                    setScenario((s) => ({

                      ...s,

                      flights: { ...s.flights, longHaulThisWeek: Number(e.target.value) },

                    }))

                  }

                  aria-label="Long-haul flights this week"

                />

              </label>

              <span className="hub-predict-pill__hint">{flightSummary}</span>

            </div>

          </div>



          <div className="hub-predict-pill">

            <span className="hub-predict-pill__icon" aria-hidden>

              🍽

            </span>

            <span className="hub-predict-pill__name">Diet</span>

            <select

              className="hub-predict-pill__select"

              value={scenario.diet}

              onChange={(e) => setScenario((s) => ({ ...s, diet: e.target.value }))}

              aria-label="Diet"

            >

              {Object.entries(DIET_LABEL).map(([k, lab]) => (

                <option key={k} value={k}>

                  {lab}

                </option>

              ))}

            </select>

          </div>



          <div className="hub-predict-pill">

            <span className="hub-predict-pill__icon" aria-hidden>

              🛍

            </span>

            <span className="hub-predict-pill__name">Shopping</span>

            <select

              className="hub-predict-pill__select"

              value={scenario.shopping.level}

              onChange={(e) =>

                setScenario((s) => ({

                  ...s,

                  shopping: { level: e.target.value },

                }))

              }

              aria-label="Shopping level"

            >

              {Object.entries(SHOP_LABEL).map(([k, lab]) => (

                <option key={k} value={k}>

                  {lab}

                </option>

              ))}

            </select>

          </div>

        </div>



        <div className="hub-predict__pills hub-predict__pills--secondary">

          <div className="hub-predict-pill hub-predict-pill--wide">

            <span className="hub-predict-pill__icon" aria-hidden>

              ⚡

            </span>

            <span className="hub-predict-pill__name">Home energy</span>

            <label className="hub-predict-pill__field">

              <input

                type="number"

                min={0}

                max={500}

                step={5}

                value={scenario.home.kwhThisWeek ?? 0}

                onChange={(e) =>

                  setScenario((s) => ({

                    ...s,

                    home: { kwhThisWeek: Number(e.target.value) },

                  }))

                }

              />

              <span className="hub-predict-pill__suffix">kWh / week</span>

            </label>

          </div>

        </div>



        <button type="button" className="hub-predict__cta btn-cta" onClick={runSim} disabled={loading}>

          {loading ? "Running…" : "Recalculate scenario"}

        </button>

        {err && <p className="hub-error">{err}</p>}

        {scenarioCalc && (

          <p className="hub-predict__result">

            Scenario ≈ <strong>{formatTonnesFromKg(scenarioCalc.annualKgCO2e, 2)}</strong> t CO₂e/yr vs

            baseline <strong>{formatTonnesFromKg(baselineKg, 2)}</strong> t (

            <strong>

              {scenarioCalc.annualKgCO2e - baselineKg > 0 ? "+" : ""}

              {formatTonnesFromKg(scenarioCalc.annualKgCO2e - baselineKg, 2)} t

            </strong>

            )

          </p>

        )}

      </section>



      <section className="hub-predict__panel">

        <h3 className="hub-predict__title">Future impact forecast</h3>

        <p className="hub-predict__lead">

          Same numbers as the simulator: the <strong>What-if</strong> bar uses your current inputs

          (updates shortly after you change them). <strong>Baseline</strong> is your saved quiz

          footprint; <strong>Optimized</strong> is a fixed lower-impact preset for comparison.

        </p>

        <div className="hub-forecast-v2">

          <ImpactForecastBars

            mode="week"

            baselineKg={baselineKg}

            adjustedKg={adjustedKg}

            optKg={optKg}

          />

          <ImpactForecastBars

            mode="years"

            years={1}

            baselineKg={baselineKg}

            adjustedKg={adjustedKg}

            optKg={optKg}

          />

        </div>

      </section>

    </div>

  );

}

