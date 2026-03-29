import { motion } from "framer-motion";

const TAU = 2 * Math.PI;

function polar(cx, cy, r, angleRad) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function annularSlicePath(cx, cy, R, rIn, a0, a1) {
  let span = a1 - a0;
  while (span < 0) span += TAU;
  while (span > TAU) span -= TAU;
  if (span <= 0.0001) return "";
  if (span >= TAU - 0.001) {
    return fullRingPath(cx, cy, R, rIn);
  }
  const large = span > Math.PI ? 1 : 0;
  const p0o = polar(cx, cy, R, a0);
  const p1o = polar(cx, cy, R, a1);
  const p1i = polar(cx, cy, rIn, a1);
  const p0i = polar(cx, cy, rIn, a0);
  return [
    `M ${p0o.x} ${p0o.y}`,
    `A ${R} ${R} 0 ${large} 1 ${p1o.x} ${p1o.y}`,
    `L ${p1i.x} ${p1i.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${p0i.x} ${p0i.y}`,
    "Z",
  ].join(" ");
}

function fullRingPath(cx, cy, R, rIn) {
  return [
    `M ${cx + R} ${cy}`,
    `A ${R} ${R} 0 1 1 ${cx - R} ${cy}`,
    `A ${R} ${R} 0 1 1 ${cx + R} ${cy}`,
    `L ${cx + rIn} ${cy}`,
    `A ${rIn} ${rIn} 0 1 0 ${cx - rIn} ${cy}`,
    `A ${rIn} ${rIn} 0 1 0 ${cx + rIn} ${cy}`,
    "Z",
  ].join(" ");
}

function formatPct(kg, total) {
  if (total <= 0) return "0";
  const p = (kg / total) * 100;
  if (p >= 10) return String(Math.round(p));
  const s = p.toFixed(1);
  return s.endsWith(".0") ? String(Math.round(p)) : s;
}

function formatTTonnes(kg) {
  const t = kg / 1000;
  return t.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

/** Font size (px) so label fits inside arc: scales with slice angle */
function labelFontSize(sliceRad, size) {
  const deg = (sliceRad * 180) / Math.PI;
  const base = 4.5 + deg * 0.14;
  return Math.max(5, Math.min(12, base, size * 0.038));
}

/**
 * Donut chart: every segment shows % and tonnes inside the ring (no external callouts).
 */
export function BreakdownDonut({ slices, totalKg, size = 300 }) {
  const pad = 14;
  const svgSize = size + 2 * pad;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  /* Wider band so two-line labels fit */
  const R = size * 0.41;
  const rIn = size * 0.165;

  const total = slices.reduce((s, x) => s + x.kg, 0) || 1;
  let accRad = -Math.PI / 2;

  const sliceData = slices.map(({ key, kg, color }) => {
    const share = kg / total;
    const sliceRad = share * TAU;
    const a0 = accRad;
    accRad += sliceRad;
    const a1 = accRad;
    const mid = (a0 + a1) / 2;
    const d = annularSlicePath(cx, cy, R, rIn, a0, a1);
    const pct = formatPct(kg, total);
    const tStr = formatTTonnes(kg);
    const fs = labelFontSize(sliceRad, size);
    return { key, d, color, kg, mid, pct, tStr, fs };
  });

  return (
    <div className="breakdown-donut" style={{ width: svgSize, maxWidth: "100%" }}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="breakdown-donut__svg"
        aria-hidden
      >
        {sliceData.map(({ key, d, color }, i) =>
          d ? (
            <motion.path
              key={key}
              d={d}
              fill={color}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.04 * i, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null
        )}

        {sliceData.map(({ key, d, mid, pct, tStr, fs, kg }) => {
          if (!d || kg <= 0) return null;
          const rMid = (R + rIn) / 2;
          const innerPt = polar(cx, cy, rMid, mid);

          return (
            <text
              key={`lbl-${key}`}
              className="breakdown-donut__glyph"
              x={innerPt.x}
              y={innerPt.y}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={fs}
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
            >
              <tspan x={innerPt.x} dy="-0.5em">
                {pct}%
              </tspan>
              <tspan x={innerPt.x} dy="1.05em">
                {tStr} t
              </tspan>
            </text>
          );
        })}
      </svg>
      <div className="breakdown-donut__center">
        <span className="breakdown-donut__total">
          {(totalKg / 1000).toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          })}
        </span>
        <span className="breakdown-donut__unit">t CO₂e</span>
      </div>
    </div>
  );
}
