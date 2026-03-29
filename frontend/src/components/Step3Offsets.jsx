import { useState } from "react";
import { motion } from "framer-motion";
import {
  IMAGES,
  OFFSET_CARD_IMAGES,
  OFFSET_IMAGE_FALLBACK,
} from "../constants";
import { formatTonnesFromKg } from "../utils/formatEmissions";

function bestDealTip(offsetsRanked, ai) {
  const top = offsetsRanked?.[0];
  if (!top) return null;
  if (ai?.summary) {
    return { title: "AI tip for your footprint", body: ai.summary };
  }
  return {
    title: "Best value on the board",
    body: `${top.name} offers the strongest credibility-to-cost ratio for neutralizing about ${top.estimatedCostUsd ? `$${top.estimatedCostUsd}/year` : "your footprint"} at roughly $${top.costUsdPerTonne}/tonne.`,
  };
}

export function Step3Offsets({
  offsetsRanked,
  ai,
  aiEnabled,
  selectedId,
  onSelect,
  onBack,
  onNextToolkit,
  footprint,
}) {
  const [brokenCardImgs, setBrokenCardImgs] = useState({});
  const tip = bestDealTip(offsetsRanked, ai);
  const topId = offsetsRanked?.[0]?.id;

  return (
    <motion.section
      className="step-panel step-panel--4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45 }}
    >
      <div className="glass-card negotiator-card">
        <h2 className="step-form__title">Offset negotiator</h2>
        <p className="step-form__lead">
          Five verified-style options ranked by <strong>cost-to-impact</strong> (credibility per
          dollar). Tap a card to select your preferred offset.
        </p>

        {footprint && (
          <p className="negotiator-footprint-ref">
            Neutralizing ~<strong>{formatTonnesFromKg(footprint.annualKgCO2e, 2)}</strong> metric
            tonnes CO₂e / yr · Grade{" "}
            <strong>{footprint.grade}</strong>
          </p>
        )}

        {tip && (
          <motion.aside
            className="ai-tip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="ai-tip__sparkle" aria-hidden>
              ✦
            </span>
            <h3>{tip.title}</h3>
            <p>{tip.body}</p>
            {ai?.picks?.length > 0 && (
              <ul className="ai-tip__picks">
                {ai.picks.slice(0, 3).map((p) => {
                  const name =
                    offsetsRanked?.find((o) => o.id === p.offsetId)?.name || p.offsetId;
                  return (
                    <li key={p.offsetId}>
                      <strong>{name}</strong> — {p.reason}
                    </li>
                  );
                })}
              </ul>
            )}
            {!aiEnabled && (
              <p className="ai-tip__hint">
                Add <code>OPENAI_API_KEY</code> on the server for richer, personalized tips.
              </p>
            )}
          </motion.aside>
        )}

        <div className="offset-grid">
          {(offsetsRanked || []).map((o, i) => {
            const primary = OFFSET_CARD_IMAGES[o.id] || IMAGES.step3;
            const img = brokenCardImgs[o.id] ? OFFSET_IMAGE_FALLBACK : primary;
            const selected = selectedId === o.id;
            const isTop = o.id === topId;

            return (
              <motion.button
                key={o.id}
                type="button"
                layout
                className={`offset-card ${selected ? "offset-card--selected" : ""}`}
                onClick={() => onSelect(selected ? null : o.id)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="offset-card__image-wrap">
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenCardImgs((prev) =>
                        prev[o.id] ? prev : { ...prev, [o.id]: true }
                      )
                    }
                  />
                  {isTop && <span className="offset-card__ribbon">Top deal</span>}
                  <span className="offset-card__rank">#{i + 1}</span>
                </div>
                <div className="offset-card__body">
                  <h3>{o.name}</h3>
                  <p className="offset-card__meta">
                    ~${o.costUsdPerTonne}/t · est. <strong>${o.estimatedCostUsd}</strong>/yr for you
                  </p>
                  <p className="offset-card__desc">{o.description}</p>
                  <span className="offset-card__ratio">
                    Value score {(o.valueScore * 1000).toFixed(2)}
                  </span>
                </div>
                {selected && (
                  <motion.span
                    className="offset-card__check"
                    layoutId="offset-check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    Selected
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="step-actions step-actions--wrap">
          <button type="button" className="btn-ghost" onClick={onBack}>
            ← Back to marketplace
          </button>
          <motion.button
            type="button"
            className="btn-cta"
            onClick={onNextToolkit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Carbon toolkit →
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
