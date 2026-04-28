import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, name, password);
      nav("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-slate-900">Tạo tài khoản</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bất kỳ nhân viên nào của công ty cũng có thể tự đăng ký.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label">Họ và tên</label>
            <input
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Mật khẩu (tối thiểu 6 ký tự)</label>
            <input
              className="input mt-1"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-flag-600">{error}</div>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Đang tạo…" : "Tạo tài khoản"}
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-brand-700 hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
