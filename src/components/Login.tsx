import React, { useState } from "react";
import { Lock, User as UserIcon, ChefHat, AlertCircle, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLoginSuccess: (username: string, token: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Login({ onLoginSuccess, theme, onToggleTheme }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.username, data.token);
      } else {
        setError(data.message || "Invalid credentials. Try admin / admin123");
      }
    } catch (err) {
      setError("Unable to connect to server. Check if server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center px-4" id="login-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 relative overflow-hidden"
        id="login-card"
      >
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-6 right-6">
          <button
            onClick={onToggleTheme}
            className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-full transition-all cursor-pointer border border-[#D2D2D7]/20 bg-[#F5F5F7]/30 dark:bg-[#1e1e21] dark:hover:bg-[#2c2c2e] flex items-center justify-center"
            type="button"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            id="login-theme-toggle"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-[#1D1D1F] border border-[#D2D2D7]/40 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <ChefHat className="w-7 h-7 text-[#0071E3]" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] mb-1">KitchenCraft</h2>
          <p className="text-sm text-[#6E6E73] font-medium text-center">Apple-Inspired Modular Cost Estimator</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[#FF3B30]/5 border border-[#FF3B30]/20 rounded-2xl flex items-start gap-3"
            id="login-error"
          >
            <AlertCircle className="w-5 h-5 text-[#FF3B30] shrink-0 mt-0.5" />
            <div className="text-sm text-[#FF3B30] font-medium leading-tight">{error}</div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#86868B]">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-11 pr-4 py-3 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-2xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                id="username-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#86868B]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-2xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                id="password-input"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#0071E3]/50 text-white text-sm font-semibold rounded-2xl shadow-[0_4px_12px_rgba(0,113,227,0.15)] hover:shadow-[0_4px_20px_rgba(0,113,227,0.25)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              id="login-btn"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[#F5F5F7] text-center">
          <p className="text-xs text-[#86868B]">
            Demo Access — Use <span className="font-semibold text-[#6E6E73]">admin</span> / <span className="font-semibold text-[#6E6E73]">admin123</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
