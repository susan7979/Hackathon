import { useCallback, useEffect, useMemo, useState } from "react";
import { getLeaderboard } from "../../api";
import { MOCK_LEADERBOARD } from "../../data/hubContent";
import { formatTonnesFromKg, UNIT_T_CO2E_YR } from "../../utils/formatEmissions";
import { levelFromTotalXp, getLevelTitle } from "../../utils/xpLevel";
import { generateLeaderboard } from "../../utils/portfolioBusinessLogic";

/**
 * Segmented leaderboard: lowest CO₂e vs highest level/XP. Data from API with mock fallback.
 */
export function PortfolioLeaderboardSection({ user, footprintKg, totalXp }) {
  const [lb, setLb] = useState(null);
  const [err, setErr] = useState(null);
  const [mode, setMode] = useState("co2");

  const load = useCallback(async () => {
    try {
      setErr(null);
      const data = await getLeaderboard();
      setLb(data);
    } catch (e) {
      setErr(e.message);
      setLb(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [load]);

  const rows = useMemo(() => {
    const base =
      lb?.entries?.length > 0
        ? lb.entries
        : [
            ...MOCK_LEADERBOARD.slice(0, 6),
            {
              id: "you",
              name: user?.displayName || user?.name || "You",
              annualKg: footprintKg ?? 0,
              totalXp: totalXp ?? 0,
              avatar: "◆",
            },
          ];
    const normalized = base.map((r) => ({
      ...r,
      totalXp: r.totalXp != null ? r.totalXp : 0,
    }));
    return generateLeaderboard(normalized, mode);
  }, [lb?.entries, footprintKg, totalXp, mode, user?.displayName, user?.name]);

  const yourRank = mode === "co2" ? lb?.yourRank : lb?.yourRankXp ?? null;

  return (
    <section className="portfolio-card">
      <div className="portfolio-card__head">
        <div>
          <h3 className="portfolio-card__title">Leaderboards</h3>
          <p className="portfolio-card__sub">
            Compare lowest annual footprint or highest XP. Live data syncs when you’re signed in.
          </p>
        </div>
      </div>
      <div className="portfolio-lb-toggle" role="tablist" aria-label="Leaderboard mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "co2"}
          className={`portfolio-lb-toggle__btn ${mode === "co2" ? "portfolio-lb-toggle__btn--on" : ""}`}
          onClick={() => setMode("co2")}
        >
          CO₂ footprint
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "xp"}
          className={`portfolio-lb-toggle__btn ${mode === "xp" ? "portfolio-lb-toggle__btn--on" : ""}`}
          onClick={() => setMode("xp")}
        >
          Level / XP
        </button>
      </div>
      {err && <p className="hub-error">{err}</p>}
      <ol className="portfolio-lb-list">
        {rows.map((row, i) => {
          const you = row.isYou || row.id === "you" || (user?.id && row.id === user.id);
          const lvl = row.level != null ? row.level : levelFromTotalXp(row.totalXp || 0);
          return (
            <li
              key={row.id}
              className={`portfolio-lb-row ${you ? "portfolio-lb-row--you" : ""}`}
            >
              <span>{i + 1}</span>
              <span aria-hidden>{row.avatar || "·"}</span>
              <span className="portfolio-lb-row__name">{row.name}</span>
              <span className="portfolio-lb-row__val">
                {mode === "co2" ? (
                  <>
                    {formatTonnesFromKg(row.annualKg, 2)} {UNIT_T_CO2E_YR}
                  </>
                ) : (
                  <>
                    Lv {lvl} · {getLevelTitle(lvl)} · {Math.round(row.totalXp || 0)} XP
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {user && yourRank != null && (
        <p className="portfolio-card__sub" style={{ marginTop: "0.65rem" }}>
          Your rank ({mode === "co2" ? "footprint" : "XP"}): #{yourRank} of {rows.length}
        </p>
      )}
      {user && yourRank == null && (
        <p className="portfolio-card__sub" style={{ marginTop: "0.65rem" }}>
          Run the calculator while signed in to post your footprint and appear on the live board.
        </p>
      )}
      {!user && (
        <p className="portfolio-card__sub" style={{ marginTop: "0.65rem" }}>
          Sign in to sync with the community leaderboard.
        </p>
      )}
    </section>
  );
}
