import { useState } from "react";
import { motion } from "framer-motion";

export function AuthModal({ mode, onClose, onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setErr(null);
    setEmail("");
    setPassword("");
    setDisplayName("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await onLogin(email.trim(), password);
      } else {
        await onRegister(email.trim(), password, displayName.trim());
      }
      reset();
      onClose();
    } catch (error) {
      setErr(error?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="auth-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
      role="presentation"
    >
      <motion.div
        className="auth-modal"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="auth-modal-title"
      >
        <h2 id="auth-modal-title" className="auth-modal__title">
          {mode === "login" ? "Log in" : "Create account"}
        </h2>
        <p className="auth-modal__lead">
          {mode === "login"
            ? "Use the email and password you registered with."
            : "Password must be at least 8 characters. Your footprint can sync to the live leaderboard."}
        </p>
        <form className="auth-modal__form" onSubmit={submit}>
          {mode === "register" && (
            <label className="auth-modal__label">
              Display name
              <input
                className="auth-modal__input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
              />
            </label>
          )}
          <label className="auth-modal__label">
            Email
            <input
              className="auth-modal__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="auth-modal__label">
            Password
            <input
              className="auth-modal__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
            />
          </label>
          {err && <p className="hub-error auth-modal__err">{err}</p>}
          <div className="auth-modal__actions">
            <button type="button" className="btn-ghost" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-cta btn-cta--small" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
