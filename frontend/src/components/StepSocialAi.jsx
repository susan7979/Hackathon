import { useEffect } from "react";
import { motion } from "framer-motion";
import { HubSocialCoach } from "./hub/HubSocialCoach";

/**
 * Standalone “Social & AI+” page — same content as the Social tab inside the toolkit.
 */
export function StepSocialAi({ habits, gamify, onBack, onOpenPortfolio, user }) {
  useEffect(() => {
    gamify.recordHubTab("social");
  }, [gamify.recordHubTab]);

  return (
    <motion.section
      className="step-panel step-panel--social-ai"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45 }}
    >
      <div className="glass-card negotiator-card">
        <div className="integrated-toolkit integrated-toolkit--standalone" id="social-ai-page">
          <div className="integrated-toolkit__head">
            <div className="integrated-toolkit__head-top">
              <h2 className="integrated-toolkit__title">Social & AI+</h2>
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
              Carbon pledges and the community feed — same experience as the Social tab inside the
              toolkit.
            </p>
          </div>

          <div className="hub-social-page-outer">
            <div className="hub-panel hub-panel--social-deck" role="tabpanel">
              <HubSocialCoach habits={habits} gamify={gamify} user={user} />
            </div>
          </div>
        </div>

        <div className="step-actions step-actions--toolkit-footer step-actions--wrap">
          <button type="button" className="btn-ghost" onClick={onBack}>
            ← Back to toolkit
          </button>
        </div>
      </div>
    </motion.section>
  );
}
