import { useCallback, useEffect, useMemo, useState } from "react";
import { getLeaderboard } from "../../api";
import { MOCK_LEADERBOARD } from "../../data/hubContent";
import { formatTonnesFromKg, UNIT_METRIC_TONNES_WK, UNIT_METRIC_TONNES_YR } from "../../utils/formatEmissions";
import { levelFromTotalXp, getLevelTitle } from "../../utils/xpLevel";
import { generateLeaderboard } from "../../utils/portfolioBusinessLogic";

/**
 * Leaderboards: weekly footprint, projected annual, most improved, XP.
 */
export function PortfolioLeaderboardSection({ user, footprintKg, totalXp }) {
  const [lb, setLb] = useState(null);
  const [err, setErr] = useState(null);
  const [mode, setMode] = useState("weekly");

  const load = useCallback(async () => {
    try {
      setErr(null);
      const data = await getLeaderboard(mode);
      setLb(data);
    } catch (e) {
      setErr(e.message);
      setLb(null);
    }
  }, [mode]);

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
              weeklyKg: footprintKg != null ? Math.round(footprintKg / 52) : 0,
              weekVsPriorPercent: null,
              totalXp: totalXp ?? 0,
              avatar: "◆",
            },
          ];
    const normalized = base.map((r) => ({
      ...r,
      totalXp: r.totalXp != null ? r.totalXp : 0,
      weeklyKg: r.weeklyKg != null ? r.weeklyKg : r.annualKg != null ? Math.round(r.annualKg / 52) : null,
    }));
    return generateLeaderboard(normalized, mode);
  }, [lb?.entries, footprintKg, totalXp, mode, user?.displayName, user?.name]);

  const yourRank =
    mode === "weekly"
      ? lb?.yourRankWeekly
      : mode === "projected"
        ? lb?.yourRankProjected
        : mode === "improved"
          ? lb?.yourRankImproved
          : lb?.yourRankXp;

  return (
    <section className="portfolio-card">
      <div className="portfolio-card__head">
        <div>
          <h3 className="portfolio-card__title">Leaderboards</h3>
          <p className="portfolio-card__sub">
            Weekly footprint, projected yearly, most improved vs last week, or XP — live when you’re
            signed in.
          </p>
        </div>
      </div>
      <div className="portfolio-lb-toggle portfolio-lb-toggle--four" role="tablist" aria-label="Leaderboard mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "weekly"}
          className={`portfolio-lb-toggle__btn ${mode === "weekly" ? "portfolio-lb-toggle__btn--on" : ""}`}
          onClick={() => setMode("weekly")}
        >
          Weekly CO₂
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "projected"}
          className={`portfolio-lb-toggle__btn ${mode === "projected" ? "portfolio-lb-toggle__btn--on" : ""}`}
          onClick={() => setMode("projected")}
        >
          Projected yr
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "improved"}
          className={`portfolio-lb-toggle__btn ${mode === "improved" ? "portfolio-lb-toggle__btn--on" : ""}`}
          onClick={() => setMode("improved")}
        >
          Most improved
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
                {mode === "weekly" ? (
                  <>
                    {formatTonnesFromKg(row.weeklyKg ?? 0, 2)} {UNIT_METRIC_TONNES_WK}
                  </>
                ) : mode === "projected" ? (
                  <>
                    {formatTonnesFromKg(row.annualKg ?? 0, 2)} {UNIT_METRIC_TONNES_YR}
                  </>
                ) : mode === "improved" ? (
                  <>{row.weekVsPriorPercent != null ? `${row.weekVsPriorPercent}%` : "—"} vs prior</>
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
          Your rank ({mode}): #{yourRank} of {rows.length}
        </p>
      )}
      {user && yourRank == null && (
        <p className="portfolio-card__sub" style={{ marginTop: "0.65rem" }}>
          Submit a weekly check-in while signed in to appear on the live boards.
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
