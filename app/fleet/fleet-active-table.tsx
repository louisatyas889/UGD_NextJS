'use client';

import { useDeferredValue, useEffect, useState, useMemo } from "react";
import { filterItemsByQuery, paginateItems } from "../lib/data-controls";
import DataPaginationBar from "../ui/data-pagination-bar";
import DataSearchInput from "../ui/data-search-input";

function MonIcon({ t, color }: { t: string; color?: string }) {
  if (t === "chart") return <svg fill="none" height="16" stroke={color || "#22d3ee"} strokeWidth="2" viewBox="0 0 24 24" width="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
  if (t === "anchor") return <svg fill="none" height="16" stroke={color || "#a855f7"} strokeWidth="2" viewBox="0 0 24 24" width="16"><circle cx="12" cy="5" r="3" /><line x1="12" x2="12" y1="8" y2="22" /><path d="M5 12H2a10 10 0 0 0 20 0h-3" /></svg>;
  if (t === "warn") return <svg fill="none" height="16" stroke={color || "#f59e0b"} strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>;
  // Fallback / Tool / Obeng (Wrench)
  return <svg fill="none" height="16" stroke={color || "#f472b6"} strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
}

interface FleetActiveTableProps {
  dbVessels: Array<{ id: string; dest: string; status: string; st: string; eta: string; mon: string }>;
  onOpenCreate: () => void;
  onOpenEdit: (vessel: any) => void;
  onDelete: (id: string) => void;
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes("en route") || s.includes("underway")) return { color: "#22d3ee", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.25)" };
  if (s.includes("delay")) return { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" };
  if (s.includes("maintenance")) return { color: "#f472b6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.25)" };
  if (s.includes("port") || s.includes("docked")) return { color: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.25)" };
  return { color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.25)" };
}

export default function FleetActiveTable({ dbVessels, onOpenCreate, onOpenEdit, onDelete }: FleetActiveTableProps) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => { setCurrentPage(1); }, [deferredQuery]);

  const filteredVessels = filterItemsByQuery(dbVessels, deferredQuery, [
    (vessel) => vessel.id, (vessel) => vessel.dest, (vessel) => vessel.status,
  ]);

  const paginatedVessels = paginateItems(filteredVessels, currentPage, 5);

  const stats = useMemo(() => {
    const enRoute = dbVessels.filter(v => v.status.toLowerCase().includes("en route") || v.status.toLowerCase().includes("underway")).length;
    const delayed = dbVessels.filter(v => v.status.toLowerCase().includes("delay")).length;
    const inPort = dbVessels.filter(v => v.status.toLowerCase().includes("port") || v.status.toLowerCase().includes("docked")).length;
    return { total: dbVessels.length, enRoute, delayed, inPort };
  }, [dbVessels]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;700;900&display=swap');
        .fleet-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
        .fleet-stat-card { border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); padding: 14px 16px; background: linear-gradient(180deg, rgba(15,15,26,0.95), rgba(8,8,15,0.95)); }
        .fleet-stat-label { font-family: 'Share Tech Mono', monospace; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 8px; }
        .fleet-stat-value { font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 700; }
        .v-row { transition: all 0.15s ease; }
        .v-row:hover { background: rgba(168,85,247,0.06) !important; }
        @media (max-width: 900px) { .fleet-stats-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="fleet-stats-grid">
        {[
          { label: "Total Armada", value: stats.total, color: "#e5e7eb" },
          { label: "Berlayar", value: stats.enRoute, color: "#22d3ee" },
          { label: "Terlambat", value: stats.delayed, color: "#f87171" },
          { label: "Berlabuh", value: stats.inPort, color: "#a855f7" },
        ].map((stat) => (
          <div key={stat.label} className="fleet-stat-card">
            <div className="fleet-stat-label" style={{ color: stat.color }}>{stat.label}</div>
            <div className="fleet-stat-value" style={{ color: stat.color, textShadow: `0 0 12px ${stat.color}44` }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="panel-v2">
        <div className="panel-label" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "#22d3ee" }}>ARMADA AKTIF</div>
        <div className="table-header-ctrl" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <DataSearchInput ariaLabel="Search vessel records" onChange={setQuery} placeholder="Cari vessel, tujuan, atau status..." value={query} />
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <button onClick={onOpenCreate} style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", letterSpacing: "0.08em", transition: "all 0.2s",
            }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,211,238,0.2)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(34,211,238,0.15)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,211,238,0.1)"; e.currentTarget.style.boxShadow = "none"; }}>
              [+] REGISTER VESSEL
            </button>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#22d3ee", border: "1px solid rgba(34,211,238,0.2)", padding: "3px 10px", borderRadius: 20 }}>LIVE</span>
          </div>
        </div>

        <div className="table-wrap">
          <div style={{ maxHeight: "500px", overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left", fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>ID KAPAL</th>
                <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>TUJUAN</th>
                <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>STATUS</th>
                <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>ETA</th>
                <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>MON</th>
                <th style={{ textAlign: "right", fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#4b5563", letterSpacing: "0.16em", padding: "14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVessels.items.length === 0 ? (
                <tr><td colSpan={6} style={{ color: "#4b5563", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.12em", padding: "32px 10px", textAlign: "center" }}>TIDAK ADA VESSEL DITEMUKAN</td></tr>
              ) : (
                paginatedVessels.items.map((vessel) => {
                  const sc = getStatusColor(vessel.status);
                  const upperStatus = (vessel.status || "").toUpperCase();

                  // Penentuan tipe logo dinamis sesuai status kapal
                  let iconType = vessel.mon || "chart";
                  if (upperStatus === "MAINTENANCE") {
                    iconType = "tool";
                  } else if (upperStatus === "HOME PORT" || upperStatus === "IN PORT") {
                    iconType = "anchor";
                  }

                  return (
                    <tr className="v-row" key={vessel.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ textAlign: "left", padding: "18px 12px" }}>
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 600, color: "#22d3ee", letterSpacing: "0.04em" }}>{vessel.id}</span>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <span style={{ fontSize: 12, color: "#d1d5db" }}>{vessel.dest}</span>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, padding: "5px 12px", borderRadius: 20, letterSpacing: "0.1em",
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          boxShadow: `0 0 10px ${sc.color}22`,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.color, boxShadow: `0 0 6px ${sc.color}` }} />{vessel.status}
                        </span>
                      </td>
                      <td style={{ padding: "18px 12px" }}>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: vessel.eta === "--" ? "#f87171" : "#e5e7eb" }}>{vessel.eta}</span>
                      </td>
                      <td style={{ padding: "18px 12px" }}><MonIcon t={iconType} color={sc.color} /></td>
                      <td style={{ textAlign: "right", padding: "18px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button onClick={() => onOpenEdit(vessel)} style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", padding: "5px 10px", cursor: "pointer", borderRadius: "5px", letterSpacing: "0.08em", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,85,247,0.2)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(168,85,247,0.1)"; }}>EDIT</button>
                          <button onClick={() => onDelete(vessel.id)} style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", padding: "5px 10px", cursor: "pointer", borderRadius: "5px", letterSpacing: "0.08em", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.18)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}>DEL</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>

          <DataPaginationBar accentColor="#22d3ee" currentPage={paginatedVessels.currentPage} itemLabel="vessels" mutedColor="#4b5563" onPageChange={setCurrentPage} totalItems={paginatedVessels.totalItems} totalPages={paginatedVessels.totalPages} visibleEnd={paginatedVessels.endIndex} visibleStart={paginatedVessels.totalItems === 0 ? 0 : paginatedVessels.startIndex + 1} />
        </div>
      </div>
    </>
  );
}
