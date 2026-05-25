'use client';

import { useActionState, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { initialPanelActionState } from "@/app/admin/panel-action-state";
import {
  createSecurityLogAction,
  deleteSecurityLogAction,
  deleteSecurityUserAction,
  saveSecurityUserAction,
} from "@/app/admin/panel-actions";
import type { SecurityLogRecord, SecurityUserRecord } from "@/app/lib/admin-panels";
import DataPaginationBar from "@/app/ui/data-pagination-bar";
import DataSearchInput from "@/app/ui/data-search-input";

type Props = {
  logs: SecurityLogRecord[];
  users: SecurityUserRecord[];
};

type UserForm = {
  id: string;
  key: string;
  name: string;
  role: string;
  status: string;
  avatar: string;
};

type LogForm = {
  actor: string;
  location: string;
  severity: string;
  message: string;
  color: string;
};

const emptyUserForm: UserForm = {
  id: "",
  key: "",
  name: "",
  role: "STANDARD",
  status: "Active",
  avatar: "U",
};

const emptyLogForm: LogForm = {
  actor: "",
  location: "",
  severity: "SECURE",
  message: "",
  color: "#22d3ee",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Menyimpan..." : label}
    </button>
  );
}

export default function SecurityAccountsWorkspace({ logs, users }: Props) {
  const router = useRouter();
  const [userState, userAction] = useActionState(
    saveSecurityUserAction,
    initialPanelActionState,
  );
  const [logState, logAction] = useActionState(
    createSecurityLogAction,
    initialPanelActionState,
  );
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [logForm, setLogForm] = useState<LogForm>(emptyLogForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (userState.success) {
      setUserForm(emptyUserForm);
      setEditingUserId(null);
      setFeedback(userState.message);
      router.refresh();
    }
  }, [router, userState.message, userState.success]);

  useEffect(() => {
    if (logState.success) {
      setLogForm(emptyLogForm);
      setFeedback(logState.message);
      router.refresh();
    }
  }, [logState.message, logState.success, router]);

  const filteredLogs = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) return logs;
    return logs.filter((log) =>
      [log.time, log.actor, log.location, log.severity, log.message]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [deferredQuery, logs]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / 5));
  const safePage = Math.min(currentPage, totalPages);
  const visibleLogs = filteredLogs.slice((safePage - 1) * 5, (safePage - 1) * 5 + 5);

  function handleEditUser(user: SecurityUserRecord) {
    setUserForm({
      id: user.id,
      key: user.key,
      name: user.name,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
    });
    setEditingUserId(user.id);
    setFeedback(`Mode edit account ${user.id} aktif.`);
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm(`Hapus account ${id} dari database?`)) return;
    startTransition(async () => {
      const result = await deleteSecurityUserAction(id);
      setFeedback(result.message);
      if (result.success) router.refresh();
    });
  }

  async function handleDeleteLog(id: number) {
    if (!window.confirm(`Hapus log #${id}?`)) return;
    startTransition(async () => {
      const result = await deleteSecurityLogAction(id);
      setFeedback(result.message);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="layout-sec">
      <div className="panel" style={{ minHeight: "600px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {feedback ? (
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            {feedback}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ fontSize: "12px", fontFamily: "Share Tech Mono", color: "#a855f7" }}>
            REMOTE SESSION MANAGEMENT
          </h3>
          <span style={{ fontSize: "10px", color: "#22d3ee" }}>LIVE DATABASE LOGS</span>
        </div>

        <DataSearchInput
          ariaLabel="Search security logs"
          onChange={setQuery}
          placeholder="Search actor, location, or event..."
          value={query}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px 1fr 150px",
            gap: "12px",
            paddingBottom: "10px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontSize: "9px",
            color: "#6b7280",
            fontFamily: "Share Tech Mono",
            letterSpacing: "0.16em",
          }}
        >
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
          itemLabel="logs"
          mutedColor="#6b7280"
          onPageChange={setCurrentPage}
          totalItems={filteredLogs.length}
          totalPages={totalPages}
          visibleEnd={Math.min((safePage - 1) * 5 + 5, filteredLogs.length)}
          visibleStart={filteredLogs.length === 0 ? 0 : (safePage - 1) * 5 + 1}
        />

        <form action={logAction} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "14px" }}>
          <h4 style={{ fontSize: "12px", color: "#a855f7", marginBottom: "12px", fontFamily: "Share Tech Mono" }}>
            ADD SECURITY LOG
          </h4>
          {["actor", "location", "severity", "message", "color"].map((field) => (
            <input
              className="inp-cyber"
              key={field}
              name={field}
              onChange={(event) => setLogForm((current) => ({ ...current, [field]: event.target.value }))}
              placeholder={field.toUpperCase()}
              value={logForm[field as keyof LogForm]}
            />
          ))}
          <SubmitButton label="ADD LOG EVENT" />
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="panel">
          <h3 style={{ fontSize: "14px", marginBottom: "15px", fontFamily: "Share Tech Mono" }}>
            CREDENTIAL CONTROL
          </h3>
          <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "20px" }}>
            Update account access dan sinkronkan langsung ke tabel `app_users`.
          </p>

          <form action={userAction}>
            {[
              ["id", "USER ID"],
              ["name", "USER NAME"],
              ["role", "ROLE"],
              ["status", "STATUS"],
              ["avatar", "AVATAR"],
              ["key", "ACCESS KEY"],
            ].map(([field, label]) => (
              <div key={field}>
                <label style={{ fontSize: "9px", color: "#4b5563" }}>{label}</label>
                <input
                  className="inp-cyber"
                  name={field}
                  onChange={(event) => setUserForm((current) => ({ ...current, [field]: event.target.value }))}
                  value={userForm[field as keyof UserForm]}
                />
              </div>
            ))}

            <SubmitButton label={editingUserId ? "UPDATE ACCOUNT" : "SAVE ACCOUNT"} />
          </form>
        </div>

        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontFamily: "Share Tech Mono" }}>ACCOUNT LIST</h3>
            <span style={{ fontSize: "10px", color: "#22d3ee" }}>{users.length} accounts</span>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "#0b0b12",
                  padding: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ color: "white", fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                    {user.id} / {user.role} / {user.status}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleEditUser(user)}
                    style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.2)", padding: "8px 10px", cursor: "pointer" }}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleDeleteUser(user.id)}
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)", padding: "8px 10px", cursor: "pointer" }}
                    type="button"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
