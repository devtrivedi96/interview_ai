import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function useTheme() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  return { theme, toggleTheme };
}

export default function ThemeToggle({ className = "", style = {} }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: "var(--surface)",
        border: "2px solid var(--border)",
        color: "var(--accent)",
        boxShadow: "var(--shadow-md)",
        zIndex: 100,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1) rotate(180deg)";
        e.currentTarget.style.boxShadow =
          "var(--shadow-md), 0 0 20px var(--accent-glow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1) rotate(0deg)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
    >
      {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}
