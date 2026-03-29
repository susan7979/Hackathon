import { useState } from "react";
import { motion } from "framer-motion";
import {
  MARKETPLACE_ALL_BRANDS,
  MARKETPLACE_IMAGE_FALLBACK,
} from "../data/sustainableMarketplace";

export function SustainableMarketplace({ onBack, onContinue }) {
  const [broken, setBroken] = useState({});

  return (
    <motion.section
      className="step-panel step-panel--3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45 }}
    >
      <div className="glass-card negotiator-card marketplace-page">
        <h2 className="step-form__title">Sustainable marketplace</h2>
        <p className="step-form__lead">
          Curated shops and climate partners — use <strong>Shop more</strong> on each card to open the
          site in a new tab, then continue to the toolkit.
        </p>

        <div className="offset-grid marketplace-grid--3x5">
          {MARKETPLACE_ALL_BRANDS.map((b, i) => {
            const img = broken[b.id] ? MARKETPLACE_IMAGE_FALLBACK : b.image;
            const n = i + 1;
            return (
              <motion.article
                key={b.id}
                className="offset-card marketplace-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.03 * Math.min(i, 18),
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="offset-card__image-wrap marketplace-card__image-wrap">
                  <span className="offset-card__rank marketplace-card__num" aria-hidden="true">
                    {n}
                  </span>
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBroken((prev) => (prev[b.id] ? prev : { ...prev, [b.id]: true }))
                    }
                  />
                </div>
                <div className="offset-card__body marketplace-card__body">
                  <h3>{b.name}</h3>
                  <p className="marketplace-card__subtitle">{b.subtitle}</p>
                </div>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="marketplace-card__learn"
                  aria-label={`Shop more at ${b.name} (opens in new tab)`}
                >
                  Shop more
                </a>
              </motion.article>
            );
          })}
        </div>

        <div className="step-actions step-actions--wrap">
          <button type="button" className="btn-ghost" onClick={onBack}>
            ← Back to score
          </button>
          <motion.button
            type="button"
            className="btn-cta"
            onClick={onContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue to toolkit →
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
