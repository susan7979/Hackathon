import { useCallback, useEffect, useState } from "react";

const KEY = "cfn-gamify-v1";

function today() {
  return new Date().toDateString();
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    const { pledge: _drop, completedChallenges: _cc, ...rest } = raw;
    return rest;
  } catch {
    return {};
  }
}

/** Persist without session-only fields (challenges reset on refresh). */
function save(data) {
  const { completedChallenges: _c, ...persist } = data;
  localStorage.setItem(KEY, JSON.stringify(persist));
}

export function useGamification(footprint) {
  const [state, setState] = useState(() => ({
    ...load(),
    completedChallenges: [],
  }));

  useEffect(() => {
    const s = load();
    const d = today();
    let streak = s.streak || 0;
    if (s.lastVisit !== d) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (s.lastVisit === yesterday.toDateString()) streak = (s.streak || 0) + 1;
      else if (!s.lastVisit) streak = 1;
      else streak = 1;
    }
    setState((prev) => {
      const next = {
        ...s,
        lastVisit: d,
        streak,
        badges: new Set(s.badges || []),
        completedChallenges: prev.completedChallenges || [],
      };
      if (footprint) {
        next.badges.add("first_calc");
        if (footprint.carbonBudget?.status === "within") next.badges.add("under_budget");
        if (footprint.comparison?.relativeToUs === "below_average") next.badges.add("below_us");
        if (streak >= 3) next.badges.add("streak_3");
      }
      const out = {
        ...next,
        badges: [...next.badges],
      };
      save(out);
      return out;
    });
  }, [
    footprint?.annualKgCO2e,
    footprint?.carbonBudget?.status,
    footprint?.comparison?.relativeToUs,
  ]);

  const toggleChallenge = useCallback((id) => {
    setState((prev) => {
      const done = new Set(prev.completedChallenges || []);
      if (done.has(id)) done.delete(id);
      else done.add(id);
      const next = { ...prev, completedChallenges: [...done] };
      save(next);
      return next;
    });
  }, []);

  const addPledge = useCallback((_text) => {
    const kg = 50 + Math.floor(Math.random() * 80);
    setState((prev) => {
      const { pledge: _p, ...prevRest } = prev;
      const next = {
        ...prevRest,
        collectiveDemoKg: (prev.collectiveDemoKg || 12400) + kg,
        badges: [...new Set([...(prev.badges || []), "pledge"])],
      };
      save(next);
      return next;
    });
  }, []);

  const unlockBadge = useCallback((id) => {
    setState((prev) => {
      if ((prev.badges || []).includes(id)) return prev;
      const next = {
        ...prev,
        badges: [...new Set([...(prev.badges || []), id])],
      };
      save(next);
      return next;
    });
  }, []);

  return { ...state, toggleChallenge, addPledge, unlockBadge };
}
