import { useEffect, useState } from "react";
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
import { SustainableMarketplace } from "./components/SustainableMarketplace";
import { UserPortfolioPage } from "./components/portfolio/UserPortfolioPage";
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
  { n: 3, label: "Sustainable Marketplace" },
  { n: 4, label: "Offsets" },
  { n: 5, label: "Toolkit" },
  { n: 6, label: "Progress" },
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
  const gamify = useGamification(result?.footprint ?? null, {
    selectedOffsetId,
    step,
    userId: user?.id,
    serverGamification: user?.gamification,
  });

  useEffect(() => {
    if (!user) {
      setStep(1);
      setResult(null);
      setSelectedOffsetId(null);
      setError(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      document.title = "CUTthecarbon";
      return;
    }
    document.title =
      step === 3
        ? "Sustainable marketplace — CUTthecarbon"
        : step === 6
          ? "Your progress — CUTthecarbon"
          : "CUTthecarbon";
  }, [user, step]);

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
            <div className="app-shell__bg-app-deco" />
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
            <div className="site-header__logo-wrap">
            <img
              className="site-header__logo"
              src={IMAGES.brandLogo}
              alt=""
              width={80}
              height={80}
              decoding="async"
            />
            </div>
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
          <div className="site-header__trailing">
            <AuthBar authModal={authModal} setAuthModal={setAuthModal} />
          </div>
        </div>

        {user && (
          <nav className="stepper stepper--six" aria-label="Wizard progress">
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
                  if (s.n === 5 && result) setStep(5);
                  if (s.n === 6) setStep(6);
                }}
                disabled={s.n !== 1 && s.n !== 6 && !result}
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
                  gamify={gamify}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                  onOpenToolkit={() => setStep(5)}
                  onOpenPortfolio={() => setStep(6)}
                />
              )}
              {step === 3 && result && (
                <SustainableMarketplace
                  key="s3-marketplace"
                  onBack={() => setStep(2)}
                  onNextOffsets={() => setStep(4)}
                />
              )}
              {step === 4 && result && (
                <Step3Offsets
                  key="s4-offsets"
                  offsetsRanked={result.offsetsRanked}
                  ai={result.ai}
                  aiEnabled={result.aiEnabled}
                  selectedId={selectedOffsetId}
                  onSelect={setSelectedOffsetId}
                  onBack={() => setStep(3)}
                  onNextToolkit={() => setStep(5)}
                  footprint={result.footprint}
                />
              )}
              {step === 5 && result?.footprint && (
                <Step4Toolkit
                  key="s5-toolkit"
                  habits={habits}
                  footprint={result.footprint}
                  result={result}
                  gamify={gamify}
                  onBack={() => setStep(4)}
                  onOpenPortfolio={() => setStep(6)}
                />
              )}
              {step === 6 && (
                <UserPortfolioPage
                  key="s6-portfolio"
                  user={user}
                  footprint={result?.footprint}
                  gamify={gamify}
                  onBack={() => setStep(result ? 5 : 1)}
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
