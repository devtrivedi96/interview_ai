import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Mic,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/interview", label: "Interview", icon: Mic },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/suggestions", label: "Suggestions", icon: Lightbulb },
  { to: "/preparation", label: "Preparation", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClasses = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-primary-600 text-white"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    ].join(" ");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                <Mic className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">Interview AI</span>
              </Link>

              <nav className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-primary-600">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-col">
          <div className="h-16 px-5 flex items-center border-b border-gray-100">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Mic className="w-7 h-7 text-primary-600" />
              <span className="font-bold text-gray-900">Interview AI</span>
            </Link>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={linkClasses}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 truncate mb-3">{user?.email}</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between md:hidden">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Mic className="w-6 h-6 text-primary-600" />
              <span className="font-semibold text-gray-900">Interview AI</span>
            </Link>
            <button onClick={() => setOpen(true)} className="p-2 rounded-md border border-gray-200">
              <Menu className="w-5 h-5" />
            </button>
          </header>

          {open && (
            <div className="fixed inset-0 z-40 md:hidden">
              <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Menu</span>
                  <button onClick={() => setOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={linkClasses}
                        onClick={() => setOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>

                <div className="mt-6">
                  <p className="text-xs text-gray-500 truncate mb-3">{user?.email}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
