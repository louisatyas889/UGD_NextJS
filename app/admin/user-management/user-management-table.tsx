'use client';

import { useActionState, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { initialPanelActionState } from "@/app/admin/panel-action-state";
import { deletePersonnelAction, savePersonnelAction } from "@/app/admin/panel-actions";
import type { PersonnelRecord } from "@/app/lib/admin-panels";
import DataPaginationBar from "@/app/ui/data-pagination-bar";
import DataSearchInput from "@/app/ui/data-search-input";

type UserManagementTableProps = { currentHour: number; records: PersonnelRecord[] };
type PersonnelFormValues = { id: string; name: string; workShift: string; jobTitle: string; startHour: string; endHour: string; assignedVessel: string };

const emptyForm: PersonnelFormValues = { id: "", name: "", workShift: "MORNING", jobTitle: "", startHour: "6", endHour: "14", assignedVessel: "" };

// Opsi daftar jenis pekerjaan yang diambil dari data Neon (fleet_personnel)
const JOB_TITLES = [
  "Commanding Officer",
  "Chief Engineer",
  "Navigation Specialist",
  "Cargo Operations Lead",
  "Route Analyst",
  "Security Supervisor",
  "Maintenance Chief",
  "Medical Officer",
  "Communications Officer"
];

// Opsi daftar kapal yang terdaftar di database Neon (fleet_vessels)
const VESSELS = [
  { id: "PL-0909-MERKURIUS", name: "PL-0909-MERKURIUS" },
  { id: "PL-123-BULAN", name: "PL-123-BULAN" },
  { id: "PL-230-NANA", name: "PL-230-NANA" },
  { id: "PL-234-NARS", name: "PL-234-NARS" },
  { id: "PL-245-MARS", name: "PL-245-MARS" }
];

function toFormValues(record: PersonnelRecord): PersonnelFormValues {
  return { id: record.id, name: record.name, workShift: record.workShift, jobTitle: record.jobTitle, startHour: String(record.startHour), endHour: String(record.endHour), assignedVessel: record.assignedVessel };
}

function checkStatus(currentHour: number, start: number, end: number) {
  if (start < end) return currentHour >= start && currentHour < end;
  return currentHour >= start || currentHour < end;
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return <button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70" disabled={pending} type="submit">{pending ? "Menyimpan..." : editing ? "Update Crew" : "Tambah Crew"}</button>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-300">{message}</p>;
}

function ShiftBadge({ shift }: { shift: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    MORNING: { bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)", text: "#fbbf24" },
    SWING: { bg: "rgba(34,211,238,0.10)", border: "rgba(34,211,238,0.25)", text: "#22d3ee" },
    NIGHT: { bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.25)", text: "#8b5cf6" },
  };
  const c = colors[shift] ?? colors.MORNING;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 9, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", background: c.bg, border: `1px solid ${c.border}`, color: c.text }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: c.text, boxShadow: `0 0 5px ${c.text}` }} />{shift}</span>;
}

function StatusBadge({ isOnDuty }: { isOnDuty: boolean }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 9, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.08em", background: isOnDuty ? "rgba(74,222,128,0.10)" : "rgba(248,113,113,0.08)", border: isOnDuty ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(248,113,113,0.20)", color: isOnDuty ? "#4ade80" : "#f87171" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: isOnDuty ? "#4ade80" : "#f87171", boxShadow: `0 0 5px ${isOnDuty ? "#4ade80" : "#f87171"}` }} />{isOnDuty ? "ON DECK" : "OFF DUTY"}</span>;
}

