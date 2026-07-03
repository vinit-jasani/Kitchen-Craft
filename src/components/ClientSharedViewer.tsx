import React, { useState, useEffect } from "react";
import { ChefHat, Layout, Ruler, Tag, FileText, CheckCircle2, ArrowRight, Clock, Sparkles, Copy, Check, Loader2, RefreshCw, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { Estimate, Material } from "../types";
import KitchenBlueprint from "./KitchenBlueprint";

interface ClientSharedViewerProps {
  estimateId: number;
}

export default function ClientSharedViewer({ estimateId }: ClientSharedViewerProps) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Track theme locally for client
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("kc_theme") as "light" | "dark") || "light"
  );

  // Sync dark class on mount and theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("kc_theme", theme);
  }, [theme]);

  // Fetch estimate details and materials
  const fetchEstimate = async (silent = false) => {
    try {
      const response = await fetch(`/api/share/${estimateId}`);
      if (response.ok) {
        const data = await response.json();
        setEstimate(data);
        setError("");
      } else {
        if (!silent) {
          setError("This link might be invalid or the estimate has been deleted.");
        }
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        setError("Network error. Please verify your connection.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error("Error fetching materials", err);
    } finally {
      setMaterialsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimate();
    fetchMaterials();
  }, [estimateId]);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const copyShareLink = () => {
    const href = window.location.href;
    navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0a0a0c] flex flex-col items-center justify-center gap-3 text-[#6E6E73] dark:text-[#a1a1a6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
        <span className="text-sm font-semibold font-sans">Connecting to design session reference...</span>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mb-4 text-2xl">
          ⚠️
        </div>
        <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-[#f5f5f7]">Design Session Unavailable</h3>
        <p className="text-sm text-[#6E6E73] dark:text-zinc-400 mt-2 font-medium">
          {error || "The shared link is broken or the estimate is no longer available on our secure servers."}
        </p>
        <a 
          href="/" 
          className="mt-6 px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-semibold rounded-xl transition-all shadow-[0_2px_8px_rgba(0,113,227,0.12)] cursor-pointer"
        >
          Go to Homepage
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#070709] text-[#1D1D1F] dark:text-[#f5f5f7] flex flex-col transition-colors duration-300" id="shared-viewer-root">
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-[#D2D2D7]/40 dark:border-white/10 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0071E3] text-white rounded-xl flex items-center justify-center shadow-lg">
              <ChefHat className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base">KitchenCraft Studio</span>
                <span className="px-2.5 py-0.5 bg-[#86868B]/10 border border-[#86868B]/20 text-[#86868B] dark:text-zinc-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Reference Only
                </span>
              </div>
              <span className="text-[10px] text-[#6E6E73] dark:text-zinc-400 font-bold uppercase tracking-widest block">
                Client Proposal Viewer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-zinc-900 rounded-xl cursor-pointer transition-all border border-[#D2D2D7]/20 dark:border-white/10"
              title="Toggle Theme"
              type="button"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Share link copy */}
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F5F5F7] hover:bg-[#E8E8ED] dark:bg-zinc-900 dark:hover:bg-zinc-800 text-[#1D1D1F] dark:text-white rounded-full text-xs font-bold transition-all border border-[#D2D2D7]/40 dark:border-white/10 cursor-pointer"
              type="button"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Link Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#0071E3]" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* VIEWPORT CONTENT */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Secure Proposal Banner */}
        <div className="bg-gradient-to-r from-slate-100 to-[#F5F5F7] dark:from-zinc-900/40 dark:to-zinc-950/40 border border-[#D2D2D7]/40 dark:border-white/5 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">
              Quotation Proposal Reference
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
              Kitchen Design Proposal for {estimate.customer_name}
            </h1>
            <p className="text-xs text-[#6E6E73] dark:text-zinc-400 font-medium">
              This is a secure read-only reference of your modular kitchen design quotation. If you would like to request changes, please contact your design executive.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 text-xs font-bold text-[#6E6E73] dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/60 border border-[#D2D2D7]/50 dark:border-white/10 px-4 py-2 rounded-2xl shadow-sm">
            <Clock className="w-4 h-4 text-[#86868B]" />
            <span>Generated Quote Proposal</span>
          </div>
        </div>

        {/* WORKSPACE COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: DESIGN PLAYGROUND AND CAD CANVAS (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Interactive Blueprint Plan Card */}
            <div className="bg-white dark:bg-[#121214] rounded-3xl border border-[#D2D2D7]/60 dark:border-white/10 p-6 space-y-5 shadow-sm" id="blueprint-shared-card">
              <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2 border-b border-[#F5F5F7] dark:border-white/5 pb-3">
                <Layout className="w-5 h-5 text-[#0071E3]" /> 2D Layout Blueprint
              </h2>
              
              <KitchenBlueprint
                layoutType={estimate.layout_type}
                length={estimate.length}
                width={estimate.width}
                appliancesState={estimate.appliances}
                readOnly={true}
              />
            </div>

            {/* Design Specifications Reference Card */}
            <div className="bg-white dark:bg-[#121214] rounded-3xl border border-[#D2D2D7]/60 dark:border-white/10 p-6 space-y-5 shadow-sm" id="specs-shared-card">
              <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2 border-b border-[#F5F5F7] dark:border-white/5 pb-3">
                <Sparkles className="w-5 h-5 text-[#0071E3]" /> Design Specifications
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Layout Shape Spec */}
                <div className="p-4 bg-[#F5F5F7]/40 dark:bg-[#1c1c1e]/40 border border-[#D2D2D7]/20 dark:border-white/5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Kitchen Shape</span>
                  <span className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Layout className="w-4 h-4 text-[#0071E3]" /> {estimate.layout_type}
                  </span>
                </div>

                {/* Material Grade Spec */}
                <div className="p-4 bg-[#F5F5F7]/40 dark:bg-[#1c1c1e]/40 border border-[#D2D2D7]/20 dark:border-white/5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Material & Rate</span>
                  <span className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#0071E3]" /> {estimate.material_name} (₹{estimate.material_rate}/sq ft)
                  </span>
                </div>

                {/* Countertop Length Spec */}
                <div className="p-4 bg-[#F5F5F7]/40 dark:bg-[#1c1c1e]/40 border border-[#D2D2D7]/20 dark:border-white/5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Countertop Length</span>
                  <span className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2 font-mono">
                    <Ruler className="w-4 h-4 text-[#0071E3]" /> {estimate.length} ft
                  </span>
                </div>

                {/* Countertop Width Spec */}
                <div className="p-4 bg-[#F5F5F7]/40 dark:bg-[#1c1c1e]/40 border border-[#D2D2D7]/20 dark:border-white/5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Countertop Width</span>
                  <span className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2 font-mono">
                    <Ruler className="w-4 h-4 text-[#0071E3]" /> {estimate.width} ft
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT: LIVE VALUATION RECEIPT (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Pricing Breakdown Card */}
            <div className="bg-white dark:bg-[#121214] rounded-3xl border border-[#D2D2D7]/60 dark:border-white/10 p-6 shadow-lg space-y-6 sticky top-20" id="receipt-shared-card">
              
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-4 border-b border-[#F5F5F7] dark:border-white/5">
                <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest block">Valuation Invoice</span>
                <h2 className="text-lg font-extrabold text-[#1D1D1F] dark:text-white">Modular Kitchen Quotation</h2>
                <p className="text-xs text-[#6E6E73] dark:text-zinc-400 font-medium">Ref No: KC-EST-{estimate.estimate_id.toString().padStart(4, "0")}</p>
              </div>

              {/* Client Info Block */}
              <div className="space-y-2 bg-[#F5F5F7]/50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-[#D2D2D7]/20 dark:border-white/5">
                <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Prepared For</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white">{estimate.customer_name}</h4>
                  <p className="text-xs text-[#6E6E73] dark:text-zinc-400">Phone: +91 {estimate.customer_phone}</p>
                  {estimate.customer_email && <p className="text-xs text-[#6E6E73] dark:text-zinc-400 truncate">Email: {estimate.customer_email}</p>}
                  {estimate.customer_address && <p className="text-xs text-[#6E6E73] dark:text-zinc-400 line-clamp-2">Site: {estimate.customer_address}</p>}
                </div>
              </div>

              {/* Specs Itemization List */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Itemized Specs</span>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#6E6E73] dark:text-zinc-400">Layout Shape</span>
                    <span className="text-[#1D1D1F] dark:text-white bg-[#F5F5F7] dark:bg-zinc-800 px-2.5 py-1 rounded-full">{estimate.layout_type}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#6E6E73] dark:text-zinc-400">Board Material</span>
                    <span className="text-[#1D1D1F] dark:text-white font-bold">{estimate.material_name}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#6E6E73] dark:text-zinc-400">Dimensions</span>
                    <span className="text-[#1D1D1F] dark:text-white font-mono">{estimate.length} ft × {estimate.width} ft</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#6E6E73] dark:text-zinc-400">Planimetric Countertop Area</span>
                    <span className="text-[#1D1D1F] dark:text-white font-mono font-bold">{estimate.area.toFixed(1)} sq ft</span>
                  </div>
                </div>
              </div>

              {/* Financial Lines */}
              <div className="space-y-3 border-t border-[#F5F5F7] dark:border-white/5 pt-5">
                <div className="flex justify-between items-center text-xs font-semibold text-[#6E6E73] dark:text-zinc-400">
                  <span>Material Cost Subtotal</span>
                  <span className="font-mono text-[#1D1D1F] dark:text-white">{formatCurrency(estimate.material_cost)}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-[#6E6E73] dark:text-zinc-400">
                  <span>GST Taxes (18% Statutory)</span>
                  <span className="font-mono text-[#1D1D1F] dark:text-white">{formatCurrency(estimate.gst)}</span>
                </div>

                {/* Grand Total Highlight */}
                <div className="bg-[#0071E3]/5 dark:bg-[#0071E3]/10 border border-[#0071E3]/10 rounded-2xl p-4 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] font-black text-[#0071E3] dark:text-[#38a1ff] uppercase tracking-wider block">Estimated Total</span>
                    <span className="text-xs text-[#6E6E73] dark:text-zinc-400 font-semibold">All-Inclusive Price</span>
                  </div>
                  <span className="text-xl font-black text-[#0071E3] dark:text-[#38a1ff] font-mono">
                    {formatCurrency(estimate.total_cost)}
                  </span>
                </div>
              </div>

              {/* Steps To Complete Checklist */}
              <div className="bg-[#F5F5F7]/30 dark:bg-[#121214]/50 border border-[#D2D2D7]/30 dark:border-white/5 p-4 rounded-2xl space-y-3">
                <span className="text-[9px] font-black text-[#86868B] dark:text-zinc-400 uppercase tracking-widest block">Next Steps to Finalize Order</span>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-[#1D1D1F] dark:text-white">Design Approved</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs font-semibold">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-700 shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5">2</div>
                    <span className="text-[#6E6E73] dark:text-zinc-400">Schedule site measurement audit</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs font-semibold">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-700 shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5">3</div>
                    <span className="text-[#6E6E73] dark:text-zinc-400">Generate final work contract & invoice</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Footer Branding */}
      <footer className="py-6 border-t border-[#D2D2D7]/30 dark:border-white/5 text-center text-xs text-[#86868B] font-medium mt-12 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 KitchenCraft Studio. Secure Proposal Viewer.</span>
          <span>Apple Human Interface Guideline Visuals</span>
        </div>
      </footer>

    </div>
  );
}
