import { useCallback, useEffect, useMemo, useState } from "react";
import { ACHIEVEMENT_DEFS, xpSumForStars } from "../../data/xpAchievements";
import { MOCK_LEADERBOARD, WEEKLY_CHALLENGES } from "../../data/hubContent";
import { formatTonnesFromKg, UNIT_T_CO2E_YR } from "../../utils/formatEmissions";
import { levelFromTotalXp } from "../../utils/xpLevel";
import { getLeaderboard } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function HubGamification({ footprint, gamify }) {
  const { user } = useAuth();
  const userKg = footprint?.annualKgCO2e ?? 0;
  const [lb, setLb] = useState(null);
  const [lbErr, setLbErr] = useState(null);
  const [leaderboardMode, setLeaderboardMode] = useState("co2");

  const load = useCallback(async () => {
    try {
      setLbErr(null);
      const data = await getLeaderboard();
      setLb(data);
    } catch (e) {
      setLbErr(e.message);
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

  useEffect(() => {
    const t = setTimeout(load, 600);
    return () => clearTimeout(t);
  }, [userKg, load]);

  const achievementStars = gamify.achievementStars || {};

  const rows = useMemo(() => {
    const base =
      lb?.entries?.length > 0
        ? lb.entries
        : [
            ...MOCK_LEADERBOARD.slice(0, 6),
            {
              id: "you",
              name: "You",
              annualKg: userKg,
              totalXp: gamify.totalXp ?? 0,
              avatar: "⭐",
            },
          ];
    const withXp = base.map((r) => ({
      ...r,
      totalXp: r.totalXp != null ? r.totalXp : 0,
    }));
    if (leaderboardMode === "co2") {
      return [...withXp].sort((a, b) => a.annualKg - b.annualKg);
    }
    return [...withXp].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
  }, [lb?.entries, userKg, leaderboardMode, gamify.totalXp]);

  const yourRank =
    leaderboardMode === "co2" ? lb?.yourRank : lb?.yourRankXp ?? null;

  return (
    <div className="hub-sections">
      <section className="hub-card">
        <h3 className="hub-card__title">Weekly carbon challenges</h3>
        <p className="hub-card__lead">
          Tick what you did this week — checkboxes reset on refresh; XP, streaks & achievements save in
          this browser. Challenge XP uses a streak multiplier (up to ×2).
        </p>
        <div className="hub-xp-strip">
          <span className="hub-xp-strip__level">
            Level <strong>{gamify.level ?? 1}</strong>
          </span>
          <span className="hub-xp-strip__xp">
            <strong>{Math.round(gamify.totalXp ?? 0)}</strong> XP total
          </span>
          <span className="hub-xp-strip__meta" title="Applies to weekly challenge check-ins">
            Streak ×{gamify.streakMultiplier?.toFixed(2) ?? "1.00"}
          </span>
        </div>
        <ul className="hub-challenge-list">
          {WEEKLY_CHALLENGES.map((c) => (
            <li key={c.id}>
              <label className="hub-challenge">
                <input
                  type="checkbox"
                  checked={(gamify.completedChallenges || []).includes(c.id)}
                  onChange={() => gamify.toggleChallenge(c.id)}
                />
                <span className="hub-challenge__icon">{c.badge}</span>
                <span>
                  <strong>{c.title}</strong>
                  <span className="hub-challenge__hint"> · ~{c.kgHint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="hub-streak">
          <span className="hub-streak__fire">🔥</span> Streak:{" "}
          <strong>{gamify.streak || 0}</strong> day(s) visiting the app
        </p>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Community leaderboard</h3>
        <p className="hub-card__lead">
          Compare footprints (lowest CO₂e wins) or XP levels (most XP wins). Logged-in users sync about
          every 12 seconds.
        </p>
        <div className="hub-lb-toggle" role="tablist" aria-label="Leaderboard type">
          <button
            type="button"
            role="tab"
            aria-selected={leaderboardMode === "co2"}
            className={`hub-lb-toggle__btn ${leaderboardMode === "co2" ? "hub-lb-toggle__btn--active" : ""}`}
            onClick={() => setLeaderboardMode("co2")}
          >
            Lowest CO₂ footprint
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={leaderboardMode === "xp"}
            className={`hub-lb-toggle__btn ${leaderboardMode === "xp" ? "hub-lb-toggle__btn--active" : ""}`}
            onClick={() => setLeaderboardMode("xp")}
          >
            Highest XP & level
          </button>
        </div>
        {lbErr && <p className="hub-error">{lbErr}</p>}
        <ol className="hub-board">
          {rows.map((row, i) => (
            <li
              key={row.id}
              className={`hub-board__row ${row.isYou || row.id === "you" ? "hub-board__row--you" : ""}`}
            >
              <span className="hub-board__rank">{i + 1}</span>
              <span className="hub-board__ava">{row.avatar}</span>
              <span className="hub-board__name">{row.name}</span>
              <span className="hub-board__kg">
                {leaderboardMode === "co2" ? (
                  <>
                    {formatTonnesFromKg(row.annualKg, 2)} {UNIT_T_CO2E_YR}
                  </>
                ) : (
                  <>
                    Lv {levelFromTotalXp(row.totalXp || 0)} · {Math.round(row.totalXp || 0)} XP
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
        {user && yourRank != null && (
          <p className="hub-note">
            Your rank ({leaderboardMode === "co2" ? "footprint" : "XP"}): #{yourRank} of {rows.length}
          </p>
        )}
        {user && yourRank == null && (
          <p className="hub-note">
            Run the lifestyle calculator while signed in to post your footprint and get a rank.
          </p>
        )}
        {!user && (
          <p className="hub-note">Sign up or log in to appear on the live leaderboard with your score.</p>
        )}
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Achievements</h3>
        <p className="hub-card__lead hub-card__lead--tight">
          Up to 3 stars each — higher tiers award more XP. Progress saves locally.
        </p>
        <div className="hub-badges">
          {ACHIEVEMENT_DEFS.map((a) => {
            const n = achievementStars[a.id] || 0;
            const xpEarned = xpSumForStars(n, a);
            const unlocked = n > 0;
            return (
              <div
                key={a.id}
                className={`hub-badge hub-badge--stars ${unlocked ? "hub-badge--on" : "hub-badge--off"}`}
              >
                <span className="hub-badge__icon">{a.icon}</span>
                <div className="hub-badge__body">
                  <div className="hub-badge__head">
                    <strong>{a.title}</strong>
                    <span className="hub-badge__xp">{xpEarned} XP</span>
                  </div>
                  <div className="hub-achievement__stars" aria-label={`${n} of 3 stars`}>
                    {[1, 2, 3].map((s) => (
                      <span
                        key={s}
                        className={s <= n ? "hub-star hub-star--on" : "hub-star"}
                        title={a.starDesc?.[s - 1] || ""}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <ul className="hub-tier-list">
                    {a.starDesc.map((line, i) => (
                      <li
                        key={i}
                        className={`hub-tier-line ${i < n ? "hub-tier-line--done" : ""}`}
                      >
                        <span className="hub-tier-num">{i + 1}★</span> {line}{" "}
                        <span className="hub-tier-xp">+{a.starXp[i]} XP</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
