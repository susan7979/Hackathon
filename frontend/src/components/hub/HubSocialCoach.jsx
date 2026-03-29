import { useCallback, useEffect, useState } from "react";
import { getPledges, postCoach, postPledge } from "../../api";
import { XP_PER_PLEDGE_POST } from "../../hooks/useGamification";
import { formatTonnesFromKg } from "../../utils/formatEmissions";
import { levelFromTotalXp } from "../../utils/xpLevel";

function formatRelativeTime(iso) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 45) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  const d = Math.floor(sec / 86400);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function avatarHue(name) {
  let h = 216;
  const s = String(name || "U");
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * 31) % 360;
  return h;
}

function initials(name) {
  const p = String(name || "?").trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2);
  return (p[0] || "?").slice(0, 2).toUpperCase();
}

const QUICK_PLEDGES = [
  { label: "Bike to work", text: "I'll bike to work 3× per week this month" },
  { label: "Eat plant-based", text: "I'll eat plant-based meals 4 days per week" },
];

/** Shown before “View more”; older pledges load in pages from the API. */
const PLEDGE_PREVIEW_COUNT = 5;
const PAGE_SIZE = 100;

function friendlyPledgeFetchError(message) {
  const s = String(message || "");
  if (/no route for GET.*\/api\/pledges|Cannot GET\s+\/api\/pledges/i.test(s)) {
    return (
      "The pledges API isn’t available. Stop any old server on port 5000, then from the project " +
      "folder run: node backend/server.js — or use npm run dev:full from the project root. Refresh after the API is up."
    );
  }
  if (/Failed to fetch|NetworkError|ECONNREFUSED|fetch/i.test(s)) {
    return "Can’t reach the backend on port 5000. Start it with: node backend/server.js, then refresh.";
  }
  return s;
}

