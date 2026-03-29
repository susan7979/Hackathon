import { motion } from "framer-motion";

export function LandingGate() {
  return (
    <motion.section
      className="landing-gate"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="landing-headline"
    >
      <div className="landing-gate__inner">
        <p className="landing-gate__eyebrow">Climate starts with clarity</p>
        <h2 id="landing-headline" className="landing-gate__headline">
          Know your carbon footprint.
          <span className="landing-gate__accent">Negotiate a lighter one.</span>
        </h2>
        <p className="landing-gate__lead">
          Every commute, meal, and kilowatt-hour adds up. See your number, compare offsets, tap AI
          guidance, and climb the community leaderboard—built for action, not guilt.
        </p>
      </div>
    </motion.section>
  );
}
