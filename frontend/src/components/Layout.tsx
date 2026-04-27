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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 font-semibold text-slate-900 min-w-0">
            <img
              src="/logo.png"
              alt="Hoàng Long Group"
              className="h-9 w-9 rounded-md object-contain bg-white ring-1 ring-slate-200 p-0.5"
            />
            <span className="flex flex-col leading-tight min-w-0">
              <span className="truncate text-brand-700">Hoàng Long Group</span>
              <span className="text-[11px] font-normal text-slate-500 truncate">
                Đặt phòng họp nội bộ
              </span>
            </span>
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={navLinkCls}>
                Phòng họp
              </NavLink>
              <NavLink to="/my-bookings" className={navLinkCls}>
                Lịch của tôi
              </NavLink>
              {user.is_admin && (
                <NavLink to="/admin" className={navLinkCls}>
                  Quản trị
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
                    <span className="ml-2 inline-block rounded bg-sun-500 text-brand-900 px-2 py-0.5 text-xs font-semibold">
                      Quản trị
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
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary">
                  Tạo tài khoản
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
          Hoàng Long Group · Hệ thống đặt phòng họp nội bộ
        </div>
      </footer>
    </div>
  );
}
