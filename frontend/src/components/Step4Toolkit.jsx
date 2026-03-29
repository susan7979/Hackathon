import { motion } from "framer-motion";
import { IntegratedToolkit } from "./IntegratedToolkit";

export function Step4Toolkit({ habits, footprint, gamify, onBack, onOpenPortfolio }) {
  return (
    <motion.section
      className="step-panel step-panel--4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45 }}
    >
      <IntegratedToolkit
        habits={habits}
        footprint={footprint}
        gamify={gamify}
        onOpenPortfolio={onOpenPortfolio}
      />
      <div className="step-actions step-actions--toolkit-footer step-actions--wrap">
        <button type="button" className="btn-ghost" onClick={onBack}>
          ← Back to marketplace
        </button>
      </div>
    </motion.section>
  );
}
