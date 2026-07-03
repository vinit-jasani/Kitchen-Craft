/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ChefHat, Layout, Users, Tag, Calculator, History, LogOut, Loader2, User, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CustomerManagement from "./components/CustomerManagement";
import MaterialMaster from "./components/MaterialMaster";
import EstimateStudio from "./components/EstimateStudio";
import EstimateHistory from "./components/EstimateHistory";
import ClientSharedViewer from "./components/ClientSharedViewer";
import { Customer, Material, Estimate } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("kc_theme") as "light" | "dark") || "light"
  );
  
  // Collaborative shared estimate session ID from URL params
  const [sharedEstimateId, setSharedEstimateId] = useState<number | null>(null);

  // Parse URL query on mount to enter read-only client mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get("share") || params.get("estimate");
    if (shareId) {
      const parsed = parseInt(shareId);
      if (!isNaN(parsed)) {
        setSharedEstimateId(parsed);
      }
    }
  }, []);

  // Sync dark class on mount and theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("kc_theme", theme);
  }, [theme]);

  // Global synchronized data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);

  // Check for existing session token
  useEffect(() => {
    const storedToken = localStorage.getItem("kc_session_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch all resources when logged in
  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [custRes, matRes, estRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/materials"),
        fetch("/api/estimates")
      ]);

      if (custRes.ok && matRes.ok && estRes.ok) {
        const [custData, matData, estData] = await Promise.all([
          custRes.json(),
          matRes.json(),
          estRes.json()
        ]);
        setCustomers(custData);
        setMaterials(matData);
        setEstimates(estData);
      }
    } catch (e) {
      console.error("Error synchronizing local database", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const handleLoginSuccess = (username: string, sessionToken: string) => {
    localStorage.setItem("kc_session_token", sessionToken);
    localStorage.setItem("kc_username", username);
    setToken(sessionToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("kc_session_token");
    localStorage.removeItem("kc_username");
    setToken(null);
    setActiveTab("dashboard");
  };

  // If a client or guest opens a shared link, render the ClientSharedViewer immediately (bypassing login)
  if (sharedEstimateId !== null) {
    return <ClientSharedViewer estimateId={sharedEstimateId} />;
  }

  if (!token) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        theme={theme} 
        onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} 
      />
    );
  }

  // Render proper sub-view
  const renderContent = () => {
    if (loading && customers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-[#6E6E73]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
          <span className="text-sm font-semibold">Synchronizing secure cloud systems...</span>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            customers={customers}
            materials={materials}
            estimates={estimates}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case "customers":
        return <CustomerManagement customers={customers} onRefresh={fetchAllData} />;
      case "materials":
        return <MaterialMaster materials={materials} onRefresh={fetchAllData} />;
      case "estimate":
        return <EstimateStudio customers={customers} materials={materials} onEstimateSaved={fetchAllData} />;
      case "history":
        return <EstimateHistory estimates={estimates} onRefresh={fetchAllData} />;
      default:
        return null;
    }
  };

  // Nav configuration
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Layout },
    { id: "customers", label: "Customers", icon: Users },
    { id: "materials", label: "Materials", icon: Tag },
    { id: "estimate", label: "Estimate Studio", icon: Calculator },
    { id: "history", label: "History", icon: History }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans" id="app-shell">
      
      {/* 1. GLASSMORPHIC TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#D2D2D7]/40 px-6 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]" id="header-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0071E3] text-white rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,113,227,0.15)]">
              <ChefHat className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-[#1D1D1F] text-base block">KitchenCraft</span>
              <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-widest block -mt-0.5">Modular Studio</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5" id="desktop-nav-items">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? "bg-[#0071E3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.12)]"
                      : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
                  }`}
                  id={`nav-${item.id}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle Switcher */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-xl cursor-pointer transition-all flex items-center justify-center border border-[#D2D2D7]/20 bg-[#F5F5F7]/30 dark:bg-[#1e1e21] dark:hover:bg-[#2c2c2e]"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              id="theme-toggle-btn"
            >
              {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
            </button>
            
            {/* Logged in Avatar block */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F7] rounded-full border border-[#D2D2D7]/20">
              <div className="w-5 h-5 bg-[#0071E3] text-white rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#1D1D1F]">Admin</span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2.5 text-[#6E6E73] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 rounded-xl cursor-pointer transition-colors"
              title="Sign Out of KitchenCraft"
              id="logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8" id="main-content-area">
        {renderContent()}
      </main>

      {/* 3. MOBILE NAVIGATION BOTTOM BAR */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#D2D2D7]/50 py-2.5 px-4 z-40 flex items-center justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.02)]" id="mobile-nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                isActive ? "text-[#0071E3]" : "text-[#86868B]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </footer>

      {/* 4. FOOTER CREDITS (Sleek MCA Signature) */}
      <footer className="hidden md:block py-6 border-t border-[#D2D2D7]/30 text-center text-xs text-[#86868B] font-medium" id="footer-credits">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 KitchenCraft Cost Estimator. MCA Project System.</span>
          <span>Apple Human Interface Guideline Styling</span>
        </div>
      </footer>

    </div>
  );
}
