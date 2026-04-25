import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function LoginPage() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    nav(from, { replace: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      nav(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: "admin" | "user") {
    if (role === "admin") {
      setEmail("admin@example.com");
      setPassword("admin123");
    } else {
      setEmail("user@example.com");
      setPassword("user123");
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Use your work email to manage your meeting rooms.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label">Email</label>
            <input
              className="input mt-1"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input mt-1"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
          <div className="text-slate-500 mb-2">Demo accounts</div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => fillDemo("admin")}>
              Admin
            </button>
            <button type="button" className="btn-secondary" onClick={() => fillDemo("user")}>
              Employee
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-600">
          New here?{" "}
          <Link to="/register" className="text-brand-700 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