function mergePledges(prev, incoming) {
  const seen = new Set(prev.map((p) => p.id));
  const out = [...prev];
  for (const p of incoming) {
    if (p?.id && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

export function HubSocialCoach({ habits, gamify, user }) {
  const [pledge, setPledge] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPledges, setTotalPledges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState(null);
  const [feedExpanded, setFeedExpanded] = useState(false);
  const [openPledgeId, setOpenPledgeId] = useState(null);

  const [coach, setCoach] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachErr, setCoachErr] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await getPledges(PLEDGE_PREVIEW_COUNT, 0);
      setRows(data.pledges || []);
      setTotalPledges(typeof data.total === "number" ? data.total : (data.pledges || []).length);
      setFeedExpanded(false);
      setOpenPledgeId(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setErr(null);
    try {
      const offset = rows.length;
      const data = await getPledges(PAGE_SIZE, offset);
      const incoming = data.pledges || [];
      setRows((prev) => mergePledges(prev, incoming));
      if (typeof data.total === "number") setTotalPledges(data.total);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [rows.length]);

  async function handlePost() {
    if (!pledge.trim() || !user) return;
    setPosting(true);
    setErr(null);
    try {
      const xpAfterThisPledge = Math.round(gamify.totalXp ?? 0) + XP_PER_PLEDGE_POST;
      const levelAfterThisPledge = levelFromTotalXp(xpAfterThisPledge);
      await postPledge(pledge.trim(), {
        xpAtPost: xpAfterThisPledge,
        levelAtPost: levelAfterThisPledge,
      });
      gamify.addPledge(pledge.trim());
      setPledge("");
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setPosting(false);
    }
  }

  async function loadCoach() {
    if (!habits) return;
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

  async function handleFeedAction() {
    if (loadingMore) return;
    if (feedExpanded && rows.length < totalPledges) {
      await loadMore();
      return;
    }
    if (feedExpanded && rows.length >= totalPledges) {
      setFeedExpanded(false);
      return;
    }
    setFeedExpanded(true);
    if (rows.length < totalPledges) {
      await loadMore();
    }
  }

  const visible = feedExpanded ? rows : rows.slice(0, PLEDGE_PREVIEW_COUNT);
  const remainingOnServer = Math.max(0, totalPledges - rows.length);
  const showFeedButton =
    totalPledges > 0 &&
    (totalPledges > PLEDGE_PREVIEW_COUNT ||
      (feedExpanded && rows.length < totalPledges) ||
      (feedExpanded && totalPledges > PLEDGE_PREVIEW_COUNT));

  function feedButtonLabel() {
    if (loadingMore) return "Loading pledges…";
    if (!feedExpanded) {
      const hint = Math.max(0, totalPledges - PLEDGE_PREVIEW_COUNT);
      return hint > 0
        ? `View more pledges (${hint} more in feed)`
        : "View more pledges";
    }
    if (rows.length < totalPledges) {
      return `Load more (${remainingOnServer} older)`;
    }
    return "Show fewer pledges";
  }

  return (
    <div className="hub-social hub-social--deck">
      <section className="hub-glass hub-social__pledge-card">
        <div className="hub-social__card-head">
          <h3 className="hub-social__h">Carbon pledges</h3>
        </div>
        <p className="hub-social__sub">
          Commit to local action and reduce your carbon footprint. Posts are shared with everyone
          signed in.
        </p>
        <textarea
          className="hub-social__textarea"
          rows={3}
          placeholder="e.g. I'll take transit 3× per week this month"
          value={pledge}
          onChange={(e) => setPledge(e.target.value)}
          disabled={!user || posting}
        />
        <div className="hub-social__actions-row">
          <div className="hub-social__actions">
            <button
              type="button"
              className="btn-cta hub-social__post-btn"
              onClick={handlePost}
              disabled={!user || posting || !pledge.trim()}
            >
              {posting ? "Posting…" : "Post pledge"}
            </button>
            <div className="hub-social__chips">
              {QUICK_PLEDGES.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  className="hub-social__chip"
                  onClick={() => setPledge(q.text)}
                  disabled={!user || posting}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          <span className="hub-social__collective">
            Collective pledges <strong>{totalPledges}</strong>
          </span>
        </div>
        {!user && (
          <p className="hub-social__hint">Sign in to post a pledge — everyone can read the feed.</p>
        )}
        {err && <p className="hub-error hub-error--pledges-api">{friendlyPledgeFetchError(err)}</p>}
      </section>

      <section
        className="hub-glass hub-social__panel hub-social__panel--posted"
        aria-labelledby="hub-posted-heading"
      >
        <h3 className="hub-social__h" id="hub-posted-heading">
          Posted pledges
        </h3>
        <p className="hub-social__sub">
          Your community&apos;s pledges to reduce carbon impact — visible to all users.
        </p>

        {loading && <p className="hub-social__muted">Loading pledges…</p>}
        {!loading && !err && rows.length === 0 && (
          <p className="hub-social__muted">No pledges yet. Be the first to post.</p>
        )}

        <div
          id="hub-posted-feed-region"
          className={
            feedExpanded ? "hub-posted-feed hub-posted-feed--scrollable" : "hub-posted-feed"
          }
        >
          <ul className="hub-posted-list hub-posted-list--in-mid">
            {visible.map((p) => {
              const name = p.author?.displayName || "Member";
              const hue = avatarHue(name);
              const lvl = p.author?.level ?? 1;
              const xp = p.author?.totalXp ?? 0;
              const cardOpen = openPledgeId === p.id;
              return (
                <li key={p.id} className="hub-posted-item">
                  <button
                    type="button"
                    className={`hub-posted-card ${cardOpen ? "hub-posted-card--open" : ""}`}
                    onClick={() =>
                      setOpenPledgeId((cur) => (cur === p.id ? null : p.id))
                    }
                    aria-expanded={cardOpen}
                    aria-label={
                      cardOpen
                        ? `Collapse pledge from ${name}`
                        : `Show full pledge from ${name}`
                    }
                  >
                    <div
                      className="hub-posted-avatar"
                      style={{
                        background: `linear-gradient(145deg, hsl(${hue}, 52%, 42%), hsl(${(hue + 40) % 360}, 45%, 32%))`,
                      }}
                      aria-hidden
                    >
                      {initials(name)}
                    </div>
                    <div className="hub-posted-body">
                      <div className="hub-posted-name">{name}</div>
                      <p
                        className={`hub-posted-text ${cardOpen ? "hub-posted-text--expanded" : ""}`}
                      >
                        {p.text}
                      </p>
                      {cardOpen && p.createdAt && (
                        <p className="hub-posted-posted-at">
                          Posted{" "}
                          {new Date(p.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="hub-posted-meta">
                      <span className="hub-posted-stat" title="Level">
                        <span aria-hidden>🔥</span> {lvl}
                      </span>
                      <span className="hub-posted-stat" title="Experience">
                        <span aria-hidden>🌿</span> {xp.toLocaleString()} XP
                      </span>
                      <time className="hub-posted-time" dateTime={p.createdAt}>
                        {formatRelativeTime(p.createdAt)}
                      </time>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {showFeedButton && (
          <button
            type="button"
            className="hub-social__view-more"
            aria-expanded={feedExpanded}
            aria-busy={loadingMore}
            aria-controls="hub-posted-feed-region"
            disabled={loadingMore}
            onClick={handleFeedAction}
          >
            {feedButtonLabel()}
          </button>
        )}
      </section>

      <section className="hub-glass hub-social__coach-card">
        <div className="hub-social__coach-head">
          <div>
            <h3 className="hub-social__h">AI personal coach</h3>
            <p className="hub-social__sub hub-social__sub--tight">
              Personalized reduction plan based on your habits.
            </p>
          </div>
          <span className="hub-social__badge-exp">Experimental</span>
        </div>
        <button type="button" className="btn-cta hub-social__coach-btn" onClick={loadCoach} disabled={coachLoading || !habits}>
          {coachLoading ? "Generating…" : "Generate my plan"}
        </button>
        {coachErr && <p className="hub-error">{coachErr}</p>}
        {coach?.plan && coach.usedOpenAI === true && (
          <p className="hub-note hub-social__coach-note">Plan generated with OpenAI from your habits.</p>
        )}
        {coach?.plan && (
          <div className="hub-social__coach-body">
            <div className="hub-social__coach-plan-left">
              <p>{coach.plan.intro}</p>
              <p className="hub-social__coach-close">{coach.plan.closing}</p>
            </div>
            <ul className="hub-social__coach-steps">
              {(coach.plan.steps || []).map((s, i) => (
                <li key={i} className="hub-social__coach-step">
                  <span className="hub-social__coach-check" aria-hidden>
                    ✓
                  </span>
                  <div>
                    <strong>{s.title}</strong>
                    {s.detail && <span className="hub-social__coach-detail"> — {s.detail}</span>}
                  </div>
                  {s.estimatedKgSavedPerYear != null && (
                    <span className="hub-social__coach-save">
                      −{formatTonnesFromKg(s.estimatedKgSavedPerYear, 2)} t
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
