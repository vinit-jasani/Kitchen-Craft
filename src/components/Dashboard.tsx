import React from "react";
import { Users, Layout, Award, DollarSign, ArrowRight, UserPlus, FileSpreadsheet, PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import { Customer, Material, Estimate } from "../types";

interface DashboardProps {
  customers: Customer[];
  materials: Material[];
  estimates: Estimate[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ customers, materials, estimates, onNavigate }: DashboardProps) {
  // Calculations
  const totalCustomers = customers.length;
  const totalMaterials = materials.length;
  const totalEstimates = estimates.length;
  const totalRevenue = estimates.reduce((sum, e) => sum + e.total_cost, 0);

  // Take top 4 recent estimates
  const recentEstimates = [...estimates]
    .sort((a, b) => b.estimate_id - a.estimate_id)
    .slice(0, 4);

  // Quick formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Stats data array for dynamic rendering
  const stats = [
    {
      id: "stat-customers",
      title: "Total Customers",
      value: totalCustomers.toString(),
      sub: "Active database",
      icon: Users,
      color: "text-[#0071E3] bg-[#0071E3]/5 border-[#0071E3]/10"
    },
    {
      id: "stat-materials",
      title: "Material Master",
      value: totalMaterials.toString(),
      sub: "Configured grades",
      icon: Award,
      color: "text-[#34C759] bg-[#34C759]/5 border-[#34C759]/10"
    },
    {
      id: "stat-estimates",
      title: "Estimates Generated",
      value: totalEstimates.toString(),
      sub: "Total quotients",
      icon: Layout,
      color: "text-[#BF5AF2] bg-[#BF5AF2]/5 border-[#BF5AF2]/10"
    },
    {
      id: "stat-revenue",
      title: "Estimated Revenue",
      value: formatCurrency(totalRevenue),
      sub: "Total valuation",
      icon: DollarSign,
      color: "text-[#FF9500] bg-[#FF9500]/5 border-[#FF9500]/10"
    }
  ];

  return (
    <div className="space-y-8" id="dashboard-view">
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]" id="dashboard-title">Dashboard</h1>
          <p className="text-sm text-[#6E6E73] mt-1 font-medium">Your business summary and recent activities</p>
        </div>
        <div className="text-xs text-[#86868B] font-mono bg-white px-4 py-2 rounded-full border border-[#D2D2D7]/50 shadow-[0_1px_4px_rgba(0,0,0,0.01)]" id="dashboard-time">
          System Live • Local Time: 2026-06-30
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-grid">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-between"
              id={stat.id}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-[#86868B]">{stat.title}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{stat.value}</h3>
                <span className="text-xs font-semibold text-[#6E6E73] mt-1 block">{stat.sub}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Estimates Column */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 lg:col-span-2 flex flex-col"
          id="recent-estimates-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Recent Estimates</h2>
              <p className="text-xs text-[#6E6E73] font-medium mt-0.5">Quick lookup of latest proposals</p>
            </div>
            <button
              onClick={() => onNavigate("history")}
              className="text-xs font-semibold text-[#0071E3] hover:text-[#0077ED] flex items-center gap-1 cursor-pointer transition-colors"
              id="view-all-history-btn"
            >
              View all history <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto grow -mx-6">
            <table className="w-full text-left border-collapse" id="recent-estimates-table">
              <thead>
                <tr className="border-b border-[#F5F5F7] text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                  <th className="py-3 px-6">ID</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Layout</th>
                  <th className="py-3 px-6">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F7]">
                {recentEstimates.length > 0 ? (
                  recentEstimates.map((est) => (
                    <tr key={est.estimate_id} className="hover:bg-[#F5F5F7]/40 transition-colors text-sm font-medium text-[#1D1D1F]">
                      <td className="py-3 px-6 font-mono text-xs text-[#6E6E73]">#EST-{est.estimate_id}</td>
                      <td className="py-3 px-6">{est.customer_name}</td>
                      <td className="py-3 px-6">
                        <span className="bg-[#F5F5F7] px-2.5 py-1 rounded-full text-xs text-[#6E6E73] border border-[#D2D2D7]/30">
                          {est.layout_type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-[#0071E3] font-bold">{formatCurrency(est.total_cost)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[#86868B] text-sm">
                      No estimates generated yet. Click "New Estimate" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions Column */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white rounded-3xl border border-[#D2D2D7]/60 shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-between"
          id="quick-actions-card"
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F] mb-1">Quick Actions</h2>
            <p className="text-xs text-[#6E6E73] font-medium mb-6">Common workflow shortcuts</p>
            
            <div className="space-y-4">
              <button
                onClick={() => onNavigate("estimate")}
                className="w-full p-4 bg-[#F5F5F7] hover:bg-[#E8E8ED]/80 rounded-2xl flex items-center gap-4 transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-[#D2D2D7]/40"
                id="qa-new-estimate"
              >
                <div className="w-10 h-10 bg-[#0071E3] rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_2px_8px_rgba(0,113,227,0.15)]">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1D1D1F]">New Estimate Studio</h4>
                  <p className="text-xs text-[#6E6E73] mt-0.5 font-medium">Interactive calculator & previews</p>
                </div>
              </button>

              <button
                onClick={() => onNavigate("customers")}
                className="w-full p-4 bg-[#F5F5F7] hover:bg-[#E8E8ED]/80 rounded-2xl flex items-center gap-4 transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-[#D2D2D7]/40"
                id="qa-add-customer"
              >
                <div className="w-10 h-10 bg-[#34C759] rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_2px_8px_rgba(52,199,89,0.15)]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1D1D1F]">Manage Customers</h4>
                  <p className="text-xs text-[#6E6E73] mt-0.5 font-medium">Add, edit and search customers</p>
                </div>
              </button>

              <button
                onClick={() => onNavigate("materials")}
                className="w-full p-4 bg-[#F5F5F7] hover:bg-[#E8E8ED]/80 rounded-2xl flex items-center gap-4 transition-all duration-200 cursor-pointer text-left border border-transparent hover:border-[#D2D2D7]/40"
                id="qa-manage-materials"
              >
                <div className="w-10 h-10 bg-[#FF9500] rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_2px_8px_rgba(255,149,0,0.15)]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1D1D1F]">Material Master</h4>
                  <p className="text-xs text-[#6E6E73] mt-0.5 font-medium">Modify rates per square foot</p>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#F5F5F7] text-center">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-widest">
              KitchenCraft Smart Engine
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
