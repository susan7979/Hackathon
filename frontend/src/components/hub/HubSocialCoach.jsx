import { useState } from "react";
import { postCoach } from "../../api";
import { LOCAL_INITIATIVES, MOCK_FRIENDS } from "../../data/hubContent";
import { formatTonnesFromKg } from "../../utils/formatEmissions";

export function HubSocialCoach({ habits, footprint, gamify }) {
  const [pledge, setPledge] = useState("");
  const [coach, setCoach] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachErr, setCoachErr] = useState(null);

  const userKg = footprint?.annualKgCO2e ?? 0;
  const friends = [...MOCK_FRIENDS, { name: "You", annualKg: userKg }].sort(
    (a, b) => a.annualKg - b.annualKg
  );

  async function loadCoach() {
    setCoachErr(null);
    setCoachLoading(true);
    try {
      const data = await postCoach(habits);
      setCoach(data);
    } catch (e) {
      setCoachErr(e.message);
    } finally {
      setCoachLoading(false);
    }
  }

  return (
    <div className="hub-sections">
      <section className="hub-card">
        <h3 className="hub-card__title">Carbon pledges</h3>
        <p className="hub-card__lead">
          Commit to a reduction — demo bumps a fake “collective” counter (local only). The text box is
          not saved until you post; it clears after posting and when you refresh the page.
        </p>
        <textarea
          className="hub-textarea"
          rows={3}
          placeholder="e.g. I’ll take transit 3× per week this month"
          value={pledge}
          onChange={(e) => setPledge(e.target.value)}
        />
        <button
          type="button"
          className="btn-cta btn-cta--small"
          onClick={() => {
            if (!pledge.trim()) return;
            gamify.addPledge(pledge.trim());
            setPledge("");
          }}
        >
          Post pledge
        </button>
        {gamify.collectiveDemoKg != null && (
          <p className="hub-collective">
            Demo collective impact tracker:{" "}
            <strong>{formatTonnesFromKg(gamify.collectiveDemoKg, 3)}</strong> metric tonnes CO₂e
            “pledged” in this
            browser session (playful mock).
          </p>
        )}
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Local initiatives map (links)</h3>
        <p className="hub-card__lead">
          Starter links for trees, clean power, and low-waste shopping — swap for your city’s APIs.
        </p>
        <ul className="hub-initiatives">
          {LOCAL_INITIATIVES.map((x) => (
            <li key={x.title}>
              <a href={x.url} target="_blank" rel="noreferrer">
                <strong>{x.title}</strong>
              </a>
              <span className="hub-init__meta">
                {" "}
                · {x.type} · {x.area}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">Friend comparison (demo)</h3>
        <div className="hub-friends">
          {friends.map((f) => (
            <div key={f.name} className="hub-friend">
              <span>{f.name}</span>
              <div className="hub-friend__bar">
                <div
                  className="hub-friend__fill"
                  style={{
                    width: `${Math.min(100, (f.annualKg / 16000) * 100)}%`,
                  }}
                />
              </div>
              <span>{formatTonnesFromKg(f.annualKg, 2)} t</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hub-card">
        <h3 className="hub-card__title">AI personal coach</h3>
        <p className="hub-card__lead">
          Get a step-by-step reduction plan. Without an API key, the server uses a{" "}
          <strong>built-in coach</strong> from your footprint breakdown. Add{" "}
          <code>OPENAI_API_KEY</code> to <code>backend/.env</code> for richer, AI-written steps.
        </p>
        <button type="button" className="btn-cta btn-cta--small" onClick={loadCoach} disabled={coachLoading}>
          {coachLoading ? "Generating…" : "Generate my plan"}
        </button>
        {coachErr && <p className="hub-error">{coachErr}</p>}
        {coach?.plan && coach.usedOpenAI === false && (
          <p className="hub-note">
            Showing <strong>built-in</strong> plan (no OpenAI call). Add <code>OPENAI_API_KEY</code>{" "}
            and restart the API for AI-personalized wording.
          </p>
        )}
        {coach?.plan && coach.usedOpenAI === true && (
          <p className="hub-note">Plan generated with OpenAI from your latest habits.</p>
        )}
        {coach?.plan && (
          <div className="hub-coach-plan">
            <p>{coach.plan.intro}</p>
            <ol>
              {(coach.plan.steps || []).map((s, i) => (
                <li key={i}>
                  <strong>{s.title}</strong> — {s.detail}
                  {s.estimatedKgSavedPerYear != null && (
                    <span className="hub-coach-save">
                      {" "}
                      (~{formatTonnesFromKg(s.estimatedKgSavedPerYear, 2)} t/yr)
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <p>{coach.plan.closing}</p>
          </div>
        )}
      </section>

      <section className="hub-card hub-card--muted">
        <h3 className="hub-card__title">Carbon label scan · Voice advisor</h3>
        <p className="hub-card__lead">
          <strong>Product scan:</strong> future flow — camera + barcode / receipt OCR + emissions DB
          (Open Food Facts, CLIMATE TRACE proxies, or merchant APIs).
        </p>
        <p className="hub-card__lead">
          <strong>Voice mode:</strong> future flow — Web Speech API or device assistant calling the same{" "}
          <code>/api/footprint</code> endpoints.
        </p>
        <div className="hub-placeholders">
          <div className="hub-ph">📷 Scan (placeholder)</div>
          <div className="hub-ph">🎤 Ask by voice (placeholder)</div>
        </div>
      </section>
    </div>
  );
}
