"use client";

import { lazy, Suspense, useEffect, useState, useRef } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";
import SuspensePanelLoader from "../ui/suspense-panel-loader";
import { createVessel, updateVessel, deleteVessel } from "./actions";
import { useFleet } from "../context/FleetContext";

const FleetActiveTable = lazy(() => import("./fleet-active-table"));

interface FleetPageClientProps {
  dbVessels: Array<{
    id: string;
    dest: string;
    status: string;
    st: string;
    eta: string;
    mon: string;
    subtitle?: string;
    progress: number;
  }>;
}

// Otomatisasi petaan Status ke Warna Neon & Icon Lambang database
// CATATAN: IN PORT sekarang UNGU (#a855f7) sesuai permintaan terbaru.
const STATUS_MAP: Record<string, { color: string; icon: string }> = {
  "EN ROUTE": { color: "#22d3ee", icon: "anchor" },      // Kapal Berjalan (Cyan)
  "DELAYED": { color: "#f87171", icon: "warn" },         // Kapal Delay / Badai (Merah)
  "IN PORT": { color: "#a855f7", icon: "anchor" },       // Sudah Berlabuh (Ungu)
  "MAINTENANCE": { color: "#a855f7", icon: "wrench" },   // Perawatan (Ungu)
  "HOME PORT": { color: "#ffffff", icon: "home" },       // Kembali ke Dermaga (Putih Neon)
};

