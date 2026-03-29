import { motion } from "framer-motion";
import { formatCooldownRemaining } from "../utils/weeklyCheckInCooldown";

const commuteModes = [
  { value: "car", label: "Car (solo)" },
  { value: "hybrid_ev", label: "Hybrid / EV" },
  { value: "transit", label: "Public transit" },
  { value: "bike", label: "Bike" },
  { value: "walk", label: "Walk" },
  { value: "remote", label: "Remote — no commute" },
];

const diets = [
  { value: "meat_heavy", label: "Meat-heavy" },
  { value: "average", label: "Average / mixed" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

const shoppingLevels = [
  { value: "low", label: "Low — mindful consumption" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High — frequent new goods" },
];

/** Matches backend emissionFactors commuteKgPerKm — distance adds no tailpipe CO₂ for these modes. */
const COMMUTE_DISTANCE_CO2_MODES = new Set(["car", "hybrid_ev", "transit"]);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Step1Lifestyle({ habits, setHabits, onSubmit, loading, error, weeklyCooldown }) {
  const cooldownBlocked = Boolean(weeklyCooldown?.blocked);
  function updateCommute(field, value) {
    setHabits((h) => ({
      ...h,
      commute: { ...h.commute, [field]: value },
    }));
  }

  function updateFlights(field, value) {
    setHabits((h) => ({
      ...h,
      flights: { ...h.flights, [field]: value },
    }));
  }

  return (
    <motion.section
      className="step-panel step-panel--1"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
    >
      <form className="glass-card step-form step-form--centered" onSubmit={onSubmit}>
        <h2 className="step-form__title step-form__title--with-icon">
          <span className="step-form__title-icon" aria-hidden>
            📋
          </span>
          Weekly check-in
        </h2>
        <p className="step-form__lead">
          Log what happened <strong>this past week</strong> — we estimate your weekly CO₂e and a
          projected yearly total if every week looked similar.
        </p>

        <motion.div className="input-block" custom={0} variants={fadeUp} initial="hidden" animate="show">
          <h3 className="input-block__label">
            <span className="input-block__icon" aria-hidden>
              🚗
            </span>
            <span className="input-block__title-text">Commute & travel (this week)</span>
          </h3>
          <label className="select-wrap">
            <span>Main transport mode</span>
            <select
              value={habits.commute.mode}
              onChange={(e) => updateCommute("mode", e.target.value)}
            >
              {commuteModes.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="slider-field">
            <span>
              Total commute / travel km <strong>{habits.commute.commuteKmThisWeek ?? 0} km</strong>
            </span>
            <input
              type="range"
              min={0}
              max={800}
              step={5}
              value={habits.commute.commuteKmThisWeek ?? 0}
              onChange={(e) => updateCommute("commuteKmThisWeek", Number(e.target.value))}
            />
          </label>
          {!COMMUTE_DISTANCE_CO2_MODES.has(habits.commute.mode) && (
            <p
              className="step-form__lead"
              style={{ marginTop: "0.5rem", fontSize: "0.88rem", opacity: 0.92 }}
            >
              For walking, cycling, or remote work, this model treats commute emissions as{" "}
              <strong>0 kg CO₂e / km</strong> (no tailpipe). Distance is still logged for your
              record; it will not change the transport slice on your score.
            </p>
          )}
        </motion.div>

        <motion.div className="input-block" custom={1} variants={fadeUp} initial="hidden" animate="show">
          <h3 className="input-block__label">
            <span className="input-block__icon" aria-hidden>
              ✈️
            </span>
            <span className="input-block__title-text">Flights (this week)</span>
          </h3>
          <label className="slider-field">
            <span>
              Short-haul flights <strong>{habits.flights.shortHaulThisWeek ?? 0}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={habits.flights.shortHaulThisWeek ?? 0}
              onChange={(e) => updateFlights("shortHaulThisWeek", Number(e.target.value))}
            />
          </label>
          <label className="slider-field">
            <span>
              Long-haul flights <strong>{habits.flights.longHaulThisWeek ?? 0}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={habits.flights.longHaulThisWeek ?? 0}
              onChange={(e) => updateFlights("longHaulThisWeek", Number(e.target.value))}
            />
          </label>
        </motion.div>

        <motion.div className="input-block" custom={2} variants={fadeUp} initial="hidden" animate="show">
          <h3 className="input-block__label">
            <span className="input-block__icon" aria-hidden>
              🥗
            </span>
            <span className="input-block__title-text">Diet pattern (this week)</span>
          </h3>
          <label className="select-wrap">
            <span>Typical diet</span>
            <select
              value={habits.diet}
              onChange={(e) => setHabits((h) => ({ ...h, diet: e.target.value }))}
            >
              {diets.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </motion.div>

        <motion.div className="input-block" custom={3} variants={fadeUp} initial="hidden" animate="show">
          <h3 className="input-block__label">
            <span className="input-block__icon" aria-hidden>
              ⚡
            </span>
            <span className="input-block__title-text">Home electricity (this week)</span>
          </h3>
          <label className="slider-field">
            <span>
              Grid electricity <strong>{habits.home.kwhThisWeek ?? 0} kWh</strong>
            </span>
            <input
              type="range"
              min={0}
              max={500}
              step={5}
              value={habits.home.kwhThisWeek ?? 0}
              onChange={(e) =>
                setHabits((h) => ({
                  ...h,
                  home: { kwhThisWeek: Number(e.target.value) },
                }))
              }
            />
          </label>
        </motion.div>

        <motion.div className="input-block" custom={4} variants={fadeUp} initial="hidden" animate="show">
          <h3 className="input-block__label">
            <span className="input-block__icon" aria-hidden>
              🛒
            </span>
            <span className="input-block__title-text">Shopping & goods (this week)</span>
          </h3>
          <label className="select-wrap">
            <span>Consumption level</span>
            <select
              value={habits.shopping.level}
              onChange={(e) =>
                setHabits((h) => ({
                  ...h,
                  shopping: { level: e.target.value },
                }))
              }
            >
              {shoppingLevels.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </motion.div>

        {cooldownBlocked && weeklyCooldown?.lastSubmittedAt && (
          <motion.div
            className="weekly-cooldown-banner"
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <strong>Weekly check-in submitted</strong>{" "}
            {weeklyCooldown.lastSubmittedAt.toLocaleString()}. Next full assessment in{" "}
            <strong>{formatCooldownRemaining(weeklyCooldown.msRemaining)}</strong> (opens{" "}
            {weeklyCooldown.nextAllowedAt?.toLocaleString?.() ?? "—"}). You can still use the{" "}
            <strong>Toolkit → What-if</strong> anytime to model scenarios without a new log.
          </motion.div>
        )}

        <motion.button
          type="submit"
          className="btn-cta"
          disabled={loading || cooldownBlocked}
          whileHover={{ scale: loading || cooldownBlocked ? 1 : 1.02 }}
          whileTap={{ scale: loading || cooldownBlocked ? 1 : 0.98 }}
        >
          {loading
            ? "Crunching numbers…"
            : cooldownBlocked
              ? `Next check-in in ${formatCooldownRemaining(weeklyCooldown?.msRemaining ?? 0)}`
              : "See this week’s carbon score →"}
        </motion.button>

        {error && (
          <motion.div
            className="error-banner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
      </form>
    </motion.section>
  );
}
