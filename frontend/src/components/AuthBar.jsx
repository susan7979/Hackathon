import { AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";

function initialsFromDisplayName(name) {
  const s = String(name || "?").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

export function AuthBar({ authModal, setAuthModal }) {
  const { user, loading, logout, login, register } = useAuth();

  const closeModal = () => setAuthModal((s) => ({ ...s, open: false }));
  const openLogin = () => setAuthModal({ open: true, mode: "login" });
  const openSignup = () => setAuthModal({ open: true, mode: "register" });

  if (loading) {
    return (
      <div className="auth-bar auth-bar--loading" aria-busy="true">
        <span className="auth-bar__muted">…</span>
      </div>
    );
  }

  return (
    <>
      <div className={`auth-bar ${user ? "auth-bar--authed" : ""}`}>
        {user ? (
          <>
            <button type="button" className="auth-bar__logout-btn" onClick={logout}>
              Log out
            </button>
            <div className="auth-bar__profile" title={user.email}>
              <span className="auth-bar__avatar" aria-hidden>
                {initialsFromDisplayName(user.displayName)}
              </span>
              <span className="auth-bar__profile-text">
                <span className="auth-bar__profile-name">{user.displayName}</span>
                <span className="auth-bar__profile-hint">Signed in</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="btn-ghost btn-ghost--compact" onClick={openLogin}>
              Log in
            </button>
            <button type="button" className="btn-cta btn-cta--small auth-bar__signup" onClick={openSignup}>
              Sign up
            </button>
          </>
        )}
      </div>
      <AnimatePresence>
        {authModal.open && (
          <AuthModal
            key="auth-modal"
            mode={authModal.mode}
            onClose={closeModal}
            onLogin={login}
            onRegister={register}
          />
        )}
      </AnimatePresence>
    </>
  );
}
