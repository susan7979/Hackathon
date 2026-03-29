import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENTS, MOCK_LEADERBOARD, WEEKLY_CHALLENGES } from "../../data/hubContent";
import { formatTonnesFromKg, UNIT_T_CO2E_YR } from "../../utils/formatEmissions";
import { getLeaderboard } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function HubGamification({ footprint, gamify }) {
  const { user } = useAuth();
  const userKg = footprint?.annualKgCO2e ?? 0;
  const [lb, setLb] = useState(null);
  const [lbErr, setLbErr] = useState(null);

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

  const unlocked = new Set(gamify.badges || []);

  const board =
    lb?.entries?.length > 0
      ? lb.entries
      : [...MOCK_LEADERBOARD.slice(0, 6), { id: "you", name: "You", annualKg: userKg, avatar: "⭐" }].sort(
          (a, b) => a.annualKg - b.annualKg
        );

  return (
    <div className="hub-sections">
      <section className="hub-card">
        <h3 className="hub-card__title">Weekly carbon challenges</h3>
        <p className="hub-card__lead">
          Tick what you did this week — checkboxes reset on refresh; streaks & badges still save in
          this browser.
        </p>
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
          Lowest annual footprint (metric tonnes CO₂e) ranks higher. Logged-in users who run the calculator sync here; the
          list refreshes about every 12 seconds.
        </p>
        {lbErr && <p className="hub-error">{lbErr}</p>}
        <ol className="hub-board">
          {board.map((row, i) => (
            <li
              key={row.id}
              className={`hub-board__row ${row.isYou || row.id === "you" ? "hub-board__row--you" : ""}`}
            >
              <span className="hub-board__rank">{i + 1}</span>
              <span className="hub-board__ava">{row.avatar}</span>
              <span className="hub-board__name">{row.name}</span>
              <span className="hub-board__kg">
                {formatTonnesFromKg(row.annualKg, 2)} {UNIT_T_CO2E_YR}
              </span>
            </li>
          ))}
        </ol>
        {user && lb?.yourRank != null && (
          <p className="hub-note">Your rank: #{lb.yourRank} of {board.length}</p>
        )}
        {user && lb?.yourRank == null && (
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
        <div className="hub-badges">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className={`hub-badge ${unlocked.has(a.id) ? "hub-badge--on" : "hub-badge--off"}`}
            >
              <span className="hub-badge__icon">{a.icon}</span>
              <div>
                <strong>{a.title}</strong>
                <p>{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
