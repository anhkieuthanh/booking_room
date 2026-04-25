import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import clsx from "clsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "px-3 py-2 rounded-md text-sm font-medium",
      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900"
    );

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="inline-block h-8 w-8 rounded-md bg-brand-600 text-white grid place-items-center text-sm">
              MR
            </span>
            Meridian Rooms
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={navLinkCls}>
                Rooms
              </NavLink>
              <NavLink to="/my-bookings" className={navLinkCls}>
                My bookings
              </NavLink>
              {user.is_admin && (
                <NavLink to="/admin" className={navLinkCls}>
                  Admin
                </NavLink>
              )}
            </nav>
          )}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:block text-sm text-slate-600">
                  {user.name}
                  {user.is_admin && (
                    <span className="ml-2 inline-block rounded bg-brand-100 text-brand-700 px-2 py-0.5 text-xs font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    logout();
                    nav("/login");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center text-xs text-slate-500">
          Meridian Rooms · Internal meeting room booking
        </div>
      </footer>
    </div>
  );
}
