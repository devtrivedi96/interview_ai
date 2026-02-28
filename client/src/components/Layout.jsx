import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Mic, LogOut, BarChart3, Home, User } from "lucide-react";

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Mic className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Interview AI
              </span>
            </Link>

            <nav className="flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600"
                  >
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/analytics"
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600"
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{user?.email}</span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2026 Interview AI. Voice-first interview preparation platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
