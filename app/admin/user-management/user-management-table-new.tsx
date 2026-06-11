'use client';

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SecurityUserRecord } from "@/app/lib/admin-panels";
import DataSearchInput from "@/app/ui/data-search-input";

// Extended user type with work details
interface ExtendedUserRecord extends SecurityUserRecord {
  jobTitle?: string;
  assignedVessel?: string;
  workShift?: string;
  startHour?: number;
  endHour?: number;
}

type UserManagementTableProps = { 
  users: SecurityUserRecord[];
  // Prop baru agar sinkron dengan tabel armada di DB
  dbVessels?: Array<{ id: string; dest?: string; status?: string }>;
};

type UserFormValues = { 
  id: string; 
  name: string; 
  key: string;
  role: string; 
  status: string; 
  avatar: string;
  jobTitle: string;
  assignedVessel: string;
  workShift: string;
  startHour: string;
  endHour: string;
};

const emptyForm: UserFormValues = { 
  id: "", 
  name: "", 
  key: "", 
  role: "STANDARD", 
  status: "Active", 
  avatar: "U",
  jobTitle: "",
  assignedVessel: "",
  workShift: "MORNING",
  startHour: "6",
  endHour: "14"
};

// Job titles options
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

// Fallback jika database armada sedang kosong/belum di-seed
const FALLBACK_VESSELS = [
  "PL-0909-MERKURIUS",
  "PL-123-BULAN", 
  "PL-230-NANA",
  "PL-234-NARS",
  "PL-245-MARS"
];

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

function ShiftBadge({ shift }: { shift?: string }) {
  if (!shift) return <span className="text-slate-500 text-xs">—</span>;
  
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    MORNING: { bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)", text: "#fbbf24" },
    SWING: { bg: "rgba(34,211,238,0.10)", border: "rgba(34,211,238,0.25)", text: "#22d3ee" },
    NIGHT: { bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.25)", text: "#8b5cf6" },
  };
  const c = colors[shift] ?? colors.MORNING;
  return (
    <span style={{ 
      display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", 
      borderRadius: 20, fontSize: 9, fontFamily: "'Share Tech Mono', monospace", 
      letterSpacing: "0.1em", background: c.bg, border: `1px solid ${c.border}`, color: c.text 
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.text, boxShadow: `0 0 5px ${c.text}` }} />
      {shift}
    </span>
  );
}

