const base = import.meta.env.VITE_API_BASE ?? "";

function friendlyNonJsonError(res, text) {
  const pre = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  const snippet = (pre ? pre[1] : text).replace(/\s+/g, " ").trim().slice(0, 320);
  const routeMatch = snippet.match(/Cannot (POST|GET|PUT|DELETE|PATCH)\s+(\S+)/i);
  if (res.status === 404 && routeMatch) {
    const [, method, path] = routeMatch;
    return (
      `Server has no route for ${method} ${path}. ` +
      `Start this project’s API from the repo root: node backend/server.js ` +
      `(port 5000). If it still fails, stop any old Node process using that port and try again.`
    );
  }
  if (res.status === 404 && /Cannot (POST|GET)/i.test(snippet)) {
    return (
      "API returned 404. From the project folder run: node backend/server.js — then keep the " +
      "frontend dev server running so /api is proxied to port 5000."
    );
  }
  return snippet || res.statusText || "Invalid response";
}

async function parseResponse(res) {
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(friendlyNonJsonError(res, text));
    }
  }
  if (!res.ok) {
    throw new Error(data.error || data.detail || friendlyNonJsonError(res, text));
  }
  return data;
}

export async function postDashboard(habits) {
  const res = await fetch(`${base}/api/footprint/dashboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(habits),
  });
  return parseResponse(res);
}

export async function postCalculate(habits) {
  const res = await fetch(`${base}/api/footprint/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(habits),
  });
  return parseResponse(res);
}

export async function getFactors() {
  const res = await fetch(`${base}/api/footprint/factors`);
  return parseResponse(res);
}

export async function postCoach(habits) {
  const res = await fetch(`${base}/api/footprint/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(habits),
  });
  return parseResponse(res);
}

export const AUTH_TOKEN_KEY = "cfn_auth_token";

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function authJsonHeaders() {
  const t = getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

function authBearerHeaders() {
  const t = getStoredToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function postRegister({ email, password, displayName }) {
  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });
  return parseResponse(res);
}

export async function postLogin({ email, password }) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(res);
}

export async function getMe() {
  const res = await fetch(`${base}/api/auth/me`, {
    headers: authJsonHeaders(),
  });
  return parseResponse(res);
}

export async function getLeaderboard() {
  const res = await fetch(`${base}/api/leaderboard`, {
    headers: authBearerHeaders(),
  });
  return parseResponse(res);
}

export async function submitFootprintScore(annualKgCO2e) {
  const res = await fetch(`${base}/api/leaderboard/submit`, {
    method: "POST",
    headers: authJsonHeaders(),
    body: JSON.stringify({ annualKgCO2e }),
  });
  return parseResponse(res);
}
