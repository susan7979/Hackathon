import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getMe,
  getStoredToken,
  postLogin,
  postRegister,
  setStoredToken,
  submitFootprintScore,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getMe();
      setUser(data.user);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await postLogin({ email, password });
    setStoredToken(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const { token, user: u } = await postRegister({ email, password, displayName });
    setStoredToken(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const syncFootprintToLeaderboard = useCallback(async (annualKgCO2e) => {
    if (!getStoredToken()) return;
    await submitFootprintScore(annualKgCO2e);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refresh,
      syncFootprintToLeaderboard,
    }),
    [user, loading, login, register, logout, refresh, syncFootprintToLeaderboard]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
