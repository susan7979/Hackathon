import { motion } from "framer-motion";

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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Step1Lifestyle({ habits, setHabits, onSubmit, loading, error }) {
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
          Lifestyle input
        </h2>
        <p className="step-form__lead">
          Adjust sliders and menus — we turn your habits into an annual CO₂e estimate.
        </p>

        <motion.div className="input-block" custom={0} variants={fadeUp} initial="hidden" animate="show">
          <h3 className="input-block__label">
            <span className="input-block__icon" aria-hidden>
              🚗
            </span>
            <span className="input-block__title-text">Car & commute</span>
          </h3>
          <label className="select-wrap">
            <span>Transport mode</span>
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
              Daily travel distance <strong>{habits.commute.kmPerDay} km</strong>
            </span>
            <input
              type="range"
              min={0}
              max={120}
              step={1}
              value={habits.commute.kmPerDay}
              onChange={(e) => updateCommute("kmPerDay", Number(e.target.value))}
            />
          </label>
          <label className="slider-field">
            <span>
              Commute days / week <strong>{habits.commute.daysPerWeek}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={7}
              step={1}
              value={habits.commute.daysPerWeek}
              onChange={(e) => updateCommute("daysPerWeek", Number(e.target.value))}
            />
          </label>
        </motion.div>

        <motion.div className="input-block" custom={1} variants={fadeUp} initial="hidden" animate="show">
          <h3 className="input-block__label">
            <span className="input-block__icon" aria-hidden>
              ✈️
            </span>
            <span className="input-block__title-text">Flights per year</span>
          </h3>
          <label className="slider-field">
            <span>
              Short-haul trips <strong>{habits.flights.shortHaulPerYear}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={24}
              step={1}
              value={habits.flights.shortHaulPerYear}
              onChange={(e) => updateFlights("shortHaulPerYear", Number(e.target.value))}
            />
          </label>
          <label className="slider-field">
            <span>
              Long-haul trips <strong>{habits.flights.longHaulPerYear}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={habits.flights.longHaulPerYear}
              onChange={(e) => updateFlights("longHaulPerYear", Number(e.target.value))}
            />
          </label>
        </motion.div>

        <motion.div className="input-block" custom={2} variants={fadeUp} initial="hidden" animate="show">
          <h3 className="input-block__label">
            <span className="input-block__icon" aria-hidden>
              🥗
            </span>
            <span className="input-block__title-text">Diet</span>
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
            <span className="input-block__title-text">Home energy</span>
          </h3>
          <label className="slider-field">
            <span>
              Grid electricity <strong>{habits.home.kwhPerMonth} kWh / month</strong>
            </span>
            <input
              type="range"
              min={0}
              max={1200}
              step={10}
              value={habits.home.kwhPerMonth}
              onChange={(e) =>
                setHabits((h) => ({
                  ...h,
                  home: { kwhPerMonth: Number(e.target.value) },
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
            <span className="input-block__title-text">Shopping & goods</span>
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

        <motion.button
          type="submit"
          className="btn-cta"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? "Crunching numbers…" : "See my carbon score →"}
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