export default function UserManagementTable({ users, dbVessels = [] }: UserManagementTableProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<UserFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AUTO-REFRESH: Memastikan data dropdown & tabel sinkron otomatis dengan Fleet Page
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000); // Dipercepat menjadi 5 detik untuk sinkronisasi database yang lebih responsif
    return () => clearInterval(interval);
  }, [router]);

  // MENGAMBIL DATA LANGSUNG DARI NEON (dbVessels). Jika kosong, baru gunakan fallback.
  const vesselsList = (dbVessels && dbVessels.length > 0) ? dbVessels.map(v => v.id) : []; // Tidak lagi menggunakan FALLBACK_VESSELS

  // Generate next user ID
  const nextId = () => {
    const maxNum = users.reduce((max, user) => {
      const match = user.id.match(/\d+/);
      return match ? Math.max(max, parseInt(match[0])) : max;
    }, 0);
    return `User-${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Filter users
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.id.toLowerCase().includes(query.toLowerCase()) ||
    user.role.toLowerCase().includes(query.toLowerCase()) ||
    user.key.toLowerCase().includes(query.toLowerCase())
  );

  // Pagination
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Styling helper untuk memberikan border merah pada field yang error / read-only
  const getInputClass = (fieldName: string, isLocked: boolean = false) => {
    if (isLocked) return 'border-white/10 bg-slate-800/40 text-slate-500 cursor-not-allowed';
    if (errors[fieldName]) return 'border-red-500 bg-red-500/10 text-slate-100 focus:border-red-400';
    return 'border-white/10 bg-slate-950/60 focus:border-cyan-400/60 text-slate-100';
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.name.trim()) newErrors.name = "Name is required";
    if (!formValues.startHour.trim()) newErrors.startHour = "Start hour is required";
    if (!formValues.endHour.trim()) newErrors.endHour = "End hour is required";

    if (!editingId) {
      if (!formValues.key.trim()) newErrors.key = "Access key is required";
      if (!formValues.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
      if (!formValues.assignedVessel.trim()) newErrors.assignedVessel = "Assigned vessel is required";
    } else {
      // Edit mode: Validasi perubahan khusus untuk kolom-kolom yang TIDAK TERKUNCI (bisa diedit)
      const originalUser = users.find(u => u.id === editingId);
      if (originalUser) {
        const orig = originalUser as any;
        const nameChanged = formValues.name !== orig.name;
        const shiftChanged = formValues.workShift !== (orig.workShift || 'MORNING');
        const startHourChanged = formValues.startHour !== String(orig.startHour || '6');
        const vesselChanged = formValues.assignedVessel !== (orig.assignedVessel || '');
        
        // WARNING: Jika form belum di-edit sama sekali, tandai field dengan border merah
        if (!nameChanged && !shiftChanged && !startHourChanged && !vesselChanged) {
          newErrors.name = "No changes detected";
          newErrors.workShift = "No changes detected";
          newErrors.startHour = "No changes detected";
          newErrors.assignedVessel = "No changes detected";
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function handleEdit(user: SecurityUserRecord) {
    setFormValues({
      ...user,
      jobTitle: (user as any).jobTitle || "",
      assignedVessel: (user as any).assignedVessel || "",
      workShift: (user as any).workShift || "MORNING",
      startHour: String((user as any).startHour || "6"),
      endHour: String((user as any).endHour || "14")
    });
    setEditingId(user.id);
    setErrors({});
    setFeedback(`Editing: ${user.name}`);
  }

  function handleReset() {
    setFormValues({ ...emptyForm, id: nextId() });
    setEditingId(null);
    setErrors({});
    setFeedback("Form reset");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      setFeedback("⚠️ Gagal: Harap ubah / periksa kolom yang berwarna merah.");
      return;
    }

    startTransition(async () => {
      try {
        const method = editingId ? 'PUT' : 'POST';
        const userData = editingId ? {
          // Edit mode: Kolom tidak terkunci
          id: formValues.id,
          name: formValues.name,
          workShift: formValues.workShift,
          startHour: formValues.startHour,
          assignedVessel: formValues.assignedVessel
        } : {
          // Create mode: Semua field
          id: formValues.id || nextId(),
          name: formValues.name,
          key: formValues.key,
          role: formValues.role,
          status: formValues.status,
          avatar: formValues.avatar || formValues.name.charAt(0).toUpperCase(),
          jobTitle: formValues.jobTitle,
          assignedVessel: formValues.assignedVessel,
          workShift: formValues.workShift,
          startHour: formValues.startHour,
          endHour: formValues.endHour
        };

        const response = await fetch('/api/admin/users', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to save user');
        }

        setFeedback(result.message || (editingId ? "User updated successfully" : "User created successfully"));
        handleReset();
        router.refresh();
      } catch (error: any) {
        console.error('Error saving user:', error);
        setFeedback(error.message || "Error saving user");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      {/* Form Section */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl shadow-black/20">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">User Form</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{editingId ? "Edit User" : "Add User"}</h2>
          </div>
          <div className="flex gap-2">
            {editingId && (
              <button className="rounded-xl border border-orange-400/20 bg-orange-400/10 px-3 py-2 text-sm text-orange-100 hover:bg-orange-400/20 transition" onClick={handleReset} type="button">
                Cancel Edit
              </button>
            )}
            <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300" onClick={handleReset} type="button">Reset</button>
          </div>
        </div>

        {feedback && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${feedback.includes('⚠️ Gagal') ? 'border-red-400/20 bg-red-400/10 text-red-100' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'}`}>
            {feedback}
          </div>
        )}
        
        <div className="space-y-4">
          {/* USER ID */}
          <label className="block text-sm text-slate-300">
            USER ID
            <input 
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-400 outline-none font-mono cursor-not-allowed" 
              readOnly 
              value={formValues.id || nextId()} 
            />
          </label>

          {/* NAME */}
          <label className="block text-sm text-slate-300">
            NAME *
            <input 
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('name')}`}
              onChange={(e) => {
                setFormValues(current => ({ ...current, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              value={formValues.name} 
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">
                {errors.name === "!" ? "Ubah data untuk menyimpan perubahan" : errors.name}
              </p>
            )}
          </label>

          {/* ACCESS KEY */}
          <label className="block text-sm text-slate-300">
            ACCESS KEY *
            <input 
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('key', !!editingId)}`}
              disabled={!!editingId}
              onChange={(e) => {
                if (!editingId) {
                  setFormValues(current => ({ ...current, key: e.target.value }));
                  if (errors.key) setErrors(prev => ({ ...prev, key: '' }));
                }
              }}
              value={formValues.key} 
            />
            {!editingId && errors.key && <p className="mt-1 text-xs text-red-400">{errors.key}</p>}
            {editingId && <p className="mt-1 text-xs text-slate-500">Cannot edit access key</p>}
          </label>

          {/* ROLE */}
          <label className="block text-sm text-slate-300">
            ROLE
            <select 
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('role', !!editingId)}`}
              disabled={!!editingId}
              onChange={(e) => {
                if (!editingId) {
                  setFormValues(current => ({ ...current, role: e.target.value }));
                }
              }} 
              value={formValues.role}
            >
              <option value="STANDARD">STANDARD</option>
              <option value="FLEET-MANAGER">FLEET-MANAGER</option>
              <option value="SYS-ADMIN">SYS-ADMIN</option>
            </select>
            {editingId && <p className="mt-1 text-xs text-slate-500">Cannot edit role</p>}
          </label>

          {/* STATUS */}
          <label className="block text-sm text-slate-300">
            STATUS
            <select 
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('status', !!editingId)}`}
              disabled={!!editingId}
              onChange={(e) => {
                if (!editingId) {
                  setFormValues(current => ({ ...current, status: e.target.value }));
                }
              }} 
              value={formValues.status}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {editingId && <p className="mt-1 text-xs text-slate-500">Cannot edit status</p>}
          </label>

          {/* JOB TITLE */}
          <label className="block text-sm text-slate-300">
            JOB TITLE *
            <select 
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('jobTitle', !!editingId)}`}
              disabled={!!editingId}
              onChange={(e) => {
                if (!editingId) {
                  setFormValues(current => ({ ...current, jobTitle: e.target.value }));
                  if (errors.jobTitle) setErrors(prev => ({ ...prev, jobTitle: '' }));
                }
              }}
              value={formValues.jobTitle}
            >
              <option value="">Select Job Title...</option>
              {JOB_TITLES.map((job) => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
            {!editingId && errors.jobTitle && <p className="mt-1 text-xs text-red-400">{errors.jobTitle}</p>}
            {editingId && <p className="mt-1 text-xs text-slate-500">Cannot edit job title</p>}
          </label>

          {/* ASSIGNED VESSEL */}
          <label className="block text-sm text-slate-300">
            ASSIGNED VESSEL *
            <select 
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('assignedVessel')}`}
              onChange={(e) => {
                setFormValues(current => ({ ...current, assignedVessel: e.target.value }));
                if (errors.assignedVessel) setErrors(prev => ({ ...prev, assignedVessel: '' }));
              }}
              value={formValues.assignedVessel}
            >
              <option value="">Select Vessel...</option>
              {vesselsList.map((vessel) => (
                <option key={vessel} value={vessel}>{vessel}</option>
              ))}
            </select>
            {errors.assignedVessel && (
              <p className="mt-1 text-xs text-red-400">
                {errors.assignedVessel === "!" ? "Ubah penugasan kapal" : errors.assignedVessel}
              </p>
            )}
          </label>

          {/* WORK SHIFT */}
          <label className="block text-sm text-slate-300">
            WORK SHIFT
            <select 
              className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('workShift')}`}
              onChange={(e) => {
                setFormValues(current => ({ ...current, workShift: e.target.value }));
                if (errors.workShift) setErrors(prev => ({ ...prev, workShift: '' }));
              }} 
              value={formValues.workShift}
            >
              <option value="MORNING">MORNING</option>
              <option value="SWING">SWING</option>
              <option value="NIGHT">NIGHT</option>
            </select>
            {errors.workShift && <p className="mt-1 text-xs text-red-400">{errors.workShift}</p>}
          </label>
          
          {/* WORK HOURS */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              START HOUR *
              <input 
                className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('startHour')}`}
                max="23" 
                min="0" 
                onChange={(e) => {
                  setFormValues(current => ({ ...current, startHour: e.target.value }));
                  if (errors.startHour) setErrors(prev => ({ ...prev, startHour: '' }));
                }}
                type="number" 
                value={formValues.startHour} 
              />
              {errors.startHour && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.startHour === "!" ? "Ubah jam mulai" : errors.startHour}
                </p>
              )}
            </label>
            
            <label className="block text-sm text-slate-300">
              END HOUR *
              <input 
                className={`mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm outline-none transition ${getInputClass('endHour', !!editingId)}`}
                disabled={!!editingId}
                max="23" 
                min="0" 
                onChange={(e) => {
                  if (!editingId) {
                    setFormValues(current => ({ ...current, endHour: e.target.value }));
                    if (errors.endHour) setErrors(prev => ({ ...prev, endHour: '' }));
                  }
                }}
                type="number" 
                value={formValues.endHour} 
              />
              {!editingId && errors.endHour && <p className="mt-1 text-xs text-red-400">{errors.endHour}</p>}
              {editingId && <p className="mt-1 text-xs text-slate-500">Cannot edit end hour</p>}
            </label>
          </div>
          
          <button 
            className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 w-full" 
            disabled={isPending} 
            type="submit"
          >
            {isPending ? "Saving..." : editingId ? "Update User" : "Add User"}
          </button>
        </div>
      </form>

      {/* Users List Section */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/20">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">User Directory</p>
            <p className="mt-2 text-sm text-slate-400">Data users dari Neon database.</p>
          </div>
          <DataSearchInput ariaLabel="Search users" onChange={setQuery} placeholder="Cari nama, ID, role..." value={query} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedUsers.length === 0 ? (
            <div className="col-span-full py-12 text-center font-mono text-[10px] tracking-widest text-slate-500">
              {query ? "NO USERS MATCH THE SEARCH" : "NO USERS FOUND"}
            </div>
          ) : (
            paginatedUsers.map((user) => {
              const extUser = user as any;
              return (
                <div key={user.id} className="rounded-2xl border border-white/8 bg-gradient-to-b from-slate-800/60 to-slate-900/60 p-4 transition-all hover:border-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]" style={{ backdropFilter: "blur(8px)" }}>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[11px] tracking-wider text-cyan-300">{user.id}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{extUser.jobTitle || 'No job title'}</p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full text-white font-bold text-sm">
                      {user.avatar}
                    </div>
                  </div>

                  <div className="mb-3 rounded-xl border border-white/5 bg-slate-950/40 p-3">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                      <div>
                        <span className="font-mono uppercase tracking-wider text-slate-500">Role</span>
                        <div className="mt-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getRoleStyle(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-mono uppercase tracking-wider text-slate-500">Status</span>
                        <div className="mt-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusStyle(user.status)}`}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-mono uppercase tracking-wider text-slate-500">Vessel</span>
                        <p className="mt-0.5 text-xs font-mono text-emerald-300">{extUser.assignedVessel || 'Unassigned'}</p>
                      </div>
                      <div>
                        <span className="font-mono uppercase tracking-wider text-slate-500">Shift</span>
                        <div className="mt-0.5">
                          <ShiftBadge shift={extUser.workShift || 'MORNING'} />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-mono uppercase tracking-wider text-slate-500">Work Hours</span>
                        <p className="mt-0.5 text-xs text-purple-300">
                          {extUser.startHour ? `${String(extUser.startHour).padStart(2, '0')}:00` : '06:00'} - {extUser.endHour ? `${String(extUser.endHour).padStart(2, '0')}:00` : '14:00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      className="flex-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20" 
                      onClick={() => handleEdit(user)} 
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Simple pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-8 h-8 rounded-full text-xs font-mono transition-all ${
                  safePage === idx + 1
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
