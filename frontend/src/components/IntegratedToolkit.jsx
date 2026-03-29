import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HubGamification } from "./hub/HubGamification";
import { HubPredict } from "./hub/HubPredict";
import { HubSocialCoach } from "./hub/HubSocialCoach";
import { HubInsights } from "./hub/HubInsights";

const TABS = [
  { id: "play", label: "Play & compete" },
  { id: "predict", label: "Predict & scenarios" },
  { id: "social", label: "Social & AI+" },
  { id: "insights", label: "Money & data" },
];

/**
 * Full-featured toolkit: always rendered below the wizard once a footprint exists.
 */
export function IntegratedToolkit({ habits, footprint, result, gamify, onOpenPortfolio }) {
  const [tab, setTab] = useState("play");

  useEffect(() => {
    gamify.unlockBadge("hub_explorer");
  }, [gamify.unlockBadge]);

  useEffect(() => {
    gamify.recordHubTab(tab);
  }, [tab, gamify.recordHubTab]);

  return (
    <motion.div
      id="carbon-toolkit"
      className="integrated-toolkit"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="integrated-toolkit__head">
        <div className="integrated-toolkit__head-top">
          <h2 className="integrated-toolkit__title">Your carbon toolkit</h2>
          {typeof onOpenPortfolio === "function" && (
            <button
              type="button"
              className="integrated-toolkit__progress-link"
              onClick={onOpenPortfolio}
            >
              Your progress
            </button>
          )}
        </div>
        <p className="integrated-toolkit__sub">
          Everything below uses the same API as your score — challenges, simulations, pledges, AI
          coach, savings, heatmaps, and exports in one place.
        </p>
        <div className="hub-tabs" role="tablist" aria-label="Toolkit sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`hub-tab ${tab === t.id ? "hub-tab--active" : ""}`}
              onClick={() => {
                setTab(t.id);
                document.getElementById("carbon-toolkit")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card integrated-toolkit__card">
        <div className="hub-panel" role="tabpanel">
          {tab === "play" && <HubGamification footprint={footprint} gamify={gamify} />}
          {tab === "predict" && <HubPredict habits={habits} footprint={footprint} />}
          {tab === "social" && (
            <HubSocialCoach habits={habits} footprint={footprint} gamify={gamify} />
          )}
          {tab === "insights" && (
            <HubInsights habits={habits} footprint={footprint} result={result} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
