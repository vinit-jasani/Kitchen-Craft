import React, { useState, useMemo } from "react";
import { Search, Calendar, Trash2, FileText, Download, Printer, X, Eye, FileSpreadsheet, Layout, Ruler, Tag, Share2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Estimate } from "../types";
import { jsPDF } from "jspdf";

interface EstimateHistoryProps {
  estimates: Estimate[];
  onRefresh: () => void;
}

export default function EstimateHistory({ estimates, onRefresh }: EstimateHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Link copy state tracking
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyShareLink = (id: number) => {
    const origin = window.location.origin;
    const link = `${origin}/?share=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Custom Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Filter based on search (customer name, material name, or layout shape)
  const filteredEstimates = useMemo(() => {
    if (!searchTerm.trim()) return estimates;
    const term = searchTerm.toLowerCase();
    return estimates.filter(
      (e) =>
        e.customer_name?.toLowerCase().includes(term) ||
        e.material_name?.toLowerCase().includes(term) ||
        e.layout_type.toLowerCase().includes(term) ||
        `#est-${e.estimate_id}`.includes(term)
    );
  }, [estimates, searchTerm]);

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const openViewModal = (est: Estimate) => {
    setSelectedEstimate(est);
    setShowViewModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/estimates/${deleteConfirmId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        onRefresh();
        setDeleteConfirmId(null);
      } else {
        const errData = await response.json().catch(() => ({}));
        setDeleteError(errData.error || "Failed to delete estimate");
      }
    } catch (err) {
      console.error(err);
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // GENERATE PREMIUM PDF USING jsPDF
  const generatePDF = (est: Estimate, action: "download" | "print" = "download") => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Helper coordinates
    const startX = 20;
    let currentY = 25;

    // BRAND COLOR PALETTE (Minimal Apple Charcoal and Slate)
    const primaryColor = [29, 29, 31]; // #1D1D1F
    const secondaryColor = [110, 110, 115]; // #6E6E73
    const accentColor = [0, 113, 227]; // #0071E3
    const lightBg = [245, 245, 247]; // #F5F5F7

    // 1. HEADER BRANDING
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 15, 180, 2, "F"); // Small elegant accent top line

    // Company Name & Logo Placeholder
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("KitchenCraft", startX, currentY + 10);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Premium Modular Kitchen Cost Estimator", startX, currentY + 15);

    // Quotation Metadata
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("QUOTATION", 140, currentY + 8);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Ref No: KC-EST-${est.estimate_id.toString().padStart(4, "0")}`, 140, currentY + 13);
    doc.text(`Date: ${est.created_date}`, 140, currentY + 18);

    currentY += 30;

    // 2. CLIENT DETAILS SECTION
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(startX, currentY, 170, 32, 3, 3, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("QUOTATION PREPARED FOR:", startX + 5, currentY + 6);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(est.customer_name || "Valued Client", startX + 5, currentY + 13);
    
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Phone: +91 ${est.customer_phone || "—"}`, startX + 5, currentY + 19);
    doc.text(`Email: ${est.customer_email || "—"}`, startX + 5, currentY + 24);

    if (est.customer_address) {
      // Split text for multiline address safety
      const splitAddress = doc.splitTextToSize(`Site: ${est.customer_address}`, 80);
      doc.text(splitAddress, 100, currentY + 13);
    } else {
      doc.text("Site Address: Not specified", 100, currentY + 13);
    }

    currentY += 42;

    // 3. KITCHEN DESIGN SPECIFICATIONS TABLE
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("KITCHEN SPECIFICATIONS", startX, currentY);

    currentY += 5;

    // Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(startX, currentY, 170, 8, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.text("Layout & Shape", startX + 4, currentY + 5.5);
    doc.text("Material Grade", startX + 50, currentY + 5.5);
    doc.text("Dimensions", startX + 105, currentY + 5.5);
    doc.text("Total Area", startX + 145, currentY + 5.5);

    // Table Row Content
    currentY += 8;
    doc.setFillColor(255, 255, 255);
    doc.rect(startX, currentY, 170, 12, "F");
    doc.setDrawColor(210, 210, 215); // Border #D2D2D7
    doc.line(startX, currentY + 12, startX + 170, currentY + 12); // underline

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("Helvetica", "normal");
    doc.text(est.layout_type, startX + 4, currentY + 7);
    doc.text(est.material_name || "Standard", startX + 50, currentY + 7);
    doc.text(`${est.length} ft x ${est.width} ft`, startX + 105, currentY + 7);
    
    doc.setFont("Helvetica", "bold");
    doc.text(`${est.area.toFixed(1)} sq ft`, startX + 145, currentY + 7);

    currentY += 22;

    // 4. FINANCIAL BREAKDOWN RECEIPT
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("VALUATION BREAKDOWN", startX, currentY);

    currentY += 5;

    // Financial lines
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    doc.text("Material Cost Subtotal:", startX + 80, currentY + 5);
    doc.text(`₹ ${est.material_cost.toLocaleString("en-IN")}`, 165, currentY + 5, { align: "right" });

    doc.text("GST Tax (18% Central + State):", startX + 80, currentY + 11);
    doc.text(`₹ ${est.gst.toLocaleString("en-IN")}`, 165, currentY + 11, { align: "right" });

    doc.line(startX + 80, currentY + 15, startX + 170, currentY + 15);

    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Grand Total (All-Inclusive):", startX + 80, currentY + 22);
    doc.text(`INR ${est.total_cost.toLocaleString("en-IN")}`, 165, currentY + 22, { align: "right" });

    currentY += 40;

    // 5. TERMS & CONDITIONS
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TERMS AND CONDITIONS", startX, currentY);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("1. This quotation is calculated based on raw board and finish rates and is valid for 30 days from date of issue.", startX, currentY + 5);
    doc.text("2. Cost includes modular cabinets, drawer channels, base shutters, handles, hinges, and standard hinges.", startX, currentY + 9);
    doc.text("3. Site preparation, civil works, electric connections, gas piping, and plumbing are extra if not specified.", startX, currentY + 13);
    doc.text("4. Payment schedule: 50% advance on ordering, 40% on material delivery, and 10% post-installation completion.", startX, currentY + 17);

    // 6. SIGNATURE BLOCK
    doc.line(140, currentY + 10, 185, currentY + 10);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Authorized Signature", 145, currentY + 14);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.text("KitchenCraft Systems", 147, currentY + 18);

    // Save or Print
    if (action === "download") {
      doc.save(`KitchenCraft_Quotation_EST-${est.estimate_id}.pdf`);
    } else {
      // Print
      const stringPdf = doc.output("bloburl");
      const printWindow = window.open(stringPdf);
      if (printWindow) {
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6" id="history-view">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]" id="history-title">Estimate History</h1>
        <p className="text-sm text-[#6E6E73] mt-1 font-medium">Retrieve and generate custom PDF quotations of prior sessions</p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md bg-white rounded-2xl border border-[#D2D2D7]/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]" id="history-search-container">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#86868B]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, layout, or estimate ID..."
          className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium outline-none text-[#1D1D1F] placeholder-[#86868B]"
          id="history-search-input"
        />
      </div>

      {/* Table or Cards Layout */}
      <div className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] overflow-hidden" id="history-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="history-table">
            <thead>
              <tr className="border-b border-[#F5F5F7] text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Layout Shape</th>
                <th className="py-4 px-6">Area Size</th>
                <th className="py-4 px-6">Grand Total</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7]">
              {filteredEstimates.length > 0 ? (
                filteredEstimates.map((est) => (
                  <tr key={est.estimate_id} className="hover:bg-[#F5F5F7]/40 transition-colors text-sm font-medium text-[#1D1D1F]">
                    <td className="py-4 px-6 font-mono text-xs text-[#6E6E73]">#EST-{est.estimate_id}</td>
                    <td className="py-4 px-6 text-xs text-[#6E6E73] flex items-center gap-1.5 pt-4.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {est.created_date}
                    </td>
                    <td className="py-4 px-6">{est.customer_name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-[#F5F5F7] px-2.5 py-1 rounded-full text-xs text-[#6E6E73] border border-[#D2D2D7]/20">
                        {est.layout_type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#6E6E73] font-mono text-xs">{est.area.toFixed(1)} sq ft</td>
                    <td className="py-4 px-6 text-[#0071E3] font-bold">{formatCurrency(est.total_cost)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyShareLink(est.estimate_id)}
                          className="p-2 text-[#86868B] hover:text-[#0071E3] hover:bg-[#F5F5F7] rounded-xl transition-all cursor-pointer relative"
                          title="Copy Shareable Live Link"
                          id={`share-est-${est.estimate_id}`}
                        >
                          {copiedId === est.estimate_id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openViewModal(est)}
                          className="p-2 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-xl transition-all cursor-pointer"
                          title="View Details"
                          id={`view-est-${est.estimate_id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(est, "download")}
                          className="p-2 text-[#86868B] hover:text-[#0071E3] hover:bg-[#F5F5F7] rounded-xl transition-all cursor-pointer"
                          title="Download Quotation PDF"
                          id={`dl-pdf-${est.estimate_id}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteConfirmId(est.estimate_id); setDeleteError(""); }}
                          className="p-2 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#F5F5F7] rounded-xl transition-all cursor-pointer"
                          title="Delete Estimate"
                          id={`del-est-${est.estimate_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#86868B] text-sm">
                    No estimates matching "{searchTerm}" found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Estimate Details Modal */}
      <AnimatePresence>
        {showViewModal && selectedEstimate && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="estimate-view-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full max-w-xl p-7 relative"
            >
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-5 right-5 p-1.5 text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] rounded-full cursor-pointer transition-colors"
                id="close-est-view"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-[#0071E3] border border-[#D2D2D7]/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">Quotation #EST-{selectedEstimate.estimate_id}</h3>
                  <span className="text-xs font-semibold text-[#86868B]">Created on {selectedEstimate.created_date}</span>
                </div>
              </div>

              {/* Grid with Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 border-y border-[#F5F5F7] py-5">
                
                {/* Customer Card */}
                <div className="space-y-3 bg-[#F5F5F7]/40 p-4 rounded-2xl border border-[#D2D2D7]/20">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Customer Information</span>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-[#1D1D1F]">{selectedEstimate.customer_name}</h4>
                    <p className="text-xs text-[#6E6E73]">Phone: {selectedEstimate.customer_phone}</p>
                    {selectedEstimate.customer_email && <p className="text-xs text-[#6E6E73] break-all">Email: {selectedEstimate.customer_email}</p>}
                  </div>
                </div>

                {/* Specs Card */}
                <div className="space-y-3 bg-[#F5F5F7]/40 p-4 rounded-2xl border border-[#D2D2D7]/20">
                  <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Kitchen Specifications</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]">
                      <Layout className="w-3.5 h-3.5 text-[#0071E3]" /> {selectedEstimate.layout_type}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]">
                      <Ruler className="w-3.5 h-3.5 text-[#0071E3]" /> {selectedEstimate.length} ft x {selectedEstimate.width} ft ({selectedEstimate.area.toFixed(1)} sq ft)
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]">
                      <Tag className="w-3.5 h-3.5 text-[#0071E3]" /> {selectedEstimate.material_name} (₹{selectedEstimate.material_rate}/sq ft)
                    </div>
                  </div>
                </div>

              </div>

              {/* Price Table breakdown */}
              <div className="space-y-3 font-semibold text-sm mb-6 bg-[#F5F5F7]/25 p-4 rounded-2xl border border-[#D2D2D7]/15">
                <div className="flex items-center justify-between text-[#6E6E73]">
                  <span>Material Subtotal</span>
                  <span className="text-[#1D1D1F] font-mono">{formatCurrency(selectedEstimate.material_cost)}</span>
                </div>
                <div className="flex items-center justify-between text-[#6E6E73]">
                  <span>GST Taxes (18%)</span>
                  <span className="text-[#1D1D1F] font-mono">{formatCurrency(selectedEstimate.gst)}</span>
                </div>
                <div className="border-t border-[#F5F5F7] my-2"></div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-[#1D1D1F] font-bold">Grand Total Valuation</span>
                  <span className="text-lg font-black text-[#0071E3] font-mono">{formatCurrency(selectedEstimate.total_cost)}</span>
                </div>
              </div>

              {/* Signature Block Preview / Download actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => copyShareLink(selectedEstimate.estimate_id)}
                  className="px-5 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-sm font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all border border-[#D2D2D7]/30"
                  id="share-modal-btn"
                >
                  {copiedId === selectedEstimate.estimate_id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" /> Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[#0071E3]" /> Copy Shared Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => generatePDF(selectedEstimate, "print")}
                  className="px-5 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-sm font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all"
                  id="print-modal-btn"
                >
                  <Printer className="w-4 h-4" /> Print PDF
                </button>
                <button
                  onClick={() => generatePDF(selectedEstimate, "download")}
                  className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(0,113,227,0.12)] transition-all"
                  id="dl-modal-btn"
                >
                  <Download className="w-4 h-4" /> Download Quotation PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Estimate Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="estimate-delete-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full max-w-md p-7 relative"
            >
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="absolute top-5 right-5 p-1.5 text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] rounded-full cursor-pointer transition-colors"
                id="close-est-delete"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 bg-[#FF3B30]/5 rounded-full flex items-center justify-center text-[#FF3B30] border border-[#FF3B30]/10 mb-3">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">Delete Estimate?</h3>
                <p className="text-sm text-[#6E6E73] font-medium mt-2 leading-relaxed">
                  Are you sure you want to permanently delete this modular kitchen estimate quotation? This action is irreversible.
                </p>
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-[#FF3B30]/5 border border-[#FF3B30]/20 rounded-xl text-xs text-[#FF3B30] font-semibold flex items-center gap-2">
                  <span>⚠️</span> {deleteError}
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-1/2 px-5 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-sm font-semibold rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="w-1/2 px-5 py-2.5 bg-[#FF3B30] hover:bg-[#FF453A] text-white text-sm font-semibold rounded-xl cursor-pointer shadow-[0_2px_8px_rgba(255,59,48,0.15)] transition-all"
                  id="confirm-delete-est-btn"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
