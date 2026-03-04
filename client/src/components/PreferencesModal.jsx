import { useState, useEffect } from "react";
import { useProfileStore } from "../stores/profileStore";
import { X, Check, Moon, Sun } from "lucide-react";

const TECH_STACKS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "Go",
  "Rust",
  "C#",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
];

const ROLES = [
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Mobile Engineer",
  "Data Engineer",
  "ML Engineer",
  "QA Engineer",
  "Solutions Architect",
  "Technical Lead",
];

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior (0-2 years)" },
  { value: "intermediate", label: "Intermediate (2-5 years)" },
  { value: "senior", label: "Senior (5-10 years)" },
  { value: "lead", label: "Lead/Manager (10+ years)" },
];

const COMPANY_TYPES = [
  { value: "product", label: "Product Company" },
  { value: "startup", label: "Startup" },
  { value: "consultant", label: "Consulting Firm" },
  { value: "other", label: "Other" },
];

const INTERVIEW_MODES = ["DSA", "System Design", "Behavioral", "HR", "Coding"];

export default function PreferencesModal({
  isOpen,
  onClose,
  initialData = null,
}) {
  const { savePreferences, loading } = useProfileStore();

  const [formData, setFormData] = useState({
    tech_stack: [],
    preferred_roles: [],
    experience_level: "intermediate",
    target_company_type: "product",
    preferred_interview_modes: [],
  });

  const [theme, setTheme] = useState("dark");

  // Pre-fill form if initialData provided (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        tech_stack: initialData.tech_stack || [],
        preferred_roles: initialData.preferred_roles || [],
        experience_level: initialData.experience_level || "intermediate",
        target_company_type: initialData.target_company_type || "product",
        preferred_interview_modes: initialData.preferred_interview_modes || [],
      });
    }
    // Load theme preference
    const savedTheme = localStorage.getItem("app-theme") || "dark";
    setTheme(savedTheme);
  }, [initialData, isOpen]);

  // Handle multi-select checkboxes for arrays
  const toggleArrayField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.tech_stack.length === 0) {
      alert("Please select at least one technology");
      return;
    }
    if (formData.preferred_roles.length === 0) {
      alert("Please select at least one role");
      return;
    }
    if (formData.preferred_interview_modes.length === 0) {
      alert("Please select at least one interview mode");
      return;
    }

    const success = await savePreferences(formData);
    if (success) {
      // Toast notification handled by parent
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Interview Preferences
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Tech Stack (Select at least one)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TECH_STACKS.map((tech) => (
                <label key={tech} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tech_stack.includes(tech)}
                    onChange={() => toggleArrayField("tech_stack", tech)}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-700">{tech}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Preferred Roles (Select at least one)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ROLES.map((role) => (
                <label key={role} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.preferred_roles.includes(role)}
                    onChange={() => toggleArrayField("preferred_roles", role)}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-700">{role}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Experience Level
            </label>
            <select
              value={formData.experience_level}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  experience_level: e.target.value,
                }))
              }
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Company Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Target Company Type
            </label>
            <select
              value={formData.target_company_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  target_company_type: e.target.value,
                }))
              }
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {COMPANY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Theme Preference
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 transition-all ${
                  theme === "light"
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <Sun className="w-4 h-4" />
                <span className="font-medium">Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 transition-all ${
                  theme === "dark"
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <Moon className="w-4 h-4" />
                <span className="font-medium">Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Preferred Interview Modes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Preferred Interview Modes (Select at least one)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTERVIEW_MODES.map((mode) => (
                <label key={mode} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.preferred_interview_modes.includes(mode)}
                    onChange={() =>
                      toggleArrayField("preferred_interview_modes", mode)
                    }
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-700">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
