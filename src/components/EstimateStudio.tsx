import React, { useState, useEffect, useMemo } from "react";
import { Calculator, Layout, Ruler, Tag, FileText, CheckCircle2, User, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Customer, Material, Estimate } from "../types";
import KitchenBlueprint from "./KitchenBlueprint";

interface EstimateStudioProps {
  customers: Customer[];
  materials: Material[];
  onEstimateSaved: () => void;
}

export default function EstimateStudio({ customers, materials, onEstimateSaved }: EstimateStudioProps) {
  // Configurator state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [length, setLength] = useState("10");
  const [width, setWidth] = useState("8");
  const [layoutType, setLayoutType] = useState("L Shape Kitchen");

  // UX Feedback State
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Layout Types configuration
  const layouts = [
    { name: "Straight Kitchen", desc: "Single wall workspace, ideal for compact rooms" },
    { name: "L Shape Kitchen", desc: "Two adjacent perpendicular walls, maximizes corner utility" },
    { name: "U Shape Kitchen", desc: "Three continuous walls, ample storage and counter-space" },
    { name: "Parallel Kitchen", desc: "Two parallel opposite counters, professional workflow corridor" }
  ];

  // Auto-select first customer and material if available
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].customer_id.toString());
    }
    if (materials.length > 0 && !selectedMaterialId) {
      setSelectedMaterialId(materials[0].material_id.toString());
    }
  }, [customers, materials]);

  // Calculations derived in real-time
  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.material_id === parseInt(selectedMaterialId));
  }, [materials, selectedMaterialId]);

  const calculations = useMemo(() => {
    const lVal = parseFloat(length) || 0;
    const wVal = parseFloat(width) || 0;
    const area = lVal * wVal;
    const rate = selectedMaterial ? selectedMaterial.rate : 0;
    const materialCost = area * rate;
    const gst = materialCost * 0.18;
    const grandTotal = materialCost + gst;

    return {
      area,
      rate,
      materialCost,
      gst,
      grandTotal
    };
  }, [length, width, selectedMaterial]);

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      setError("Please select a customer first.");
      return;
    }
    if (!selectedMaterialId) {
      setError("Please select a material grade first.");
      return;
    }

    const lVal = parseFloat(length);
    const wVal = parseFloat(width);
    if (isNaN(lVal) || lVal <= 0 || isNaN(wVal) || wVal <= 0) {
      setError("Length and Width must be valid measurements greater than 0.");
      return;
    }

    setError("");
    setSaving(true);

    const payload = {
      customer_id: parseInt(selectedCustomerId),
      material_id: parseInt(selectedMaterialId),
      length: lVal,
      width: wVal,
      layout_type: layoutType
    };

    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(true);
        onEstimateSaved();
        // Reset state after success
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to save estimate.");
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // SVG representation of layouts to give standard visual feeling
  const renderLayoutGraphic = () => {
    switch (layoutType) {
      case "Straight Kitchen":
        return (
          <svg className="w-full h-full max-h-32 text-[#0071E3]" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="30" width="180" height="20" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
            <rect x="25" y="35" width="40" height="10" rx="2" fill="currentColor" fillOpacity="0.2" />
            <rect x="85" y="35" width="30" height="10" rx="2" fill="currentColor" fillOpacity="0.2" />
            <circle cx="155" cy="40" r="5" fill="currentColor" fillOpacity="0.2" />
            <path d="M10 55H190" stroke="#D2D2D7" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        );
      case "L Shape Kitchen":
        return (
          <svg className="w-full h-full max-h-32 text-[#0071E3]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 10H190V30H30V110H10V10Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
            <rect x="60" y="15" width="40" height="10" rx="2" fill="currentColor" fillOpacity="0.2" />
            <rect x="130" y="15" width="30" height="10" rx="2" fill="currentColor" fillOpacity="0.2" />
            <rect x="15" y="50" width="10" height="30" rx="2" fill="currentColor" fillOpacity="0.2" />
            <path d="M5 115H195" stroke="#D2D2D7" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        );
      case "U Shape Kitchen":
        return (
          <svg className="w-full h-full max-h-32 text-[#0071E3]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 10H190V110H170V30H30V110H10V10Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
            <rect x="85" y="15" width="30" height="10" rx="2" fill="currentColor" fillOpacity="0.2" />
            <rect x="15" y="50" width="10" height="30" rx="2" fill="currentColor" fillOpacity="0.2" />
            <rect x="175" y="50" width="10" height="30" rx="2" fill="currentColor" fillOpacity="0.2" />
            <path d="M5 115H195" stroke="#D2D2D7" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        );
      case "Parallel Kitchen":
        return (
          <svg className="w-full h-full max-h-32 text-[#0071E3]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="180" height="20" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
            <rect x="10" y="90" width="180" height="20" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
            <rect x="30" y="15" width="45" height="10" rx="2" fill="currentColor" fillOpacity="0.2" />
            <rect x="120" y="95" width="40" height="10" rx="2" fill="currentColor" fillOpacity="0.2" />
            <circle cx="115" cy="20" r="4" fill="currentColor" fillOpacity="0.2" />
            <path d="M10 55H190" stroke="#D2D2D7" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="estimate-studio-view">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]" id="estimate-studio-title">Estimate Studio</h1>
        <p className="text-sm text-[#6E6E73] mt-1 font-medium">Design layout configuration and live quotation computation</p>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-4 bg-[#34C759]/5 border border-[#34C759]/20 rounded-2xl flex items-center gap-3 text-[#34C759] font-semibold text-sm"
          id="estimate-save-success"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Estimate saved successfully! You can view and download the PDF in the History tab.</span>
        </motion.div>
      )}

      {error && (
        <div className="p-4 bg-[#FF3B30]/5 border border-[#FF3B30]/20 rounded-2xl flex items-center gap-3 text-[#FF3B30] font-semibold text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Configurator Inputs (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Customer & Material Select */}
          <div className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2 border-b border-[#F5F5F7] pb-3">
              <User className="w-5 h-5 text-[#0071E3]" /> Client & Grade Selection
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F5F7] hover:bg-[#E8E8ED]/80 text-[#1D1D1F] text-sm font-semibold rounded-2xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                  id="est-customer-select"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Material / Finish Grade</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F5F7] hover:bg-[#E8E8ED]/80 text-[#1D1D1F] text-sm font-semibold rounded-2xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                  id="est-material-select"
                >
                  <option value="">-- Choose Grade --</option>
                  {materials.map((m) => (
                    <option key={m.material_id} value={m.material_id}>
                      {m.name} (₹{m.rate}/sq ft)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedMaterial && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-[#F5F5F7]/70 rounded-2xl border border-[#D2D2D7]/30 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#D2D2D7]/40 shrink-0 shadow-sm">
                  <img
                    src={selectedMaterial.image || (
                      selectedMaterial.material_id === 1 ? "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&h=300&q=80" :
                      selectedMaterial.material_id === 2 ? "https://images.unsplash.com/photo-1541123437800-1bb1317babca?auto=format&fit=crop&w=400&h=300&q=80" :
                      selectedMaterial.material_id === 3 ? "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=300&q=80" :
                      selectedMaterial.material_id === 4 ? "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&h=300&q=80" :
                      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&h=300&q=80"
                    )}
                    alt={selectedMaterial.name}
                    className="w-full h-full object-cover animate-fade-in"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Active Material Reference</span>
                  <h4 className="font-semibold text-sm text-[#1D1D1F] mt-0.5">{selectedMaterial.name}</h4>
                  <p className="text-xs text-[#6E6E73] font-semibold mt-0.5">Valued at ₹{selectedMaterial.rate} per sq ft</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Card 2: Layout Type Selection */}
          <div className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2 border-b border-[#F5F5F7] pb-3">
              <Layout className="w-5 h-5 text-[#0071E3]" /> Kitchen Layout Shape
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="layout-shape-selector">
              {layouts.map((lay) => (
                <button
                  key={lay.name}
                  type="button"
                  onClick={() => setLayoutType(lay.name)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 ${
                    layoutType === lay.name
                      ? "border-[#0071E3] bg-[#0071E3]/5 shadow-[0_2px_10px_rgba(0,113,227,0.05)]"
                      : "border-[#D2D2D7]/50 hover:bg-[#F5F5F7]/80 hover:border-[#D2D2D7]/80"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-sm text-[#1D1D1F]">{lay.name}</span>
                    {layoutType === lay.name && (
                      <span className="w-5 h-5 rounded-full bg-[#0071E3] flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6E6E73] mt-1 line-clamp-2 leading-relaxed font-medium">
                    {lay.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Size Measurements */}
          <div className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2 border-b border-[#F5F5F7] pb-3">
              <Ruler className="w-5 h-5 text-[#0071E3]" /> Dimensions (Feet)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Length Slider / Number */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-[#6E6E73] uppercase tracking-wider text-xs">Counter Length</span>
                  <span className="text-[#1D1D1F] bg-[#F5F5F7] px-3 py-1 rounded-lg border border-[#D2D2D7]/20 font-mono">
                    {length || "0"} ft
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="40"
                  step="0.5"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full accent-[#0071E3] h-1 bg-[#F5F5F7] rounded-lg cursor-pointer"
                  id="length-slider"
                />
                <input
                  type="number"
                  step="any"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="Manual length (ft)"
                  className="w-full px-4 py-2 bg-[#F5F5F7]/60 hover:bg-[#E8E8ED]/60 focus:bg-white text-[#1D1D1F] text-xs font-semibold rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                  id="length-number-input"
                />
              </div>

              {/* Width Slider / Number */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-[#6E6E73] uppercase tracking-wider text-xs">Counter Width / Depth</span>
                  <span className="text-[#1D1D1F] bg-[#F5F5F7] px-3 py-1 rounded-lg border border-[#D2D2D7]/20 font-mono">
                    {width || "0"} ft
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="0.5"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full accent-[#0071E3] h-1 bg-[#F5F5F7] rounded-lg cursor-pointer"
                  id="width-slider"
                />
                <input
                  type="number"
                  step="any"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Manual width (ft)"
                  className="w-full px-4 py-2 bg-[#F5F5F7]/60 hover:bg-[#E8E8ED]/60 focus:bg-white text-[#1D1D1F] text-xs font-semibold rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                  id="width-number-input"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Interactive Blueprint Planning */}
          <div className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 space-y-5" id="interactive-blueprint-card">
            <h2 className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2 border-b border-[#F5F5F7] pb-3">
              <Layout className="w-5 h-5 text-[#0071E3]" /> Interactive 2D Layout Blueprint
            </h2>
            <KitchenBlueprint
              layoutType={layoutType}
              length={parseFloat(length) || 10}
              width={parseFloat(width) || 8}
            />
          </div>

        </div>

        {/* Right Column - Live Preview Receipt (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Live Calculation Preview */}
          <div className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_12px_32px_rgba(0,0,0,0.03)] p-6 overflow-hidden relative" id="live-calculator-preview">
            
            {/* Header branding */}
            <div className="text-center pb-6 border-b border-[#F5F5F7] mb-6">
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest block mb-1">
                KitchenCraft Live Preview
              </span>
              <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">Quotation Summary</h2>
            </div>

            {/* Layout SVG Schematic representation */}
            <div className="w-full py-4 px-6 bg-[#F5F5F7]/80 rounded-2xl border border-[#D2D2D7]/20 flex flex-col items-center justify-center mb-6 relative">
              <span className="absolute top-2.5 left-3 text-[10px] font-mono font-bold text-[#86868B] uppercase tracking-wider">
                {layoutType}
              </span>
              <div className="w-full h-24 flex items-center justify-center">
                {renderLayoutGraphic()}
              </div>
            </div>

            {/* Breakdown Calculations */}
            <div className="space-y-4 text-sm font-semibold">
              <div className="flex items-center justify-between text-[#6E6E73]">
                <span>Kitchen Area</span>
                <span className="text-[#1D1D1F] font-mono">{calculations.area.toFixed(2)} sq ft</span>
              </div>
              <div className="flex items-center justify-between text-[#6E6E73]">
                <span>Unit Rate</span>
                <span className="text-[#1D1D1F] font-mono">{formatCurrency(calculations.rate)} / sq ft</span>
              </div>

              <div className="border-t border-[#F5F5F7] my-3"></div>

              <div className="flex items-center justify-between text-[#6E6E73]">
                <span>Material Cost</span>
                <span className="text-[#1D1D1F] font-mono">{formatCurrency(calculations.materialCost)}</span>
              </div>
              <div className="flex items-center justify-between text-[#6E6E73]">
                <span>GST (18% SGST + CGST)</span>
                <span className="text-[#1D1D1F] font-mono">{formatCurrency(calculations.gst)}</span>
              </div>

              <div className="border-t border-[#F5F5F7] my-3"></div>

              <div className="flex items-center justify-between bg-[#F5F5F7]/50 p-4 rounded-2xl border border-[#D2D2D7]/15">
                <span className="text-base text-[#1D1D1F] font-bold">Grand Total</span>
                <span className="text-xl font-black text-[#0071E3] tracking-tight font-mono">
                  {formatCurrency(calculations.grandTotal)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedCustomerId || !selectedMaterialId}
                className="w-full py-3.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#0071E3]/50 text-white text-sm font-semibold rounded-2xl shadow-[0_4px_12px_rgba(0,113,227,0.12)] hover:shadow-[0_4px_20px_rgba(0,113,227,0.22)] transition-all cursor-pointer flex items-center justify-center gap-2"
                id="save-estimate-btn"
              >
                <Calculator className="w-4 h-4" />
                {saving ? "Creating estimate..." : "Save & Generate Quotation"}
              </button>
              
              <div className="text-center">
                <span className="text-[10px] text-[#86868B] font-medium leading-tight">
                  Quotation generated is instantly archived in system database
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
