import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { postDashboard } from "./api";
import { useAuth } from "./context/AuthContext";
import { AuthBar } from "./components/AuthBar";
import { LandingGate } from "./components/LandingGate";
import { IMAGES } from "./constants";
import { Step1Lifestyle } from "./components/Step1Lifestyle";
import { Step2Score } from "./components/Step2Score";
import { Step3Offsets } from "./components/Step3Offsets";
import { Step4Toolkit } from "./components/Step4Toolkit";
import { useGamification } from "./hooks/useGamification";
import "./App.css";

const defaultHabits = {
  commute: { mode: "car", kmPerDay: 24, daysPerWeek: 5 },
  flights: { shortHaulPerYear: 1, longHaulPerYear: 0 },
  diet: "average",
  shopping: { level: "medium" },
  home: { kwhPerMonth: 350 },
};

const STEPS = [
  { n: 1, label: "Lifestyle" },
  { n: 2, label: "Carbon score" },
  { n: 3, label: "Offsets" },
  { n: 4, label: "Toolkit" },
];

export default function App() {
  const { user, loading: authLoading, syncFootprintToLeaderboard } = useAuth();
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });
  const [step, setStep] = useState(1);
  const [habits, setHabits] = useState(defaultHabits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedOffsetId, setSelectedOffsetId] = useState(null);
  const gamify = useGamification(result?.footprint ?? null);

  const breakdownMax = useMemo(() => {
    const b = result?.footprint?.breakdownKg;
    if (!b) return 1;
    return Math.max(...Object.values(b), 1);
  }, [result]);

  useEffect(() => {
    if (!user) {
      setStep(1);
      setResult(null);
      setSelectedOffsetId(null);
      setError(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user || result?.footprint?.annualKgCO2e == null) return;
    syncFootprintToLeaderboard(result.footprint.annualKgCO2e).catch(() => {});
  }, [user, result?.footprint?.annualKgCO2e, syncFootprintToLeaderboard]);

  async function handleCalculate(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSelectedOffsetId(null);
    try {
      const data = await postDashboard(habits);
      setResult(data);
      setStep(2);
    } catch (err) {
      setResult(null);
      setError(err.message || "Could not reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  const shellClass = `app-shell ${user ? "app-shell--app" : "app-shell--landing"}`;

  return (
    <div className={shellClass}>
      <div className="app-shell__bg" aria-hidden>
        {user ? (
          <>
            <div className="app-shell__bg-app" />
            <div className="app-shell__bg-app-grid" />
            <div className="app-shell__bg-app-vignette" />
            <div className="app-shell__grain app-shell__grain--app" />
          </>
        ) : (
          <>
            <img
              className="app-shell__bg-img"
              src={IMAGES.hero}
              alt=""
              referrerPolicy="no-referrer"
            />
            <div className="app-shell__bg-gradient" />
            <div className="app-shell__grain" />
          </>
        )}
      </div>

      <header className="site-header">
        <div className="site-header__row">
          <motion.div
            className="site-header__inner"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="site-header__logo" aria-hidden>
              🌱
            </span>
            <div>
              <h1 className="site-header__title">
                <strong className="site-header__brand-cut">CUT</strong>thecarbon
              </h1>
              <p className="site-header__tagline">
                {user ? (
                  <>
                    See where your emissions come from, act with confidence, and grow with the
                    community—all in one guided flow.
                  </>
                ) : (
                  <>Measure · negotiate · improve—your footprint, your move.</>
                )}
              </p>
            </div>
          </motion.div>
          <AuthBar authModal={authModal} setAuthModal={setAuthModal} />
        </div>

        {user && (
          <nav className="stepper" aria-label="Wizard progress">
            {STEPS.map((s) => (
              <button
                key={s.n}
                type="button"
                className={`stepper__item ${step === s.n ? "stepper__item--active" : ""} ${step > s.n ? "stepper__item--done" : ""}`}
                onClick={() => {
                  if (s.n === 1) setStep(1);
                  if (s.n === 2 && result) setStep(2);
                  if (s.n === 3 && result) setStep(3);
                  if (s.n === 4 && result) setStep(4);
                }}
                disabled={s.n > 1 && !result}
              >
                <span className="stepper__num">{s.n}</span>
                <span className="stepper__label">{s.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="app-main app-main--integrated">
        {authLoading ? (
          <p className="auth-loading-msg">Checking your session…</p>
        ) : !user ? (
          <LandingGate />
        ) : (
          <div className="wizard-stage">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step1Lifestyle
                  key="s1"
                  habits={habits}
                  setHabits={setHabits}
                  onSubmit={handleCalculate}
                  loading={loading}
                  error={error}
                />
              )}
              {step === 2 && result?.footprint && (
                <Step2Score
                  key="s2"
                  footprint={result.footprint}
                  breakdownMax={breakdownMax}
                  gamify={gamify}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                  onOpenToolkit={() => setStep(4)}
                />
              )}
              {step === 3 && result && (
                <Step3Offsets
                  key="s3"
                  offsetsRanked={result.offsetsRanked}
                  ai={result.ai}
                  aiEnabled={result.aiEnabled}
                  selectedId={selectedOffsetId}
                  onSelect={setSelectedOffsetId}
                  onBack={() => setStep(2)}
                  onNextToolkit={() => setStep(4)}
                  footprint={result.footprint}
                />
              )}
              {step === 4 && result?.footprint && (
                <Step4Toolkit
                  key="s4"
                  habits={habits}
                  footprint={result.footprint}
                  result={result}
                  gamify={gamify}
                  onBack={() => setStep(3)}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <p>
          Prototype for demo — not a certified carbon audit. Photos: Wikimedia Commons where linked.
        </p>
      </footer>
    </div>
  );
}
