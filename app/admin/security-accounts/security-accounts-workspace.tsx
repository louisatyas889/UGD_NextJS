"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import DataPaginationBar from "@/app/ui/data-pagination-bar";
import DataSearchInput from "@/app/ui/data-search-input";
import { deleteSecurityLogAction, deleteSecurityUserAction } from "@/app/admin/panel-actions";
import type { SecurityLogRecord, SecurityUserRecord } from "@/app/lib/admin-panels";

type Props = {
  logs: SecurityLogRecord[];
  users: SecurityUserRecord[];
};

// Tipe UI untuk user yang diperkaya dengan info login/logout terakhir
type EnrichedUser = SecurityUserRecord & {
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  isOnline: boolean;
};

// Hitung "isOnline" heuristic: logout null ATAU last_login_at > last_logout_at
function enrichUsers(users: SecurityUserRecord[], logs: SecurityLogRecord[]): EnrichedUser[] {
  // Cari login/logout terakhir per user dari logs
  const lastLogin = new Map<string, string>();
  const lastLogout = new Map<string, string>();
  for (const log of logs) {
    if (log.message.includes("Login berhasil") || log.message.includes("Login failed")) {
      const prev = lastLogin.get(log.actor);
      if (!prev || log.createdAt > prev) lastLogin.set(log.actor, log.createdAt);
    }
    if (log.message.startsWith("↪ Logout")) {
      const prev = lastLogout.get(log.actor);
      if (!prev || log.createdAt > prev) lastLogout.set(log.actor, log.createdAt);
    }
  }
  return users.map((u) => {
    const li = lastLogin.get(u.id) ?? null;
    const lo = lastLogout.get(u.id) ?? null;
    // Online jika logout lebih lama dari login
    const isOnline = li !== null && (lo === null || li > lo);
    return { ...u, lastLoginAt: li, lastLogoutAt: lo, isOnline };
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function roleBadgeStyle(role: string) {
  const r = role.toUpperCase();
  if (r === "ADMIN" || r === "SUPERADMIN") {
    return { bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.4)", text: "#a855f7" };
  }
  if (r === "STANDARD" || r === "USER") {
    return { bg: "rgba(34,211,238,0.15)", border: "rgba(34,211,238,0.4)", text: "#22d3ee" };
  }
  return { bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.4)", text: "#9ca3af" };
}

export default function SecurityAccountsWorkspace({ logs, users }: Props) {
  const router = useRouter();
  const [liveLogs, setLiveLogs] = useState<SecurityLogRecord[]>(logs);
  const [liveUsers, setLiveUsers] = useState<SecurityUserRecord[]>(users);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Modal change password
  const [pwTarget, setPwTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  // Fetch ulang logs+users berkala
  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/security-live?ts=" + Date.now(), { cache: "no-store" });
      const json = await res.json();
      if (json?.success) {
        if (Array.isArray(json.logs)) setLiveLogs(json.logs);
        if (Array.isArray(json.users)) setLiveUsers(json.users);
        setLastSync(new Date());
      }
    } catch (err) {
      console.error("[SecurityAccounts] live fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 5000); // polling 5 detik
    return () => clearInterval(id);
  }, [fetchLive]);

  const enrichedUsers = useMemo(() => enrichUsers(liveUsers, liveLogs), [liveUsers, liveLogs]);
  const onlineCount = enrichedUsers.filter((u) => u.isOnline).length;
  const totalUsers = enrichedUsers.length;

  // Filter logs
  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return liveLogs;
    return liveLogs.filter((log) =>
      [log.time, log.actor, log.location, log.severity, log.message]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, liveLogs]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / 8));
  const safePage = Math.min(currentPage, totalPages);
  const visibleLogs = filteredLogs.slice((safePage - 1) * 8, (safePage - 1) * 8 + 8);

  // Filter users
  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return enrichedUsers;
    return enrichedUsers.filter((u) =>
      [u.id, u.name, u.role, u.status].join(" ").toLowerCase().includes(normalized),
    );
  }, [query, enrichedUsers]);

  async function handleDeleteLog(id: number) {
    if (!window.confirm(`Hapus log #${id}?`)) return;
    startTransition(async () => {
      const result = await deleteSecurityLogAction(id);
      setFeedback(result.message);
      if (result.success) {
        await fetchLive();
      }
    });
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm(`Hapus account ${id} dari database? Tindakan ini permanen.`)) return;
    startTransition(async () => {
      const result = await deleteSecurityUserAction(id);
      setFeedback(result.message);
      if (result.success) {
        await fetchLive();
        router.refresh();
      }
    });
  }

  async function handleChangePassword() {
    if (!pwTarget) return;
    if (newPassword.trim().length < 2) {
      setPwError("Password minimal 2 karakter.");
      return;
    }
    setPwLoading(true);
    setPwError("");
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: pwTarget.id, newKey: newPassword.trim() }),
      });
      const json = await res.json();
      if (json?.success) {
        setFeedback(`✓ Password ${pwTarget.name} (${pwTarget.id}) berhasil diubah.`);
        setPwTarget(null);
        setNewPassword("");
        await fetchLive();
        router.refresh();
      } else {
        setPwError(json?.error || "Gagal mengubah password.");
      }
    } catch (err: any) {
      setPwError(err?.message || "Terjadi kesalahan.");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <>
      {/* === STATS BAR === */}
      <div className="grid grid-cols-2 gap-3 px-6 pb-4 md:grid-cols-4">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Total Accounts</p>
          <p className="mt-2 font-mono text-2xl font-bold text-cyan-300">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.04] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Sedang Online</p>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-300 flex items-center gap-2">
            {onlineCount}
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          </p>
        </div>
        <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.04] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Total Events</p>
          <p className="mt-2 font-mono text-2xl font-bold text-violet-300">{liveLogs.length}</p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.04] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Last Sync</p>
          <p className="mt-2 font-mono text-xs text-amber-300">{lastSync.toLocaleTimeString("id-ID")}</p>
        </div>
      </div>

      <div className="layout-sec">
        {/* === KOLOM KIRI: LIVE SECURITY LOGS === */}
        <div className="panel" style={{ minHeight: "600px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {feedback ? (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              {feedback}
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: "12px", fontFamily: "Share Tech Mono", color: "#a855f7" }}>
                SECURITY EVENT MONITOR
              </h3>
              <p style={{ fontSize: "10px", color: "#6b7280", marginTop: 4 }}>
                Log otomatis dari sistem (login, logout, password change, dll)
              </p>
            </div>
            <span style={{ fontSize: "10px", color: "#22d3ee", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              LIVE DATABASE LOGS
            </span>
          </div>

          <DataSearchInput
            ariaLabel="Search security logs"
            onChange={(v) => { setQuery(v); setCurrentPage(1); }}
            placeholder="Search actor, location, severity, or message..."
            value={query}
          />

          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 150px", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "9px", color: "#6b7280", fontFamily: "Share Tech Mono", letterSpacing: "0.16em" }}>
            <span>TIME</span>
            <span>ACTIVITY</span>
            <span>LEVEL</span>
          </div>

          <div style={{ flex: 1, overflow: "hidden" }}>
            {visibleLogs.length === 0 ? (
              <div style={{ color: "#6b7280", fontFamily: "Share Tech Mono", fontSize: "10px", letterSpacing: "0.16em", padding: "24px 0" }}>
                NO SECURITY EVENTS MATCH THIS SEARCH.
              </div>
            ) : (
              visibleLogs.map((log) => (
                <div
                  key={log.id}
                  className="log-row"
                  style={{ display: "grid", gridTemplateColumns: "110px 1fr 150px", alignItems: "start" }}
                >
                  <span style={{ color: log.color, fontFamily: "Share Tech Mono", fontSize: "11px" }}>
                    [{log.time}]
                  </span>
                  <div>
                    <div style={{ color: "#e5e7eb", fontSize: "12px" }}>{log.message}</div>
                    <div style={{ color: "#6b7280", fontSize: "10px", marginTop: "6px", fontFamily: "Share Tech Mono" }}>
                      {log.actor} / {log.location}
                    </div>
                  </div>
                  <div style={{ justifySelf: "end", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span
                      style={{
                        color: log.color,
                        border: `1px solid ${log.color}`,
                        borderRadius: "999px",
                        padding: "4px 8px",
                        fontFamily: "Share Tech Mono",
                        fontSize: "9px",
                      }}
                    >
                      {log.severity}
                    </span>
                    <button
                      style={{ background: "transparent", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", padding: "4px 8px", cursor: "pointer" }}
                      onClick={() => handleDeleteLog(log.id)}
                      type="button"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DataPaginationBar
            accentColor="#22d3ee"
            currentPage={safePage}
            itemLabel="events"
            mutedColor="#6b7280"
            onPageChange={setCurrentPage}
            totalItems={filteredLogs.length}
            totalPages={totalPages}
            visibleEnd={Math.min((safePage - 1) * 8 + 8, filteredLogs.length)}
            visibleStart={filteredLogs.length === 0 ? 0 : (safePage - 1) * 8 + 1}
          />
        </div>

        {/* === KOLOM KANAN: ACCOUNT LIST + CHANGE PASSWORD === */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "14px", fontFamily: "Share Tech Mono" }}>USER ACCOUNTS</h3>
              <span style={{ fontSize: "10px", color: "#22d3ee" }}>{filteredUsers.length} of {totalUsers} accounts</span>
            </div>
            <p style={{ fontSize: "10px", color: "#6b7280", marginBottom: 14, lineHeight: 1.5 }}>
              Data dibaca dari tabel <code className="text-cyan-300">app_users</code> yang sama dengan database login.
              User Management digunakan untuk tambah/hapus akun.
            </p>

            <div style={{ display: "grid", gap: "10px", maxHeight: 480, overflowY: "auto" }}>
              {filteredUsers.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 10, fontFamily: "Share Tech Mono", padding: 20, textAlign: "center" }}>
                  Tidak ada user match pencarian.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const rbs = roleBadgeStyle(user.role);
                  return (
                    <div
                      key={user.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.07)",
                        background: "#0b0b12",
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{user.name}</span>
                            <span style={{
                              fontSize: 9, padding: "2px 7px", borderRadius: 4,
                              background: rbs.bg, border: `1px solid ${rbs.border}`, color: rbs.text,
                              fontFamily: "Share Tech Mono", letterSpacing: "0.1em",
                            }}>
                              {user.role}
                            </span>
                            {user.isOnline ? (
                              <span style={{
                                fontSize: 9, padding: "2px 7px", borderRadius: 4,
                                background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80",
                                fontFamily: "Share Tech Mono", letterSpacing: "0.1em",
                                display: "inline-flex", alignItems: "center", gap: 4,
                              }}>
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                ONLINE
                              </span>
                            ) : (
                              <span style={{
                                fontSize: 9, padding: "2px 7px", borderRadius: 4,
                                background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.3)", color: "#6b7280",
                                fontFamily: "Share Tech Mono", letterSpacing: "0.1em",
                              }}>
                                OFFLINE
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 6, fontFamily: "Share Tech Mono" }}>
                            {user.id} · {user.status}
                          </div>
                          <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4, fontFamily: "Share Tech Mono", lineHeight: 1.6 }}>
                            <div>↪ Login: {formatTime(user.lastLoginAt)}</div>
                            <div>↩ Logout: {formatTime(user.lastLogoutAt)}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <button
                          onClick={() => { setPwTarget({ id: user.id, name: user.name }); setNewPassword(""); setPwError(""); }}
                          style={{ flex: 1, background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.25)", padding: "6px 10px", cursor: "pointer", fontSize: 10, fontFamily: "Share Tech Mono", letterSpacing: "0.1em" }}
                          type="button"
                        >
                          🔑 UBAH PASSWORD
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleDeleteUser(user.id)}
                          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)", padding: "6px 10px", cursor: "pointer", fontSize: 10, fontFamily: "Share Tech Mono" }}
                          type="button"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Change Password */}
      {pwTarget && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={() => setPwTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f0f1a", border: "1px solid #22d3ee", borderRadius: 12,
              padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 0 40px rgba(34,211,238,0.2)",
            }}
          >
            <h3 style={{ fontFamily: "Share Tech Mono", fontSize: 14, color: "#22d3ee", marginBottom: 6, letterSpacing: "0.1em" }}>
              🔑 UBAH PASSWORD
            </h3>
            <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 18 }}>
              Anda akan mengubah password untuk user: <strong style={{ color: "#fff" }}>{pwTarget.name}</strong> ({pwTarget.id})
            </p>
            <label style={{ fontSize: 9, color: "#6b7280", fontFamily: "Share Tech Mono", letterSpacing: "0.15em" }}>
              PASSWORD BARU
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 2 karakter"
              style={{
                width: "100%", background: "#050508", border: "1px solid #333",
                color: "#fff", padding: "10px 12px", marginTop: 4, marginBottom: 8,
                fontFamily: "Share Tech Mono", fontSize: 13, outline: "none",
              }}
              autoFocus
            />
            {pwError && (
              <div style={{ color: "#f87171", fontSize: 11, marginBottom: 10, padding: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6 }}>
                {pwError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => setPwTarget(null)}
                style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontFamily: "Share Tech Mono", fontSize: 11 }}
                type="button"
              >
                BATAL
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                style={{ flex: 1, padding: "10px 12px", background: "linear-gradient(90deg,#22d3ee,#a855f7)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "Share Tech Mono", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", opacity: pwLoading ? 0.6 : 1 }}
                type="button"
              >
                {pwLoading ? "MENYIMPAN..." : "✓ KONFIRMASI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
