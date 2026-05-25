'use client';

import { useActionState, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { initialPanelActionState } from "@/app/admin/panel-action-state";
import {
  deletePersonnelAction,
  savePersonnelAction,
} from "@/app/admin/panel-actions";
import type { PersonnelRecord } from "@/app/lib/admin-panels";
import DataPaginationBar from "@/app/ui/data-pagination-bar";
import DataSearchInput from "@/app/ui/data-search-input";

type UserManagementTableProps = {
  currentHour: number;
  records: PersonnelRecord[];
};

type PersonnelFormValues = {
  id: string;
  name: string;
  workShift: string;
  jobTitle: string;
  startHour: string;
  endHour: string;
  assignedVessel: string;
};

const emptyForm: PersonnelFormValues = {
  id: "",
  name: "",
  workShift: "MORNING",
  jobTitle: "",
  startHour: "6",
  endHour: "14",
  assignedVessel: "",
};

function toFormValues(record: PersonnelRecord): PersonnelFormValues {
  return {
    id: record.id,
    name: record.name,
    workShift: record.workShift,
    jobTitle: record.jobTitle,
    startHour: String(record.startHour),
    endHour: String(record.endHour),
    assignedVessel: record.assignedVessel,
  };
}

function checkStatus(currentHour: number, start: number, end: number) {
  if (start < end) {
    return currentHour >= start && currentHour < end;
  }

  return currentHour >= start || currentHour < end;
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Menyimpan..." : editing ? "Update Crew" : "Tambah Crew"}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-300">{message}</p>;
}

export default function UserManagementTable({
  currentHour,
  records,
}: UserManagementTableProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    savePersonnelAction,
    initialPanelActionState,
  );
  const [formValues, setFormValues] = useState<PersonnelFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setFormValues(emptyForm);
    setEditingId(null);
    setFeedback(state.message);
    router.refresh();
  }, [router, state.message, state.success]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery]);

  const filteredRecords = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) {
      return records;
    }

    return records.filter((crew) =>
      [crew.id, crew.name, crew.workShift, crew.jobTitle, crew.assignedVessel]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [deferredQuery, records]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / 5));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * 5;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + 5);

  function handleEdit(record: PersonnelRecord) {
    setFormValues(toFormValues(record));
    setEditingId(record.id);
    setFeedback(`Mode edit aktif untuk ${record.name}.`);
  }

  function handleReset() {
    setFormValues(emptyForm);
    setEditingId(null);
    setFeedback("Form crew di-reset.");
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Hapus crew ${id} dari database?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deletePersonnelAction(id);
      setFeedback(result.message);

      if (result.success) {
        if (editingId === id) {
          handleReset();
        }
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <form
        action={formAction}
        className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl shadow-black/20"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              Crew Form
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {editingId ? "Edit Crew" : "Tambah Crew"}
            </h2>
          </div>
          <button
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300"
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
        </div>

        {(feedback || state.message) ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              state.success
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
            }`}
          >
            {feedback || state.message}
          </div>
        ) : null}

        <div className="space-y-4">
          {[
            ["id", "USER ID"],
            ["name", "NAME"],
            ["jobTitle", "JOB TITLE"],
            ["assignedVessel", "ASSIGNED VESSEL"],
          ].map(([field, label]) => (
            <label className="block text-sm text-slate-300" key={field}>
              {label}
              <input
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                name={field}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
                value={formValues[field as keyof PersonnelFormValues]}
              />
              <FieldError message={state.fieldErrors?.[field]?.[0]} />
            </label>
          ))}

          <label className="block text-sm text-slate-300">
            WORK SHIFT
            <select
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
              name="workShift"
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  workShift: event.target.value,
                }))
              }
              value={formValues.workShift}
            >
              {["MORNING", "SWING", "NIGHT"].map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              START HOUR
              <input
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                max="23"
                min="0"
                name="startHour"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    startHour: event.target.value,
                  }))
                }
                type="number"
                value={formValues.startHour}
              />
              <FieldError message={state.fieldErrors?.startHour?.[0]} />
            </label>

            <label className="block text-sm text-slate-300">
              END HOUR
              <input
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                max="23"
                min="0"
                name="endHour"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    endHour: event.target.value,
                  }))
                }
                type="number"
                value={formValues.endHour}
              />
              <FieldError message={state.fieldErrors?.endHour?.[0]} />
            </label>
          </div>

          <SubmitButton editing={Boolean(editingId)} />
        </div>
      </form>

      <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              Personnel Directory
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Data crew di bawah ini dibaca langsung dari Neon dan bisa diganti dari form di kiri.
            </p>
          </div>

          <DataSearchInput
            ariaLabel="Search personnel records"
            onChange={setQuery}
            placeholder="Search by user, role, shift, or vessel..."
            value={query}
          />
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-950/40">
          <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 text-xs uppercase tracking-[0.2em] text-slate-500 backdrop-blur">
              <tr>
                <th className="px-3 py-3">User ID</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Work Shift</th>
                <th className="px-3 py-3">Job Title</th>
                <th className="px-3 py-3">Assigned Vessel</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-500" colSpan={7}>
                    NO CREW MATCHES THE CURRENT SEARCH.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((crew) => {
                  const isOnDuty = checkStatus(currentHour, crew.startHour, crew.endHour);

                  return (
                    <tr className="border-b border-white/5" key={crew.id}>
                      <td className="px-3 py-4 font-mono text-slate-300">{crew.id}</td>
                      <td className="px-3 py-4 font-medium text-white">{crew.name}</td>
                      <td className="px-3 py-4">
                        <span className={isOnDuty ? "text-emerald-300" : "text-rose-300"}>
                          {isOnDuty ? "ON SITE" : "RESTING"}
                        </span>
                      </td>
                      <td className="px-3 py-4">{crew.workShift}</td>
                      <td className="px-3 py-4 text-slate-300">{crew.jobTitle}</td>
                      <td className="px-3 py-4 text-cyan-300">{crew.assignedVessel}</td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100"
                            onClick={() => handleEdit(crew)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100 disabled:opacity-60"
                            disabled={isPending}
                            onClick={() => handleDelete(crew.id)}
                            type="button"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>

        <DataPaginationBar
          accentColor="#22d3ee"
          currentPage={safePage}
          itemLabel="crew"
          onPageChange={setCurrentPage}
          totalItems={filteredRecords.length}
          totalPages={totalPages}
          visibleEnd={Math.min(startIndex + 5, filteredRecords.length)}
          visibleStart={filteredRecords.length === 0 ? 0 : startIndex + 1}
        />
      </div>
    </div>
  );
}
