import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { postDashboard } from "./api";
import { useAuth } from "./context/AuthContext";
import { AuthBar } from "./components/AuthBar";
import { LandingGate } from "./components/LandingGate";
import { IMAGES } from "./constants";
import { Step1Lifestyle } from "./components/Step1Lifestyle";
import { Step2Score } from "./components/Step2Score";
import { Step4Toolkit } from "./components/Step4Toolkit";
import { StepSocialAi } from "./components/StepSocialAi";
import { SustainableMarketplace } from "./components/SustainableMarketplace";
import { UserPortfolioPage } from "./components/portfolio/UserPortfolioPage";
import { useGamification } from "./hooks/useGamification";
import { useWeeklyCheckInCooldown } from "./hooks/useWeeklyCheckInCooldown";
import {
  formatCooldownRemaining,
  getWeeklyCheckInCooldownState,
  recordWeeklyCheckInSubmitted,
} from "./utils/weeklyCheckInCooldown";
import {
  loadDashboardSession,
  saveDashboardSession,
} from "./utils/dashboardSessionStorage";
import "./App.css";

const defaultHabits = {
  commute: { mode: "car", commuteKmThisWeek: 120 },
  flights: { shortHaulThisWeek: 0, longHaulThisWeek: 0 },
  diet: "average",
  shopping: { level: "medium" },
  home: { kwhThisWeek: 85 },
};

function initialHabitsState() {
  return {
    commute: { ...defaultHabits.commute },
    flights: { ...defaultHabits.flights },
    diet: defaultHabits.diet,
    shopping: { ...defaultHabits.shopping },
    home: { ...defaultHabits.home },
  };
}

const STEPS = [
  { n: 1, label: "Weekly check-in" },
  { n: 2, label: "Carbon score" },
  { n: 3, label: "Sustainable Marketplace" },
  { n: 4, label: "Toolkit" },
  { n: 5, label: "Social & AI+" },
  { n: 6, label: "Progress" },
];

function WizardScorePlaceholder({ onGoCheckIn }) {
  return (
    <motion.section
      className="step-panel step-panel--2"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-card dashboard-card">
        <h2 className="step-form__title">Your carbon score</h2>
        <p className="step-form__lead">
          Run the weekly check-in to calculate your footprint and see benchmarks here. You can open
          any step anytime from the bar above.
        </p>
        <div className="step-actions">
          <button type="button" className="btn-cta" onClick={onGoCheckIn}>
            Go to weekly check-in
          </button>
        </div>
      </div>
    </motion.section>
  );
}

export default function App() {
  const { user, loading: authLoading, syncFootprintToLeaderboard } = useAuth();
  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });
  const [step, setStep] = useState(1);
  const [habits, setHabits] = useState(initialHabitsState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [weeklyCooldownRefresh, setWeeklyCooldownRefresh] = useState(0);
  const gamify = useGamification(result?.footprint ?? null, {
    selectedOffsetId: null,
    step,
    userId: user?.id,
    serverGamification: user?.gamification,
  });

  const weeklyCooldown = useWeeklyCheckInCooldown(user?.id, weeklyCooldownRefresh);

  useEffect(() => {
    if (!user) {
      setStep(1);
      setResult(null);
      setError(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const saved = loadDashboardSession(user.id);
    if (saved?.result?.footprint) {
      setResult(saved.result);
      if (saved.habits) setHabits(saved.habits);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !result?.footprint) return;
    saveDashboardSession(user.id, { result, habits });
  }, [user?.id, result, habits]);

  useEffect(() => {
    if (!user) {
      document.title = "CUTthecarbon";
      return;
    }
    document.title =
      step === 3
        ? "Sustainable marketplace — CUTthecarbon"
        : step === 5
          ? "Social & AI — CUTthecarbon"
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
    const cd = getWeeklyCheckInCooldownState(user?.id);
    if (cd.blocked) {
      setError(
        `Weekly check-in is on cooldown. Try again in ${formatCooldownRemaining(cd.msRemaining)} ` +
          `(next after ${cd.nextAllowedAt?.toLocaleString?.() ?? "—"}).`
      );
      return;
    }
    setLoading(true);
    try {
      const data = await postDashboard(habits);
      recordWeeklyCheckInSubmitted(user?.id);
      setWeeklyCooldownRefresh((n) => n + 1);
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
                onClick={() => setStep(s.n)}
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
                  weeklyCooldown={weeklyCooldown}
                />
              )}
              {step === 2 &&
                (result?.footprint ? (
                  <Step2Score
                    key="s2"
                    footprint={result.footprint}
                    gamify={gamify}
                    habits={habits}
                    userDisplayName={
                      user?.displayName || user?.name || user?.email?.split("@")[0] || "Guest"
                    }
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                    onOpenToolkit={() => setStep(4)}
                    onOpenPortfolio={() => setStep(6)}
                  />
                ) : (
                  <WizardScorePlaceholder key="s2-placeholder" onGoCheckIn={() => setStep(1)} />
                ))}
              {step === 3 && (
                <SustainableMarketplace
                  key="s3-marketplace"
                  onBack={() => setStep(2)}
                  onContinue={() => setStep(4)}
                />
              )}
              {step === 4 && (
                <Step4Toolkit
                  key="s4-toolkit"
                  habits={habits}
                  footprint={result?.footprint}
                  gamify={gamify}
                  onBack={() => setStep(3)}
                  onOpenPortfolio={() => setStep(6)}
                />
              )}
              {step === 5 && user && (
                <StepSocialAi
                  key="s5-social"
                  habits={habits}
                  gamify={gamify}
                  user={user}
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
