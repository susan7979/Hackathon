import { useEffect } from "react";
import { motion } from "framer-motion";
import { HubPredict } from "./hub/HubPredict";

/**
 * Full-featured toolkit: always rendered below the wizard once a footprint exists.
 */
export function IntegratedToolkit({ habits, footprint, gamify, onOpenPortfolio }) {
  useEffect(() => {
    gamify.unlockBadge("hub_explorer");
  }, [gamify.unlockBadge]);

  useEffect(() => {
    gamify.recordHubTab("predict");
  }, [gamify.recordHubTab]);

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
      </div>

      <div className="glass-card integrated-toolkit__card">
        <div className="hub-panel">
          <HubPredict habits={habits} footprint={footprint} />
        </div>
      </div>
    </motion.div>
  );
}
