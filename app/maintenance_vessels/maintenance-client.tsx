"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";
import { saveVesselMaintenance, completeVesselMaintenance } from "./actions";
import { useMaintenance, type MaintenanceVessel } from "../context/MaintenanceContext";

// Komponen utama: daftar kapal MAINTENANCE dengan progress bar 1 menit + tombol status baru
export default function MaintenanceClient() {
  const { vessels, loading, refresh, removeVesselLocally } = useMaintenance();
  const [showForm, setShowForm] = useState(false);

  // Form state (untuk inisialisasi maintenance kapal baru dari halaman ini)
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleInitSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    try {
      const res = await saveVesselMaintenance(formData);
      if (res?.success) {
        setMessage({ type: "success", text: "SUCCESS: Kapal berhasil dimasukkin ke protokol maintenance." });
        event.currentTarget.reset();
        // Tutup form setelah 1.5 detik agar user lihat notif sukses
        setTimeout(() => setShowForm(false), 1500);
        // Refresh context untuk mengambil kapal MAINTENANCE terbaru
        setTimeout(() => refresh(), 500);
      } else {
        setMessage({ type: "error", text: `ERROR: ${res?.error || "Gagal menginisialisasi mode maintenance."}` });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: `SYSTEM ERROR: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  }

  // Ambil daftar kapal non-MAINTENANCE untuk dropdown inisialisasi (semua kapal)
  const [allVessels, setAllVessels] = useState<Array<{ id: string; status: string }>>([]);
  useEffect(() => {
    if (!showForm) return;
    fetch("/api/maintenance-vessels?scope=all", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.success && Array.isArray(j.vessels)) {
          setAllVessels(j.vessels.filter((v: any) => v.status !== "MAINTENANCE"));
        }
      })
      .catch(() => {});
  }, [showForm]);

  return (
    <div className="maintenance-bg">
      <PrimeTopbar />

      <style>{`
        .maintenance-bg {
          background: #0a0a0a;
          min-height: 100vh;
          color: #fff;
          font-family: 'Share Tech Mono', monospace;
          padding-bottom: 60px;
        }
        .container {
          max-width: 900px;
          margin: 40px auto;
          padding: 0 20px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(168, 85, 247, 0.15);
        }
        .page-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 20px;
          letter-spacing: 0.15em;
          color: #a855f7;
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.4);
          text-transform: uppercase;
          margin: 0;
        }
        .btn-new {
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
          border: 1px solid #a855f7;
          padding: 8px 16px;
          cursor: pointer;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .btn-new:hover { background: rgba(168, 85, 247, 0.25); }

        .vessel-card {
          background: #050505;
          border: 1px solid rgba(168, 85, 247, 0.25);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.08);
          padding: 22px 26px;
          margin-bottom: 18px;
          position: relative;
          transition: all 0.3s ease;
        }
        .vessel-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #a855f7, transparent);
        }
        .vessel-card.completed {
          border-color: #22d3ee;
          box-shadow: 0 0 25px rgba(34, 211, 238, 0.2);
        }
        .vessel-card.completed::before {
          background: linear-gradient(90deg, transparent, #22d3ee, transparent);
        }
        .vessel-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .vessel-id {
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.1em;
        }
        .vessel-dest {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
          letter-spacing: 0.05em;
        }
        .status-tag {
          font-size: 9px;
          letter-spacing: 0.15em;
          padding: 4px 10px;
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.4);
          text-transform: uppercase;
        }
        .status-tag.completed {
          background: rgba(34, 211, 238, 0.15);
          color: #22d3ee;
          border-color: rgba(34, 211, 238, 0.4);
        }
        .progress-wrap {
          margin: 14px 0 6px;
        }
        .progress-track {
          width: 100%;
          height: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(168, 85, 247, 0.3);
          position: relative;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a855f7, #ec4899);
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.6);
          transition: width 0.4s linear;
        }
        .progress-fill.done {
          background: linear-gradient(90deg, #22d3ee, #10b981);
          box-shadow: 0 0 14px rgba(34, 211, 238, 0.6);
        }
        .progress-meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #6b7280;
          margin-top: 6px;
          letter-spacing: 0.05em;
        }
        .progress-pct {
          color: #a855f7;
          font-weight: bold;
        }
        .progress-pct.done { color: #22d3ee; }

        .choice-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .choice-btn {
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          padding: 10px 8px;
          background: rgba(34, 211, 238, 0.05);
          color: #22d3ee;
          border: 1px dashed #22d3ee;
          cursor: pointer;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }
        .choice-btn:hover:not(:disabled) {
          background: rgba(34, 211, 238, 0.18);
          border-style: solid;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
        }
        .choice-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .choice-btn.home {
          color: #ffffff;
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.04);
        }
        .choice-btn.home:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        .choice-btn.port {
          color: #9ca3af;
          border-color: #6b7280;
        }
        .choice-btn.port:hover:not(:disabled) {
          background: rgba(156, 163, 175, 0.15);
          color: #fff;
          border-style: solid;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #4b5563;
          border: 1px dashed rgba(168, 85, 247, 0.2);
          font-size: 12px;
          letter-spacing: 0.1em;
        }

        .cyber-card {
          background: #000;
          border: 1px solid #a855f7;
          box-shadow: 0 0 25px rgba(168, 85, 247, 0.15);
          padding: 30px;
          margin-bottom: 24px;
        }
        .form-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 16px;
          letter-spacing: 0.15em;
          color: #a855f7;
          margin-bottom: 24px;
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
          text-transform: uppercase;
        }
        .form-group { margin-bottom: 18px; display: flex; flex-direction: column; }
        .form-label {
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 6px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .cyber-input {
          background: #0a0a0a;
          border: 1px dashed #a855f7;
          padding: 10px;
          color: #22d3ee;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          outline: none;
        }
        .cyber-input:focus { border-style: solid; box-shadow: 0 0 10px rgba(168, 85, 247, 0.4); }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .btn-cyber {
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          background: rgba(168, 85, 247, 0.05);
          color: #a855f7;
          border: 1px solid #a855f7;
          padding: 12px 20px;
          cursor: pointer;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: bold;
          width: 100%;
          margin-top: 10px;
        }
        .btn-cyber:hover:not(:disabled) { background: rgba(168, 85, 247, 0.2); }
        .btn-cyber:disabled { opacity: 0.5; cursor: not-allowed; }
        .alert { border: 1px solid; padding: 12px; font-size: 12px; margin-top: 18px; text-align: center; }
        .alert-success { border-color: #a855f7; color: #a855f7; background: rgba(168, 85, 247, 0.1); }
        .alert-error { border-color: #f87171; color: #f87171; background: rgba(248, 113, 113, 0.05); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6) sepia(1) saturate(3) hue-rotate(240deg); cursor: pointer; }
      `}</style>

      <div className="container">
        <div className="page-header">
          <h1 className="page-title">/// ACTIVE MAINTENANCE QUEUE</h1>
          <button className="btn-new" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "× TUTUP FORM" : "+ INIT MAINTENANCE"}
          </button>
        </div>

        {showForm && (
          <div className="cyber-card">
            <h2 className="form-title">INITIALIZE MAINTENANCE PROTOCOL</h2>
            <form onSubmit={handleInitSubmit}>
              <div className="form-group">
                <label className="form-label">TARGET VESSEL ID</label>
                <select name="vesselId" className="cyber-input" required>
                  <option value="">-- SELECT FLEET REGISTRY --</option>
                  {allVessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} - [ STATUS: {v.status} ]
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">START DATE</label>
                  <input type="date" name="startDate" className="cyber-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">ESTIMATED END DATE</label>
                  <input type="date" name="endDate" className="cyber-input" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">DAMAGE CLASSIFICATION</label>
                <select name="damageLevel" className="cyber-input" required>
                  <option value="">-- SELECT --</option>
                  <option value="Small">SMALL (Perawatan Rutin)</option>
                  <option value="Medium">MEDIUM (Servis Mesin)</option>
                  <option value="Emergency">EMERGENCY (Kerusakan Kritis)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">MAINTENANCE LOG</label>
                <textarea name="description" rows={4} className="cyber-input" required />
              </div>
              <button type="submit" className="btn-cyber" disabled={submitting}>
                {submitting ? "PROCESSING..." : "EXECUTE PROTOCOL"}
              </button>
              {message && (
                <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
                  {message.text}
                </div>
              )}
            </form>
          </div>
        )}

        {loading && vessels.length === 0 ? (
          <div className="empty-state">SYNCHRONIZING MAINTENANCE REGISTRY...</div>
        ) : vessels.length === 0 ? (
          <div className="empty-state">
            // NO ACTIVE MAINTENANCE PROTOCOL //
            <br />
            <span style={{ fontSize: 10, marginTop: 8, display: "block" }}>
              Set status kapal ke MAINTENANCE dari halaman Fleet untuk memulai.
            </span>
          </div>
        ) : (
          vessels.map((v) => <MaintenanceCard key={v.id} vessel={v} onComplete={removeVesselLocally} />)
        )}
      </div>
    </div>
  );
}

// === Komponen Card dengan Progress Bar 1 Menit ===
function MaintenanceCard({ 
  vessel, 
  onComplete 
}: { 
  vessel: MaintenanceVessel; 
  onComplete: (id: string) => void;
}) {
  // Total durasi maintenance: 60 detik
  const DURATION = 60;
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (completed) return;
    const t = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsed(secs);
      if (secs >= DURATION) {
        setElapsed(DURATION);
        setCompleted(true);
        clearInterval(t);
      }
    }, 250);
    return () => clearInterval(t);
  }, [completed]);

  const pct = Math.min(100, Math.round((elapsed / DURATION) * 100));
  const remaining = Math.max(0, DURATION - elapsed);

  // Handler saat user klik salah satu tombol status baru
  async function chooseNewStatus(newStatus: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await completeVesselMaintenance(vessel.id, newStatus);
      if (res?.success) {
        // Hapus kapal dari list maintenance (optimistic)
        onComplete(vessel.id);
      } else {
        alert(`Gagal mengubah status: ${res?.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`System error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`vessel-card ${completed ? "completed" : ""}`}>
      <div className="vessel-row">
        <div>
          <div className="vessel-id">{vessel.id}</div>
          <div className="vessel-dest">→ {vessel.destination} {vessel.eta && vessel.eta !== "--" ? `· ETA ${vessel.eta}` : ""}</div>
        </div>
        <span className={`status-tag ${completed ? "completed" : ""}`}>
          {completed ? "READY" : "MAINTENANCE"}
        </span>
      </div>

      <div className="progress-wrap">
        <div className="progress-track">
          <div
            className={`progress-fill ${completed ? "done" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="progress-meta">
          <span>{completed ? "MAINTENANCE COMPLETE — PILIH STATUS BARU:" : `MAINTENANCE IN PROGRESS... ${remaining}s remaining`}</span>
          <span className={`progress-pct ${completed ? "done" : ""}`}>{pct}%</span>
        </div>
      </div>

      {completed && (
        <div className="choice-row">
          <button
            className="choice-btn"
            onClick={() => chooseNewStatus("EN ROUTE")}
            disabled={submitting}
          >
            ▶ EN ROUTE
          </button>
          <button
            className="choice-btn port"
            onClick={() => chooseNewStatus("IN PORT")}
            disabled={submitting}
          >
            ⚓ IN PORT
          </button>
          <button
            className="choice-btn home"
            onClick={() => chooseNewStatus("HOME PORT")}
            disabled={submitting}
          >
            ⌂ HOME PORT
          </button>
        </div>
      )}
    </div>
  );
}

 