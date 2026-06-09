"use client";

import { useEffect, useMemo, useState } from "react";
import { Orbitron, Rajdhani } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Tipe data hasil API /api/vessel-deployment
export interface DeploymentPackage {
  trackingNumber: string;
  senderName: string;
  recipientName: string;
  originCountry: string;
  destinationCountry: string;
  itemName: string;
  itemType: string;
  weightKg: number;
  shippingPrice: number;
  status: string;
}

export interface DeploymentCrew {
  id: string;
  name: string;
  jobTitle: string;
  workShift: string;
  startHour: number;
  endHour: number;
}

export interface DeploymentVessel {
  id: string;
  destination: string;
  status: string;
  statusColor: string;
  eta: string;
  monitoringIcon: string;
  region: string;
  currentLat: number | null;
  currentLng: number | null;
  packages: DeploymentPackage[];
  crew: DeploymentCrew[];
  visitedCountries: string[];
  packageCount: number;
  crewCount: number;
}

// Style status kapal (sinkron dengan STATUS_MAP fleet-page-client)
const statusStyleMap: Record<string, { border: string; text: string; bg: string; label: string }> = {
  "EN ROUTE":   { border: "rgba(34,211,238,0.3)",  text: "#22d3ee", bg: "rgba(34,211,238,0.08)",  label: "EN ROUTE" },
  "DELAYED":    { border: "rgba(248,113,113,0.3)", text: "#f87171", bg: "rgba(248,113,113,0.08)", label: "DELAYED" },
  "IN PORT":    { border: "rgba(168,85,247,0.3)",  text: "#a855f7", bg: "rgba(168,85,247,0.08)",  label: "IN PORT" },
  "MAINTENANCE":{ border: "rgba(168,85,247,0.3)",  text: "#a855f7", bg: "rgba(168,85,247,0.08)",  label: "MAINTENANCE" },
  "HOME PORT":  { border: "rgba(255,255,255,0.3)", text: "#ffffff", bg: "rgba(255,255,255,0.05)", label: "HOME PORT" },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyleMap[status] ?? statusStyleMap["EN ROUTE"];
  return (
    <span
      className={cn(orbitron.className, "inline-flex rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.18em]")}
      style={{ borderColor: s.border, color: s.text, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function ShiftBadge({ shift }: { shift: string }) {
  const colors: Record<string, string> = {
    MORNING: "#fbbf24",
    SWING: "#22d3ee",
    NIGHT: "#8b5cf6",
  };
  const c = colors[shift] ?? "#94a3b8";
  return (
    <span
      className={cn(orbitron.className, "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] tracking-[0.12em]")}
      style={{ borderColor: `${c}40`, color: c, background: `${c}15` }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
      {shift}
    </span>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export interface DeploymentMeta {
  totalVessels: number;
  totalCargoRecords: number;
  totalCrewRecords: number;
  unassignedPackages: number;
  unassignedCrew: number;
  generatedAt: string;
}

export default function DeploymentWorkspace() {
  const [vessels, setVessels] = useState<DeploymentVessel[]>([]);
  const [meta, setMeta] = useState<DeploymentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch("/api/vessel-deployment?ts=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      console.log("[DeploymentWorkspace] API response:", json);
      if (json?.success && Array.isArray(json.vessels)) {
        setVessels(json.vessels);
        if (json.meta) setMeta(json.meta);
      } else {
        console.warn("[DeploymentWorkspace] API returned no vessels:", json?.error);
      }
    } catch (err) {
      console.error("[DeploymentWorkspace] fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Polling setiap 5 detik agar sinkron real-time dengan perubahan di Cargo Admin / Employee / Fleet
    const id = setInterval(() => fetchData(), 5000);
    return () => clearInterval(id);
  }, []);

  // Filter & search
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return vessels.filter((v) => {
      if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
      if (!q) return true;
      // search by id, destination, region, country, crew name, package item
      if (v.id.toLowerCase().includes(q)) return true;
      if (v.destination.toLowerCase().includes(q)) return true;
      if ((v.region || "").toLowerCase().includes(q)) return true;
      if (v.visitedCountries.some((c) => c.toLowerCase().includes(q))) return true;
      if (v.crew.some((c) => c.name.toLowerCase().includes(q) || c.jobTitle.toLowerCase().includes(q))) return true;
      if (v.packages.some((p) => p.itemName.toLowerCase().includes(q) || p.trackingNumber.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [vessels, search, statusFilter]);

  // Statistik ringkasan
  const stats = useMemo(() => {
    const total = vessels.length;
    const totalCrew = vessels.reduce((acc, v) => acc + v.crewCount, 0);
    const totalPackages = vessels.reduce((acc, v) => acc + v.packageCount, 0);
    const inTransit = vessels.filter((v) => v.status === "EN ROUTE").length;
    return { total, totalCrew, totalPackages, inTransit };
  }, [vessels]);

  return (
    <div className={cn(rajdhani.className, "min-h-[calc(100vh-46px)] bg-[#0a0a10] text-white")}>
      {/* Latar dekoratif */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(34,211,238,0.08), transparent 24%), radial-gradient(circle at top right, rgba(168,85,247,0.10), transparent 22%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-5 border-b border-white/6 pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className={cn(orbitron.className, "text-[10px] uppercase tracking-[0.34em] text-fuchsia-300/80")}>
              Deployment Console
            </p>
            <h1 className={cn(orbitron.className, "mt-3 text-3xl font-semibold tracking-[0.08em] text-white sm:text-4xl")}>
              Vessel Deployment
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-400 sm:text-lg">
              Detail lengkap setiap kapal: identitas, lokasi terkini, negara kunjungan, paket kargo, dan kru yang bertugas — sinkron dengan modul Cargo Admin dan Employee Management.
            </p>
          </div>
          <div className="flex flex-col gap-2 xl:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(orbitron.className, "rounded-[4px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-emerald-300")}>
                ● LIVE SYNC
              </span>
              <span className={cn(orbitron.className, "rounded-[4px] border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-300")}>
                5s POLLING
              </span>
            </div>
            {meta?.generatedAt && (
              <span className={cn(orbitron.className, "text-[9px] uppercase tracking-[0.2em] text-slate-500")}>
                Last sync: {new Date(meta.generatedAt).toLocaleTimeString("id-ID")}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className={cn(
                orbitron.className,
                "rounded-[4px] border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
              )}
            >
              {isRefreshing ? "⟳ SYNCING..." : "⟳ FORCE REFRESH"}
            </button>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "TOTAL FLEET", value: stats.total, color: "#a855f7" },
            { label: "EN ROUTE", value: stats.inTransit, color: "#22d3ee" },
            { label: "ACTIVE CREW", value: stats.totalCrew, color: "#fbbf24" },
            { label: "CARGO PACKAGES", value: stats.totalPackages, color: "#10b981" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/8 bg-[#0f0f1a] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.34)]">
              <p className={cn(orbitron.className, "text-[9px] uppercase tracking-[0.28em] text-slate-500")}>{s.label}</p>
              <p className={cn(orbitron.className, "mt-3 text-3xl font-semibold")} style={{ color: s.color, textShadow: `0 0 12px ${s.color}40` }}>
                {s.value}
              </p>
            </div>
          ))}
        </section>

        {/* Search + filter */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/8 bg-[#0f0f1a] px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID kapal, negara, kru, atau paket..."
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(orbitron.className, "rounded-2xl border border-white/8 bg-[#0f0f1a] px-4 py-3 text-xs uppercase tracking-[0.15em] text-slate-200 outline-none")}
          >
            {["ALL", "EN ROUTE", "DELAYED", "IN PORT", "MAINTENANCE", "HOME PORT"].map((s) => (
              <option key={s} value={s} className="bg-[#0f0f1a]">
                {s === "ALL" ? "All Status" : s}
              </option>
            ))}
          </select>
        </section>

        {/* VESSEL GRID */}
        {loading ? (
          <div className="rounded-2xl border border-white/8 bg-[#0f0f1a] p-12 text-center text-slate-500">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
            <p className={cn(orbitron.className, "mt-4 text-[10px] uppercase tracking-[0.3em]")}>Synchronizing deployment data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-[#0f0f1a] p-12 text-center text-slate-500">
            <p className={cn(orbitron.className, "text-[10px] uppercase tracking-[0.3em]")}>
              {vessels.length === 0 ? "No vessels found in database" : "No vessels match the current filter"}
            </p>
          </div>
        ) : (
          <section className="grid gap-4 xl:grid-cols-2">
            {filtered.map((v) => {
              const isExpanded = expandedId === v.id;
              const accent = v.statusColor || statusStyleMap[v.status]?.text || "#22d3ee";
              return (
                <div
                  key={v.id}
                  className="overflow-hidden rounded-2xl border border-white/8 bg-[#0f0f1a] shadow-[0_18px_40px_rgba(0,0,0,0.34)] transition hover:border-white/20"
                  style={{ borderLeft: `3px solid ${accent}` }}
                >
                  {/* VESSEL HEADER */}
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className={cn(orbitron.className, "text-[9px] uppercase tracking-[0.3em] text-slate-500")}>
                          Vessel Identifier
                        </p>
                        <h3 className={cn(orbitron.className, "mt-1 text-xl font-semibold text-white")}>
                          {v.id}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          ⚓ {v.destination} <span className="text-slate-600">·</span> {v.region}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={v.status} />
                        {v.eta && v.eta !== "--" && (
                          <span className={cn(orbitron.className, "text-[9px] uppercase tracking-[0.2em] text-slate-500")}>
                            ETA · {v.eta}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* LOCATION */}
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                        <p className={cn(orbitron.className, "text-[8px] uppercase tracking-[0.2em] text-slate-500")}>Lokasi Kapal</p>
                        <p className="mt-1 text-sm font-semibold text-white">{v.region}</p>
                        {v.currentLat !== null && v.currentLng !== null && (
                          <p className="mt-0.5 text-[10px] text-slate-500 font-mono">
                            {v.currentLat.toFixed(2)}°, {v.currentLng.toFixed(2)}°
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                        <p className={cn(orbitron.className, "text-[8px] uppercase tracking-[0.2em] text-slate-500")}>Negara Kunjungan</p>
                        <p className="mt-1 text-sm font-semibold text-cyan-200">
                          {v.visitedCountries.length > 0 ? `${v.visitedCountries.length} negara` : "—"}
                        </p>
                        {v.visitedCountries.length > 0 && (
                          <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                            {v.visitedCountries.slice(0, 2).join(", ")}{v.visitedCountries.length > 2 ? "..." : ""}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                        <p className={cn(orbitron.className, "text-[8px] uppercase tracking-[0.2em] text-slate-500")}>Kru Aktif</p>
                        <p className="mt-1 text-sm font-semibold text-amber-300">{v.crewCount} orang</p>
                      </div>
                    </div>

                    {/* EXPAND TOGGLE */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      className={cn(
                        orbitron.className,
                        "mt-5 w-full rounded-xl border px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] transition",
                        isExpanded
                          ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
                          : "border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]"
                      )}
                    >
                      {isExpanded ? "▾ TUTUP DETAIL" : "▸ LIHAT DETAIL (PAKET & KRU)"}
                    </button>
                  </div>

                  {/* EXPANDED DETAIL */}
                  {isExpanded && (
                    <div className="border-t border-white/5 bg-black/20 p-5 sm:p-6 space-y-5">
                      {/* VISITED COUNTRIES */}
                      {v.visitedCountries.length > 0 && (
                        <div>
                          <p className={cn(orbitron.className, "mb-2 text-[9px] uppercase tracking-[0.25em] text-fuchsia-300/80")}>
                            🌍 Negara yang Dikunjungi
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {v.visitedCountries.map((c) => (
                              <span
                                key={c}
                                className={cn(orbitron.className, "rounded-full border border-cyan-400/20 bg-cyan-500/5 px-3 py-1 text-[9px] uppercase tracking-[0.1em] text-cyan-200")}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PACKAGES */}
                      <div>
                        <p className={cn(orbitron.className, "mb-2 text-[9px] uppercase tracking-[0.25em] text-emerald-300/80")}>
                          📦 Paket yang Dibawa ({v.packageCount})
                        </p>
                        {v.packages.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Belum ada paket dialokasikan ke kapal ini.</p>
                        ) : (
                          <div className="space-y-2">
                            {v.packages.map((p) => (
                              <div
                                key={p.trackingNumber}
                                className="rounded-xl border border-emerald-400/10 bg-emerald-500/[0.03] p-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className={cn(orbitron.className, "text-[10px] text-emerald-200")}>{p.trackingNumber}</p>
                                    <p className="mt-0.5 text-sm font-semibold text-white">{p.itemName}</p>
                                    <p className="text-[11px] text-slate-400">{p.itemType} · {p.weightKg} Kg</p>
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-mono">{formatCurrency(p.shippingPrice)}</span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
                                  <span>📍 <span className="text-slate-200">{p.originCountry}</span></span>
                                  <span>→</span>
                                  <span><span className="text-slate-200">{p.destinationCountry}</span></span>
                                </div>
                                <p className="mt-1 text-[10px] text-slate-500">
                                  Pengirim: <span className="text-slate-300">{p.senderName}</span> · Penerima: <span className="text-slate-300">{p.recipientName}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CREW */}
                      <div>
                        <p className={cn(orbitron.className, "mb-2 text-[9px] uppercase tracking-[0.25em] text-amber-300/80")}>
                          👥 Anggota Kru ({v.crewCount})
                        </p>
                        {v.crew.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Belum ada kru ditugaskan ke kapal ini.</p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {v.crew.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between gap-2 rounded-xl border border-amber-400/10 bg-amber-500/[0.03] p-3"
                              >
                                <div>
                                  <p className={cn(orbitron.className, "text-[9px] text-amber-200/80")}>{c.id}</p>
                                  <p className="text-sm font-semibold text-white">{c.name}</p>
                                  <p className="text-[10px] text-slate-400">{c.jobTitle}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <ShiftBadge shift={c.workShift} />
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {String(c.startHour).padStart(2, "0")}:00 – {String(c.endHour).padStart(2, "0")}:00
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* DIAGNOSTICS PANEL: tampil jika ada unassigned records, untuk membantu user debug */}
        {meta && (meta.unassignedPackages > 0 || meta.unassignedCrew > 0) && (
          <section className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.03] p-4">
            <p className={cn(orbitron.className, "text-[9px] uppercase tracking-[0.25em] text-amber-300")}>
              ⚠️ Data Diagnostics — Beberapa record belum terasosiasi dengan kapal
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs text-slate-300">
              {meta.unassignedPackages > 0 && (
                <div>
                  📦 {meta.unassignedPackages} paket kargo belum punya <code className="text-cyan-300">vehicle_code</code> yang cocok dengan ID kapal manapun. Buka{" "}
                  <a href="/admin/cargo-management" className="text-cyan-300 underline">Cargo Admin</a> dan pilih kapal di menu sortir.
                </div>
              )}
              {meta.unassignedCrew > 0 && (
                <div>
                  👥 {meta.unassignedCrew} kru belum di-<code className="text-cyan-300">assign</code> ke kapal. Buka{" "}
                  <a href="/admin/user-management" className="text-cyan-300 underline">Employee Management</a> dan pilih kapal di field "Assigned Vessel".
                </div>
              )}
            </div>
          </section>
        )}

        {/* FOOTER NOTE */}
        <footer className="border-t border-white/6 pt-5 text-center text-[10px] text-slate-500">
          <p className={cn(orbitron.className, "uppercase tracking-[0.25em]")}>
            Data sinkron otomatis dengan modul Cargo Admin, Employee Management, dan Fleet setiap 5 detik.
          </p>
          {meta && (
            <p className="mt-2 text-slate-600 normal-case tracking-normal">
              DB Stats: {meta.totalVessels} kapal · {meta.totalCargoRecords} manifest kargo · {meta.totalCrewRecords} kru
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
