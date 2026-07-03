import React, { useState, useMemo } from "react";
import { Plus, Search, Tag, DollarSign, Edit2, Trash2, X, AlertCircle, Upload, Link, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Material } from "../types";

interface MaterialMasterProps {
  materials: Material[];
  onRefresh: () => void;
}

export default function MaterialMaster({ materials, onRefresh }: MaterialMasterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [image, setImage] = useState("");
  const [imageType, setImageType] = useState<"upload" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Custom Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Resolve material image with gorgeous fallbacks based on ID or keywords
  const getMaterialImage = (mat: Material) => {
    if (mat.image) return mat.image;
    switch (mat.material_id) {
      case 1:
        return "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&h=300&q=80"; // MDF
      case 2:
        return "https://images.unsplash.com/photo-1541123437800-1bb1317babca?auto=format&fit=crop&w=400&h=300&q=80"; // Marine Plywood
      case 3:
        return "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=300&q=80"; // BWR Plywood
      case 4:
        return "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&h=300&q=80"; // Acrylic Finish
      default:
        const lowerName = mat.name.toLowerCase();
        if (lowerName.includes("wood") || lowerName.includes("ply")) {
          return "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=300&q=80";
        }
        if (lowerName.includes("acrylic") || lowerName.includes("finish") || lowerName.includes("gloss")) {
          return "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&h=300&q=80";
        }
        return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&h=300&q=80";
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Downscale image to max width/height of 500px to prevent huge base64 strings in the DB
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85); // Compress as JPEG at 85% quality
          setImage(compressedBase64);
          setError("");
        } else {
          setImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Filter based on search
  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) return materials;
    const term = searchTerm.toLowerCase();
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.rate.toString().includes(term)
    );
  }, [materials, searchTerm]);

  // Currency formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const openAddModal = () => {
    setEditingMaterial(null);
    setName("");
    setRate("");
    setImage("");
    setImageType("upload");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    setName(material.name);
    setRate(material.rate.toString());
    setImage(material.image || "");
    setImageType(material.image && !material.image.startsWith("data:") ? "url" : "upload");
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rate.trim()) {
      setError("Please fill in both Material Name and Rate.");
      return;
    }

    const rateNum = parseFloat(rate);
    if (isNaN(rateNum) || rateNum <= 0) {
      setError("Please enter a valid rate greater than 0.");
      return;
    }

    setError("");
    setSaving(true);

    const payload = { name, rate: rateNum, image };

    try {
      const url = editingMaterial
        ? `/api/materials/${editingMaterial.material_id}`
        : "/api/materials";
      const method = editingMaterial ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onRefresh();
        setShowModal(false);
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to save material.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/materials/${deleteConfirmId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onRefresh();
        setDeleteConfirmId(null);
      } else {
        const errData = await response.json().catch(() => ({}));
        setDeleteError(errData.error || "Failed to delete material");
      }
    } catch (err) {
      console.error(err);
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6" id="materials-view">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]" id="materials-title">Materials</h1>
          <p className="text-sm text-[#6E6E73] mt-1 font-medium">Configure base prices per square foot for raw boards & finishes</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,113,227,0.15)] transition-all cursor-pointer self-start sm:self-auto"
          id="add-material-btn"
        >
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md bg-white rounded-2xl border border-[#D2D2D7]/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]" id="material-search-container">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#86868B]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search materials by name or price..."
          className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium outline-none text-[#1D1D1F] placeholder-[#86868B]"
          id="material-search-input"
        />
      </div>

      {/* Materials grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" id="materials-grid">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((mat, idx) => (
            <motion.div
              key={mat.material_id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 flex flex-col justify-between"
              id={`material-card-${mat.material_id}`}
            >
              {/* Material Image Container */}
              <div className="relative h-44 bg-[#F5F5F7] overflow-hidden border-b border-[#D2D2D7]/30">
                <img
                  src={getMaterialImage(mat)}
                  alt={mat.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                  id={`material-img-${mat.material_id}`}
                />
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-bold font-mono text-[#86868B] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-[#D2D2D7]/20">
                    ID: #{mat.material_id}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-[#1D1D1F] tracking-tight mb-3 line-clamp-1">
                    {mat.name}
                  </h3>

                  <div className="flex items-baseline gap-1 bg-[#F5F5F7]/50 p-3.5 rounded-2xl border border-[#D2D2D7]/15">
                    <span className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                      {formatCurrency(mat.rate)}
                    </span>
                    <span className="text-xs font-semibold text-[#86868B]">/ sq ft</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-5 border-t border-[#F5F5F7]">
                  <button
                    onClick={() => openEditModal(mat)}
                    className="p-2 text-[#86868B] hover:text-[#0071E3] bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-xl transition-all cursor-pointer"
                    title="Edit Material"
                    id={`edit-mat-${mat.material_id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeleteConfirmId(mat.material_id); setDeleteError(""); }}
                    className="p-2 text-[#86868B] hover:text-[#FF3B30] bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-xl transition-all cursor-pointer"
                    title="Delete Material"
                    id={`delete-mat-${mat.material_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-[#D2D2D7]/60">
            <p className="text-[#86868B] text-sm">No materials found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Add / Edit Material Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="material-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full max-w-md p-7 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-1.5 text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] rounded-full cursor-pointer transition-colors"
                id="close-material-modal"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F] mb-1">
                {editingMaterial ? "Edit Material Grade" : "Add New Material"}
              </h2>
              <p className="text-xs text-[#6E6E73] font-medium mb-6">
                Specify raw material names and standard per square foot valuation
              </p>

              {error && (
                <div className="mb-4 p-3 bg-[#FF3B30]/5 border border-[#FF3B30]/20 rounded-xl text-xs text-[#FF3B30] font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Material / Grade Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. BWR Plywood, Acrylic Finish"
                    className="w-full px-4 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                    id="mat-form-name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Rate (Per Sq Ft in INR)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-semibold text-[#86868B]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="e.g. 2200"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                      id="mat-form-rate"
                    />
                  </div>
                </div>

                {/* Image Selection Tab Mode */}
                <div>
                  <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Material Image</label>
                  <div className="flex bg-[#F5F5F7] p-1 rounded-xl mb-3">
                    <button
                      type="button"
                      onClick={() => setImageType("upload")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        imageType === "upload"
                          ? "bg-white text-[#1D1D1F] shadow-sm font-bold"
                          : "text-[#6E6E73] hover:text-[#1D1D1F]"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageType("url")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        imageType === "url"
                          ? "bg-white text-[#1D1D1F] shadow-sm font-bold"
                          : "text-[#6E6E73] hover:text-[#1D1D1F]"
                      }`}
                    >
                      <Link className="w-3.5 h-3.5" /> Image URL
                    </button>
                  </div>

                  {imageType === "upload" ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => document.getElementById("file-upload-input")?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                        isDragging
                          ? "border-[#0071E3] bg-[#0071E3]/5"
                          : image
                          ? "border-[#D2D2D7]/50 bg-[#F5F5F7]/30 hover:bg-[#F5F5F7]/60"
                          : "border-[#D2D2D7] hover:border-[#86868B] hover:bg-[#F5F5F7]/30"
                      }`}
                      id="drag-drop-area"
                    >
                      <input
                        type="file"
                        id="file-upload-input"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFile(e.target.files[0]);
                          }
                        }}
                      />

                      {image ? (
                        <div className="relative group w-full max-w-[200px] h-24 rounded-lg overflow-hidden border border-[#D2D2D7]/40 shadow-sm animate-fade-in">
                          <img
                            src={image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">Change Image</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-[#F5F5F7] rounded-full flex items-center justify-center text-[#86868B] mb-2 border border-[#D2D2D7]/20 animate-fade-in">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-[#1D1D1F] animate-fade-in">
                            Drag & drop your file here, or <span className="text-[#0071E3]">browse</span>
                          </p>
                          <p className="text-[10px] text-[#86868B] font-medium mt-1 animate-fade-in">
                            Supports PNG, JPG, JPEG or WebP (Auto-compressed)
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#86868B]">
                          <Link className="w-4 h-4" />
                        </span>
                        <input
                          type="url"
                          value={image.startsWith("data:") ? "" : image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full pl-11 pr-4 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                          id="mat-form-image-url"
                        />
                      </div>
                      {image && !image.startsWith("data:") && (
                        <div className="flex justify-center p-2 bg-[#F5F5F7] rounded-2xl border border-[#D2D2D7]/30">
                          <img
                            src={image}
                            alt="URL Preview"
                            className="max-h-24 rounded-lg object-cover shadow-sm"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&h=300&q=80";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {image && (
                    <div className="flex justify-end mt-2 animate-fade-in">
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="text-[11px] text-[#FF3B30] font-semibold hover:underline cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-sm font-semibold rounded-xl cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-semibold rounded-xl cursor-pointer shadow-[0_2px_8px_rgba(0,113,227,0.15)] transition-all flex items-center gap-1.5"
                    id="mat-submit-btn"
                  >
                    {saving ? "Saving..." : editingMaterial ? "Save Changes" : "Create Material"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Material Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="material-delete-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full max-w-md p-7 relative"
            >
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="absolute top-5 right-5 p-1.5 text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] rounded-full cursor-pointer transition-colors"
                id="close-mat-delete"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 bg-[#FF3B30]/5 rounded-full flex items-center justify-center text-[#FF3B30] border border-[#FF3B30]/10 mb-3">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">Delete Material?</h3>
                <p className="text-sm text-[#6E6E73] font-medium mt-2 leading-relaxed">
                  Are you sure you want to delete this material? All modular kitchen estimates utilizing this material might lose their pricing reference.
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
                  id="confirm-delete-mat-btn"
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