export default function FleetPageClient({ dbVessels }: FleetPageClientProps) {
  const [time, setTime] = useState("");
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vesselIdToDelete, setVesselIdToDelete] = useState<string | null>(null);

  // State internal untuk melacak perubahan pilihan status di form modal
  const [createStatus, setCreateStatus] = useState("EN ROUTE");
  const [editStatus, setEditStatus] = useState("EN ROUTE");

  const createModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const confirmDeleteRef = useRef<HTMLDialogElement>(null);
  
  const { vesselEnergy, initializeFleet } = useFleet();

  const openDeleteConfirm = (id: string) => {
    setErrorMsg(null);
    setVesselIdToDelete(id); 
    confirmDeleteRef.current?.showModal(); 
  };

  useEffect(() => {
    if (dbVessels?.length > 0) initializeFleet(dbVessels);
  }, [dbVessels, initializeFleet]);

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const isValidVesselId = (id: string) => /^PL-\d+-[A-Za-z]+$/i.test(id.trim());

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string;
    const dest = formData.get("destination") as string;

    if (!id?.trim() || !dest?.trim()) return setErrorMsg("ID dan Tujuan kapal tidak boleh kosong.");
    if (!isValidVesselId(id)) return setErrorMsg("Format ID salah. Gunakan format seperti PL-234-Mars.");

    setIsSubmitting(true);
    try {
      const res = await createVessel(formData);
      if (res?.success) {
        createModalRef.current?.close();
        e.currentTarget.reset();
        setCreateStatus("EN ROUTE");
      } else {
        setErrorMsg(res?.error || "Gagal menambahkan kapal.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan koneksi ke server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null); 
    const formData = new FormData(e.currentTarget);
    if (!(formData.get("destination") as string)?.trim()) return setErrorMsg("Error: Tujuan tidak boleh kosong.");

    setIsSubmitting(true); 
    try {
      const res = await updateVessel(formData);
      if (res?.success) {
        editModalRef.current?.close();
        editFormRef.current?.reset();
        setSelectedVessel(null);
      } else {
        setErrorMsg(res?.error || "Gagal memperbarui kapal.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat memperbarui.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExecuteDelete() {
    if (!vesselIdToDelete) return;
    setErrorMsg(null); 
    setIsSubmitting(true);
    try {
      const res = await deleteVessel(vesselIdToDelete);
      if (!res.success) {
        setErrorMsg(res.error || "Gagal menghapus kapal.");
      } else {
        confirmDeleteRef.current?.close(); 
        setVesselIdToDelete(null); 
      }
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat menghapus.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancelEdit = () => {
    editFormRef.current?.reset();
    editModalRef.current?.close();
    setSelectedVessel(null);
  };

  const fuelFleetData = dbVessels
    .filter((v) => v.id && v.id !== "NNN")
    .map((v) => ({
      id: v.id,
      cleanName: v.id.toUpperCase().replace(/^(V-|PL-)/, "").trim(),
      color: STATUS_MAP[v.status]?.color || v.st || "#22d3ee", // Menggunakan warna dinamis putih jika HOME PORT
      percentage: Math.round(vesselEnergy[v.id] ?? v.progress),
    }));

  const totalFuelAggregate = fuelFleetData.length > 0
    ? (fuelFleetData.reduce((acc, v) => acc + v.percentage, 0) / fuelFleetData.length).toFixed(1)
    : "0";

  const alertVessels = dbVessels.filter((v) => v.status === "DELAYED" || v.status === "MAINTENANCE");

  return (
    <>
      <style>{cyberStyles}</style>
      <PrimeTopbar />

      <div className="main-container">
        <div className="header-flex">
          <div>
            <h1 className="title-h1">FLEET OVERVIEW</h1>
            <p style={{ fontSize: 13, color: "#4b5563", marginTop: 5 }}>
              Logistik global dan pelacakan kapal
            </p>
          </div>
          <div style={{ textAlign: "right", fontFamily: "'Share Tech Mono',monospace" }}>
            <div style={{ color: "#22d3ee", fontSize: 10, letterSpacing: "0.1em" }}>SYSTEM STATUS: NOMINAL</div>
            <div style={{ color: "#374151", fontSize: 9, marginTop: 4 }}>Last Updated: {time}</div>
          </div>
        </div>

        <div className="grid-layout">
          <div className="left-side">
            <Suspense fallback={<SuspensePanelLoader rows={4} title="Loading active fleet telemetry..." />}>
              <FleetActiveTable
                dbVessels={dbVessels}
                onOpenCreate={() => { setErrorMsg(null); setCreateStatus("EN ROUTE"); createModalRef.current?.showModal(); }}
                onOpenEdit={(vessel: any) => { setErrorMsg(null); setSelectedVessel(vessel); setEditStatus(vessel.status || "EN ROUTE"); editModalRef.current?.showModal(); }}
                onDelete={openDeleteConfirm}
              />
            </Suspense>
          </div>

          <div className="right-side">
            <div className="panel-v2" style={{ marginBottom: 24 }}>
              <div className="panel-label">CRITICAL ALERTS</div>
              {alertVessels.length === 0 ? (
                <div style={{ padding: 20, fontSize: 11, color: "#4b5563", fontFamily: "'Share Tech Mono', monospace", textAlign: "center" }}>
                  ALL SYSTEMS OPERATIONAL // NO ALERTS
                </div>
              ) : (
                alertVessels.map((v, index) => {
                  const isDelayed = v.status === "DELAYED";
                  return (
                    <div 
                      key={v.id || index} 
                      className="alert-card"
                      style={{
                        background: isDelayed ? "rgba(248, 113, 113, 0.05)" : "rgba(244, 114, 182, 0.05)",
                        borderLeft: `3px solid ${isDelayed ? "#f87171" : "#f472b6"}`,
                        margin: "15px",
                        padding: "15px 20px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: isDelayed ? "#f87171" : "#f472b6", fontWeight: 700, fontSize: 10 }}>
                          {isDelayed ? "WEATHER WARNING" : "MAINTENANCE ALERT"}
                        </span>
                        <span style={{ color: "#4b5563", fontSize: 9 }}>ID: {v.id}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>
                        {isDelayed ? `Ada masalah cuaca pada rute pelayaran kapal ${v.id}.` : `Peringalan: Kapal ${v.id} sedang perawatan.`} Hub Tujuan: {v.dest || "-"}.
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="panel-v2">
              <div className="panel-label">FUEL CONSUMPTION (BAHAN BAKAR)</div>
              <div className="fuel-chart-wrapper">
                <div className="fuel-viz">
                  {fuelFleetData.length > 0 ? (
                    fuelFleetData.map((v, i) => (
                      <div className="fuel-bar-container" key={i}>
                        <span className="fuel-pct-label" style={{ color: v.color }}>{v.percentage}%</span>
                        {/* Box Shadow dibuat inline agar pancaran efek cahaya neon mengikuti warna status kapal (Termasuk Putih) */}
                        <div className="fuel-bar-v2" style={{ height: `${v.percentage}%`, background: v.color, boxShadow: `0 0 15px ${v.color}99` }} />
                        <span className="fuel-name-label">{v.cleanName}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 11, color: "#4b5563", paddingBottom: 20, width: "100%", textAlign: "center" }}>
                      NO TELEMETRY DATA
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: 20, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 9, color: "#4b5563" }}>Avg Fleet Fuel Level</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{totalFuelAggregate}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, color: "#4b5563" }}>Consumption Status</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#22d3ee" }}>ONLINE MONITORING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      <dialog ref={createModalRef} className="cyber-modal">
        <div className="form-title">CREATE NEW VESSEL</div>
        {errorMsg && (
          <div style={{ color: "#f87171", fontSize: "10px", marginBottom: "14px", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.35)", padding: "8px", fontFamily: "'Share Tech Mono', monospace" }}>
            ERROR: {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreateSubmit}>
          <div className="cyber-group"><label>VESSEL SERIAL ID</label><input name="id" placeholder="e.g. PL-102-MARS" className="cyber-input" required/></div>
          <div className="cyber-group"><label>DESTINATION HUB</label><input name="destination" placeholder="e.g. Singapore Harbor" className="cyber-input" required/></div>
          <div className="cyber-group">
            <label>TELEMETRY STATUS</label>
            <select name="status" className="cyber-input" style={{ background: "#111" }} value={createStatus} onChange={(e) => setCreateStatus(e.target.value)}>
              <option value="EN ROUTE">EN ROUTE</option>
              <option value="DELAYED">DELAYED</option>
              <option value="IN PORT">IN PORT</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="HOME PORT">HOME PORT</option> {/* OPSI BARU */}
            </select>
          </div>
          <div className="cyber-group"><label>ESTIMATED TIME ARRIVAL (ETA)</label><input name="eta" placeholder="e.g. 26 OCT 09:00" className="cyber-input" /></div>
          
          {/* Hidden inputs otomatis mengirim data warna dan logo yang tepat ke database backend */}
          <input type="hidden" name="status_color" value={STATUS_MAP[createStatus]?.color || "#22d3ee"} />
          <input type="hidden" name="monitoring_icon" value={STATUS_MAP[createStatus]?.icon || "chart"} />

          <div className="modal-actions">
            <button type="button" className="btn-cyber" style={{ borderColor: "#f87171", color: "#f87171" }} onClick={() => createModalRef.current?.close()}>CANCEL</button>
            <button type="submit" className="btn-cyber">SUBMIT TELEMETRY</button>
          </div>
        </form>
      </dialog>

      {/* EDIT MODAL */}
      <dialog ref={editModalRef} className="cyber-modal">
        <div className="form-title" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '12px', marginBottom: '14px', color: '#a855f7' }}>
          {errorMsg && (
            <div style={{ color: '#f87171', fontSize: '10px', marginBottom: '10px', background: 'rgba(248, 113, 113, 0.1)', padding: '8px' , fontFamily: "'Share Tech Mono', monospace" }}>
              ERROR: {errorMsg}
            </div>
          )}
          UPDATE TELEMETRY: {selectedVessel?.id}
        </div>
        <form key={selectedVessel?.id || "empty-telemetry"} ref={editFormRef} onSubmit={handleEditSubmit}>
          <input type="hidden" name="id" value={selectedVessel?.id || ""} />
          <div className="cyber-group"><label>DESTINATION HUB</label><input name="destination" defaultValue={selectedVessel?.dest || ""} className="cyber-input" required /></div>
          <div className="cyber-group">
            <label>TELEMETRY STATUS</label>
            <select name="status" className="cyber-input" style={{ background: "#111" }} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value="EN ROUTE">EN ROUTE</option>
              <option value="DELAYED">DELAYED</option>
              <option value="IN PORT">IN PORT</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="HOME PORT">HOME PORT</option> {/* OPSI BARU */}
            </select>
          </div>
          <div className="cyber-group"><label>ESTIMATED TIME ARRIVAL (ETA)</label><input name="eta" defaultValue={selectedVessel?.eta || ""} className="cyber-input" /></div>
          
          {/* Hidden inputs otomatis menyinkronkan warna dan logo ke database saat disubmit */}
          <input type="hidden" name="status_color" value={STATUS_MAP[editStatus]?.color || "#22d3ee"} />
          <input type="hidden" name="monitoring_icon" value={STATUS_MAP[editStatus]?.icon || "chart"} />

          <div className="modal-actions">
            <button type="button" className="btn-cyber" style={{ borderColor: "#4b5563", color: "#4b5563" }} onClick={handleCancelEdit}>CANCEL</button>
            <button type="submit" className="btn-cyber" style={{ borderColor: "#a855f7", color: "#a855f7" }}>APPLY UPGRADE</button>
          </div>
        </form>
      </dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <dialog ref={confirmDeleteRef} className="cyber-modal">
        <div className="form-title" style={{ borderColor: "#f87171", color: "#f87171" }}>CONFIRM DELETE</div>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
          Apakah Anda yakin ingin menghapus data telemetri untuk kapal ini? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-cyber" style={{ borderColor: "#4b5563", color: "#4b5563" }} onClick={() => confirmDeleteRef.current?.close()}>CANCEL</button>
          <button type="button" className="btn-cyber" style={{ borderColor: "#f87171", color: "#f87171" }} onClick={handleExecuteDelete} disabled={isSubmitting}>
            {isSubmitting ? "DELETING..." : "DELETE TELEMETRY"}
          </button>
        </div>
      </dialog>
    </>
  );
}

const cyberStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');
  *,*::before,*::after{ box-sizing:border-box; margin:0; padding:0 }
  body{ background:#050505; color:#e5e7eb; font-family:'Rajdhani',sans-serif }
  .main-container{ padding:24px; max-width:1600px; margin:0 auto }
  .header-flex{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:30px }
  .title-h1{ font-family:'Orbitron',sans-serif; font-size:28px; font-weight:800; letter-spacing:0.05em; color:#fff }
  .grid-layout{ display:grid; grid-template-columns:1fr 340px; gap:24px }
  .panel-v2{ background:#0a0a0a; border:1px solid rgba(255,255,255,0.03); border-radius:4px }
  .panel-label{ font-family:'Share Tech Mono',monospace; font-size:10px; color:#4b5563; letter-spacing:0.2em; padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.03) }
  .alert-card{ margin:15px; padding:20px; background:rgba(248,113,113,0.05); border-left:3px solid #f87171 }
  .fuel-chart-wrapper{ width:100%; overflow-x:auto; padding-bottom:15px; }
  .fuel-chart-wrapper::-webkit-scrollbar{ height:4px; }
  .fuel-chart-wrapper::-webkit-scrollbar-thumb{ background:rgba(168,85,247,0.4); border-radius:10px; }
  .fuel-viz{ height:240px; display:flex; align-items:flex-end; justify-content:flex-start; gap:16px; padding:35px 20px 40px; border-bottom:1px solid rgba(255,255,255,0.02); background:#0a0a0a; min-width:600px; }
  .fuel-bar-container{ flex:1; min-width:48px; height:100%; display:flex; flex-direction:column; justify-content:flex-end; position:relative; background:rgba(255,255,255,0.02); border-radius:2px; }
  .fuel-bar-v2{ width:100%; border-radius:2px 2px 0 0; position:relative; transition:height 0.5s cubic-bezier(0.4,0,0.2,1); }
  .fuel-pct-label{ position:absolute; top:-22px; left:50%; transform:translateX(-50%); font-family:'Share Tech Mono',monospace; font-size:11px; font-weight:bold; letter-spacing:0.05em; }
  .fuel-name-label{ position:absolute; bottom:-28px; left:50%; transform:translateX(-50%); font-family:'Share Tech Mono',monospace; font-size:9px; color:#6b7280; white-space:nowrap; text-align:center; letter-spacing:0.02em; }
  .btn-cyber{ font-family:'Share Tech Mono',monospace; font-size:11px; background:transparent; color:#22d3ee; border:1px dashed #22d3ee; padding:6px 14px; cursor:pointer; letter-spacing:0.1em; transition:all 0.2s ease; }
  .btn-cyber:hover{ background:rgba(34,211,238,0.1); box-shadow:0 0 10px rgba(34,211,238,0.2); }
  .cyber-modal{ background:#0a0a0a; border:1px solid #22d3ee; color:#fff; padding:24px; margin:auto; max-width:400px; width:100%; box-shadow:0 0 30px rgba(0,0,0,0.8); }
  .cyber-modal::backdrop{ background:rgba(0,0,0,0.7); backdrop-filter:blur(3px); }
  .form-title{ font-family:'Orbitron',sans-serif; font-size:14px; letter-spacing:0.1em; color:#22d3ee; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px; }
  .cyber-group{ margin-bottom:16px; }
  .cyber-group label{ display:block; font-family:'Share Tech Mono',monospace; font-size:10px; color:#4b5563; margin-bottom:6px; letter-spacing:0.05em; }
  .cyber-input{ width:100%; background:#111; border:1px solid rgba(255,255,255,0.08); color:#fff; padding:8px 12px; font-size:13px; font-family:'Rajdhani',sans-serif; }
  .cyber-input:focus{ outline:none; border-color:#22d3ee; }
  .modal-actions{ display:flex; justify-content:flex-end; gap:12px; margin-top:24px; }
`;
