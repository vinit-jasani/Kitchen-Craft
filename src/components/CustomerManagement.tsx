import React, { useState, useMemo } from "react";
import { Plus, Search, User, Phone, Mail, MapPin, Edit2, Trash2, X, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer } from "../types";

interface CustomerManagementProps {
  customers: Customer[];
  onRefresh: () => void;
}

export default function CustomerManagement({ customers, onRefresh }: CustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.address.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email);
    setAddress(customer.address);
    setError("");
    setShowModal(true);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Name and Phone Number are required.");
      return;
    }
    // Simple validation
    if (phone.trim().length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setError("");
    setSaving(true);

    const payload = { name, phone, email, address };

    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.customer_id}`
        : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

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
        setError(errData.error || "An error occurred.");
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
      const response = await fetch(`/api/customers/${deleteConfirmId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onRefresh();
        setDeleteConfirmId(null);
      } else {
        const errData = await response.json().catch(() => ({}));
        setDeleteError(errData.error || "Failed to delete customer");
      }
    } catch (err) {
      console.error(err);
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6" id="customers-view">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]" id="customers-title">Customers</h1>
          <p className="text-sm text-[#6E6E73] mt-1 font-medium">Manage and track your client directory</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,113,227,0.15)] transition-all cursor-pointer self-start sm:self-auto"
          id="add-customer-btn"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md bg-white rounded-2xl border border-[#D2D2D7]/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]" id="customer-search-container">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#86868B]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search customers by name, phone or email..."
          className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium outline-none text-[#1D1D1F] placeholder-[#86868B]"
          id="customer-search-input"
        />
      </div>

      {/* Customer Bento List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="customer-cards-grid">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((cust, idx) => (
            <motion.div
              key={cust.customer_id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] p-6 transition-all duration-300 flex flex-col justify-between"
              id={`customer-card-${cust.customer_id}`}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#F5F5F7] rounded-xl flex items-center justify-center text-[#1D1D1F] border border-[#D2D2D7]/30">
                    <User className="w-5 h-5 text-[#6E6E73]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[#1D1D1F] tracking-tight">{cust.name}</h3>
                    <p className="text-xs text-[#86868B] font-mono">ID: #CUST-{cust.customer_id}</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm font-medium text-[#424245] mb-6">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#86868B] shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                  {cust.email && (
                    <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis">
                      <Mail className="w-4 h-4 text-[#86868B] shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#86868B] shrink-0 mt-0.5" />
                      <span className="text-[#6E6E73] text-xs line-clamp-2 leading-relaxed">{cust.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F5F5F7]">
                <button
                  onClick={() => openViewModal(cust)}
                  className="p-2 text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-xl transition-all cursor-pointer"
                  title="View Details"
                  id={`view-cust-${cust.customer_id}`}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(cust)}
                  className="p-2 text-[#86868B] hover:text-[#0071E3] bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-xl transition-all cursor-pointer"
                  title="Edit Customer"
                  id={`edit-cust-${cust.customer_id}`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setDeleteConfirmId(cust.customer_id); setDeleteError(""); }}
                  className="p-2 text-[#86868B] hover:text-[#FF3B30] bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-xl transition-all cursor-pointer"
                  title="Delete Customer"
                  id={`delete-cust-${cust.customer_id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-[#D2D2D7]/60">
            <p className="text-[#86868B] text-sm">No customers found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="customer-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full max-w-lg p-7 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-1.5 text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] rounded-full cursor-pointer transition-colors"
                id="close-customer-modal"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F] mb-1">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>
              <p className="text-xs text-[#6E6E73] font-medium mb-6">
                {editingCustomer ? "Update database entry for this client" : "Enter personal details to generate kitchen estimates"}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-[#FF3B30]/5 border border-[#FF3B30]/20 rounded-xl text-xs text-[#FF3B30] font-semibold flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter customer's full name"
                    className="w-full px-4 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                    id="cust-form-name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                    id="cust-form-phone"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full px-4 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200"
                    id="cust-form-email"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">Site / Delivery Address (Optional)</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter the property or shipping address for the estimate"
                    className="w-full px-4 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] focus:bg-white text-[#1D1D1F] text-sm font-medium rounded-xl border border-transparent focus:border-[#0071E3] outline-none transition-all duration-200 resize-none"
                    id="cust-form-address"
                  />
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
                    id="cust-submit-btn"
                  >
                    {saving ? "Saving..." : editingCustomer ? "Save Changes" : "Create Customer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Customer Details Modal */}
      <AnimatePresence>
        {showViewModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="customer-view-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full max-w-md p-7 relative"
            >
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-5 right-5 p-1.5 text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] rounded-full cursor-pointer transition-colors"
                id="close-cust-view"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center text-[#0071E3] border border-[#D2D2D7]/40 mb-3 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">{selectedCustomer.name}</h3>
                <span className="text-xs font-mono text-[#86868B]">ID: #CUST-{selectedCustomer.customer_id}</span>
              </div>

              <div className="space-y-4 border-t border-[#F5F5F7] pt-5">
                <div className="flex items-center justify-between py-1 border-b border-[#F5F5F7]">
                  <span className="text-xs text-[#86868B] font-semibold uppercase tracking-wider">Phone</span>
                  <span className="text-sm font-medium text-[#1D1D1F]">{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#F5F5F7]">
                  <span className="text-xs text-[#86868B] font-semibold uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium text-[#1D1D1F] break-all">{selectedCustomer.email || "—"}</span>
                </div>
                <div className="py-1">
                  <span className="text-xs text-[#86868B] font-semibold uppercase tracking-wider block mb-2">Delivery Address</span>
                  <p className="text-sm font-medium text-[#1D1D1F] leading-relaxed bg-[#F5F5F7] p-3 rounded-2xl border border-[#D2D2D7]/20">
                    {selectedCustomer.address || "No address provided"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2.5 bg-[#0071E3] text-white hover:bg-[#0077ED] text-sm font-semibold rounded-xl cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" id="customer-delete-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full max-w-md p-7 relative"
            >
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="absolute top-5 right-5 p-1.5 text-[#86868B] hover:text-[#1D1D1F] bg-[#F5F5F7] rounded-full cursor-pointer transition-colors"
                id="close-cust-delete"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 bg-[#FF3B30]/5 rounded-full flex items-center justify-center text-[#FF3B30] border border-[#FF3B30]/10 mb-3">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">Delete Customer?</h3>
                <p className="text-sm text-[#6E6E73] font-medium mt-2 leading-relaxed">
                  Are you sure you want to permanently delete this customer? All their associated modular kitchen estimates will be permanently removed. This action cannot be undone.
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
                  id="confirm-delete-cust-btn"
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