export default function UserManagementTable({ currentHour, records }: UserManagementTableProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(savePersonnelAction, initialPanelActionState);
  const [formValues, setFormValues] = useState<PersonnelFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  // LOGIK: Menghitung nomor resi ID urutan otomatis berikutnya (Format: SS-XXX)
  const nextId = useMemo(() => {
    let maxNum = 0;
    records.forEach((crew) => {
      if (crew.id && crew.id.startsWith("SS-")) {
        const num = parseInt(crew.id.replace("SS-", ""), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `SS-${String(nextNum).padStart(3, "0")}`;
  }, [records]);

  // Efek untuk mengisi ID otomatis secara default jika tidak dalam mode edit
  useEffect(() => {
    if (!editingId) {
      setFormValues((current) => ({ ...current, id: nextId }));
    }
  }, [nextId, editingId]);

  useEffect(() => { 
    if (state.success) { 
      setFormValues({ ...emptyForm, id: nextId }); 
      setEditingId(null); 
      setFeedback(state.message); 
      router.refresh(); 
    } 
  }, [router, state.message, state.success, nextId]);
  
  useEffect(() => { setCurrentPage(1); }, [deferredQuery]);

  const filteredRecords = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((crew) => [crew.id, crew.name, crew.workShift, crew.jobTitle, crew.assignedVessel].join(" ").toLowerCase().includes(normalized));
  }, [deferredQuery, records]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / 6));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * 6;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + 6);

  function handleEdit(record: PersonnelRecord) { setFormValues(toFormValues(record)); setEditingId(record.id); setFeedback(`Mode edit: ${record.name}`); }
  function handleReset() { setFormValues({ ...emptyForm, id: nextId }); setEditingId(null); setFeedback("Form crew di-reset."); }

  async function handleDelete(id: string) {
    if (!window.confirm(`Hapus crew ${id} dari database?`)) return;
    startTransition(async () => { const result = await deletePersonnelAction(id); setFeedback(result.message); if (result.success) { if (editingId === id) handleReset(); router.refresh(); } });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <form action={formAction} className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl shadow-black/20">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Crew Form</p><h2 className="mt-2 text-2xl font-semibold text-white">{editingId ? "Edit Crew" : "Tambah Crew"}</h2></div>
          <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300" onClick={handleReset} type="button">Reset</button>
        </div>
        {(feedback || state.message) ? <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${state.success ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"}`}>{feedback || state.message}</div> : null}
        
        <div className="space-y-4">
          {/* USER ID (Otomatis & Read-only) */}
          <label className="block text-sm text-slate-300">
            USER ID
            <input 
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-400 outline-none font-mono cursor-not-allowed" 
              name="id" 
              readOnly 
              value={formValues.id} 
            />
            <FieldError message={state.fieldErrors?.id?.[0]} />
          </label>

          {/* NAME */}
          <label className="block text-sm text-slate-300">
            NAME
            <input 
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60" 
              name="name" 
              onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))} 
              value={formValues.name} 
            />
            <FieldError message={state.fieldErrors?.name?.[0]} />
          </label>

          {/* JOB TITLE (Dropdown Pekerjaan dari Neon) */}
          <label className="block text-sm text-slate-300">
            JOB TITLE
            <select 
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60" 
              name="jobTitle" 
              onChange={(event) => setFormValues((current) => ({ ...current, jobTitle: event.target.value }))} 
              value={formValues.jobTitle}
            >
              <option value="">Pilih Jenis Pekerjaan...</option>
              {JOB_TITLES.map((job) => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.jobTitle?.[0]} />
          </label>

          {/* ASSIGNED VESSEL (Dropdown Kapal Terdaftar dari Neon) */}
          <label className="block text-sm text-slate-300">
            ASSIGNED VESSEL
            <select 
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60" 
              name="assignedVessel" 
              onChange={(event) => setFormValues((current) => ({ ...current, assignedVessel: event.target.value }))} 
              value={formValues.assignedVessel}
            >
              <option value="">Unassigned (Belum Ditugaskan)</option>
              {VESSELS.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>{vessel.name}</option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.assignedVessel?.[0]} />
          </label>

          {/* WORK SHIFT */}
          <label className="block text-sm text-slate-300">WORK SHIFT<select className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60" name="workShift" onChange={(event) => setFormValues((current) => ({ ...current, workShift: event.target.value }))} value={formValues.workShift}>{["MORNING", "SWING", "NIGHT"].map((shift) => (<option key={shift} value={shift}>{shift}</option>))}</select></label>
          
          {/* WORK HOURS */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">START HOUR<input className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60" max="23" min="0" name="startHour" onChange={(event) => setFormValues((current) => ({ ...current, startHour: event.target.value }))} type="number" value={formValues.startHour} /><FieldError message={state.fieldErrors?.startHour?.[0]} /></label>
            <label className="block text-sm text-slate-300">END HOUR<input className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60" max="23" min="0" name="endHour" onChange={(event) => setFormValues((current) => ({ ...current, endHour: event.target.value }))} type="number" value={formValues.endHour} /><FieldError message={state.fieldErrors?.endHour?.[0]} /></label>
          </div>
          
          <SubmitButton editing={Boolean(editingId)} />
        </div>
      </form>

      {/* Bagian Tabel / Direktori Personel */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/20">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Personnel Directory</p><p className="mt-2 text-sm text-slate-400">Data crew dibaca langsung dari Neon.</p></div>
          <DataSearchInput ariaLabel="Search personnel records" onChange={setQuery} placeholder="Cari user, role, shift, atau vessel..." value={query} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" style={{ maxHeight: "560px", overflow: "auto", paddingRight: 4 }}>
          {paginatedRecords.length === 0 ? (
            <div className="col-span-full py-12 text-center font-mono text-[10px] tracking-widest text-slate-500">NO CREW MATCHES THE CURRENT SEARCH.</div>
          ) : (
            paginatedRecords.map((crew) => {
              const isOnDuty = checkStatus(currentHour, crew.startHour, crew.endHour);
              return (
                <div key={crew.id} className="rounded-2xl border border-white/8 bg-gradient-to-b from-slate-800/60 to-slate-900/60 p-4 transition-all hover:border-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]" style={{ backdropFilter: "blur(8px)" }}>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[11px] tracking-wider text-cyan-300">{crew.id}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{crew.name}</p>
                    </div>
                    <StatusBadge isOnDuty={isOnDuty} />
                  </div>

                  <div className="mb-3 rounded-xl border border-white/5 bg-slate-950/40 p-3">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                      <div>
                        <span className="font-mono uppercase tracking-wider text-slate-500">Job Title</span>
                        <p className="mt-0.5 text-xs text-slate-300">{crew.jobTitle || "—"}</p>
                      </div>
                      <div>
                        <span className="font-mono uppercase tracking-wider text-slate-500">Shift</span>
                        <div className="mt-0.5"><ShiftBadge shift={crew.workShift} /></div>
                      </div>
                      <div>
                        <span className="font-mono uppercase tracking-wider text-slate-500">Assigned Vessel</span>
                        <p className="mt-0.5 text-xs font-mono text-cyan-300">{crew.assignedVessel || "Unassigned"}</p>
                      </div>
                      <div>
                        <span className="font-mono uppercase tracking-wider text-slate-500">Work Hours</span>
                        <p className="mt-0.5 text-xs text-slate-400">{String(crew.startHour).padStart(2, "0")}:00 — {String(crew.endHour).padStart(2, "0")}:00</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20" onClick={() => handleEdit(crew)} type="button">Edit</button>
                    <button className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-60" disabled={isPending} onClick={() => handleDelete(crew.id)} type="button">Hapus</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DataPaginationBar accentColor="#22d3ee" currentPage={safePage} itemLabel="crew" onPageChange={setCurrentPage} totalItems={filteredRecords.length} totalPages={totalPages} visibleEnd={Math.min(startIndex + 6, filteredRecords.length)} visibleStart={filteredRecords.length === 0 ? 0 : startIndex + 1} />
      </div>
    </div>
  );
}
