'use client';

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SecurityUserRecord } from "@/app/lib/admin-panels";
import DataSearchInput from "@/app/ui/data-search-input";

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function getRoleStyle(role: string) {
  if (role === "SYS-ADMIN") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (role === "FLEET-MANAGER") return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  if (role === "STANDARD") return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

function getStatusStyle(status: string) {
  if (status === "Active") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status === "Inactive") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

interface WorkspaceProps {
  initialUsers: SecurityUserRecord[];
}

export default function UserManagementWorkspace({ initialUsers }: WorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<SecurityUserRecord[]>(initialUsers);
  
  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // User Pagination State
  const [userPage, setUserPage] = useState(0);
  const ITEMS_PER_PAGE = 5;
  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const displayedUsers = filteredUsers.slice(userPage * ITEMS_PER_PAGE, (userPage + 1) * ITEMS_PER_PAGE);

  // Handler sinkronisasi Live Search ke URL browser
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setUserPage(0); // Reset to first page when searching
  };

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "Active").length,
    admins: users.filter(u => u.role === "SYS-ADMIN").length,
    managers: users.filter(u => u.role === "FLEET-MANAGER").length,
  };

  return (
    <main className="mx-auto max-w-[1360px] px-6 py-8 pb-28">
      {/* Header dengan styling yang diupdate tapi struktur tetap sama */}
      <header className="mb-10">
        <p className="font-mono text-[10px] tracking-[0.2em] text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-block">
          🔐 User Management Portal
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200 italic">
          USER DIRECTORY & ACCESS CONTROL
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl font-medium">
          Kelola direktori pengguna sistem, atur tingkat akses, dan pantau aktivitas user secara real-time.
        </p>
      </header>

        {/* Summary Cards Grid - styling konsisten dengan cargo management */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "TOTAL USERS", value: stats.total, color: "from-cyan-500/10 to-slate-950/60", border: "border-cyan-500/20", glow: "text-cyan-400", icon: "👥" },
            { label: "ACTIVE USERS", value: stats.active, color: "from-emerald-500/10 to-slate-950/60", border: "border-emerald-500/20", glow: "text-emerald-400", icon: "✅" },
            { label: "ADMINISTRATORS", value: stats.admins, color: "from-red-500/10 to-slate-950/60", border: "border-red-500/20", glow: "text-red-400", icon: "🔑" },
            { label: "FLEET MANAGERS", value: stats.managers, color: "from-purple-500/10 to-slate-950/60", border: "border-purple-500/20", glow: "text-purple-400", icon: "🚢" },
          ].map((card, i) => (
            <div key={i} className={`relative bg-gradient-to-br ${card.color} border ${card.border} p-5 rounded-2xl shadow-xl backdrop-blur-md hover:scale-[1.02] transition-transform duration-300 overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.color} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="text-base">{card.icon}</span>
                {card.label}
              </span>
              <span className={`block text-2xl sm:text-3xl font-black mt-3 tracking-tighter ${card.glow} drop-shadow-[0_0_10px_currentColor]`}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Personnel Directory */}
        <div className="bg-gradient-to-br from-purple-900/20 via-slate-900/40 to-slate-950/80 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.1)] overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-purple-400 uppercase font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-flex items-center gap-2">
                👥 Personnel Directory ({filteredUsers.length} Users)
              </span>
              <h2 className="text-lg font-bold text-white mt-2 tracking-tight">User Database & Access Control</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">LIVE</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <DataSearchInput 
              ariaLabel="Cari user" 
              placeholder="Cari User ID, Nama, Role, atau Access Key..." 
              value={searchQuery} 
              onChange={handleSearchChange} 
            />
          </div>

          {/* Users Table */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-lg overflow-hidden">
            <div className="border-b border-white/5 px-4 py-3">
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "#22d3ee", letterSpacing: "0.1em" }}>USER DIRECTORY</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>USER ID</th>
                    <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>NAMA</th>
                    <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>ROLE</th>
                    <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>ACCESS KEY</th>
                    <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>STATUS</th>
                    <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>AVATAR</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.length > 0 ? displayedUsers.map((user, idx) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }} className="hover:bg-purple-500/5 transition-colors">
                      <td style={{ textAlign: "left", padding: "18px 12px" }}>
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 600, color: "#22d3ee", letterSpacing: "0.04em" }}>{user.id}</span>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <span style={{ fontSize: 12, color: "#d1d5db", fontWeight: 500 }}>{user.name}</span>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <span className={`inline-block px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${getRoleStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#e5e7eb" }}>{user.key}</span>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <span className={`inline-block px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${getStatusStyle(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full text-white font-bold text-sm">
                          {user.avatar}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ color: "#4b5563", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.12em", padding: "32px 10px", textAlign: "center" }}>
                        {searchQuery ? "🔍 Tidak ditemukan user yang sesuai dengan pencarian" : "⚠️ Tidak ada data user"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Dots */}
          {totalUserPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              {Array.from({ length: totalUserPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setUserPage(idx)}
                  style={{
                    width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", transition: "all 0.3s ease",
                    background: userPage === idx ? "#a855f7" : "#4b5563",
                    boxShadow: userPage === idx ? "0 0 12px rgba(168,85,247,0.6)" : "none",
                    transform: userPage === idx ? "scale(1.2)" : "scale(1)"
                  }}
                  onMouseEnter={e => { if (userPage !== idx) e.currentTarget.style.background = "#6b7280"; }}
                  onMouseLeave={e => { if (userPage !== idx) e.currentTarget.style.background = "#4b5563"; }}
                  aria-label={`Page ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
    </main>
  );
}