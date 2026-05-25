"use client";

import { lazy, Suspense, useEffect, useState, useRef } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";
import SuspensePanelLoader from "../ui/suspense-panel-loader";
import { createVessel, updateVessel, deleteVessel } from "./actions";

const FleetActiveTable = lazy(() => import("./fleet-active-table"));

interface FleetPageClientProps {
  dbVessels: Array<{ id: string; dest: string; status: string; st: string; eta: string; mon: string }>;
}

export default function FleetPageClient({ dbVessels }: FleetPageClientProps) {
  const [time, setTime] = useState("");
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const createModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const meridiem = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes}:${seconds} ${meridiem}`);
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createVessel(formData);
    if (res.success) { createModalRef.current?.close(); (e.target as HTMLFormElement).reset(); }
    else { alert(res.error); }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await updateVessel(formData);
    if (res.success) { editModalRef.current?.close(); setSelectedVessel(null); }
    else { alert(res.error); }
  }

  async function handleDelete(id: string) {
    if (confirm(`Apakah Anda yakin ingin menghapus vessel ${id}?`)) {
      const res = await deleteVessel(id);
      if (!res.success) { alert(res.error); }
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#050505;color:#e5e7eb;font-family:'Rajdhani',sans-serif}
        .main-container{padding:24px; max-width:1600px; margin:0 auto}
        .header-flex{display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; flex-wrap:wrap; gap:16px}
        .title-h1{font-family:'Orbitron',sans-serif; font-size:30px; font-weight:800; letter-spacing:0.05em; color:#fff; text-shadow:0 0 20px rgba(34,211,238,0.12)}
        .grid-layout{display:grid; grid-template-columns: minmax(0,1fr) 300px; gap:20px}
        .panel-v2{background:linear-gradient(180deg, rgba(15,15,26,0.95), rgba(8,8,15,0.95)); border:1px solid rgba(255,255,255,0.05); border-radius:10px; overflow:hidden}
        .panel-label{font-family:'Share Tech Mono',monospace; font-size:10px; color:#4b5563; letter-spacing:0.2em; padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.04)}

        .dist-container{display:flex; gap:10px; padding:20px; align-items:flex-end; height:180px}
        .dist-bar{flex:1; border-radius:3px; position:relative; min-width:40px}
        .dist-label{position:absolute; bottom:-22px; left:0; font-family:'Share Tech Mono',monospace; font-size:8px; color:#6b7280; white-space:nowrap}

        .alert-card{margin:15px; padding:18px; background:rgba(248,113,113,0.06); border-left:3px solid #f87171; border-radius:0 6px 6px 0}
        .fuel-viz{height:220px; display:flex; align-items:flex-end; gap:6px; padding:20px}
        .fuel-bar-v2{flex:1; border-radius:2px; min-width:12px}

        .btn-cyber { font-family: 'Share Tech Mono', monospace; font-size: 11px; background: transparent; color: #22d3ee; border: 1px solid rgba(34,211,238,0.3); padding: 6px 14px; cursor: pointer; letter-spacing: 0.1em; transition: all 0.2s ease; border-radius: 5px; }
        .btn-cyber:hover { background: rgba(34,211,238,0.12); box-shadow: 0 0 10px rgba(34,211,238,0.15); }
        .cyber-modal { background: #0a0a10; border: 1px solid rgba(34,211,238,0.3); color: #fff; padding: 28px; margin: auto; max-width: 420px; width: 100%; border-radius: 8px; box-shadow: 0 0 40px rgba(0,0,0,0.8); }
        .cyber-modal::backdrop { background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); }
        .form-title { font-family: 'Orbitron', sans-serif; font-size: 14px; letter-spacing: 0.1em; color: #22d3ee; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 10px; }
        .cyber-group { margin-bottom: 18px; }
        .cyber-group label { display: block; font-family: 'Share Tech Mono', monospace; font-size: 10px; color: #6b7280; margin-bottom: 6px; letter-spacing: 0.08em; text-transform: uppercase; }
        .cyber-input { width: 100%; background: #111; border: 1px solid rgba(255,255,255,0.08); color: #fff; padding: 9px 14px; font-size: 13px; font-family: 'Rajdhani', sans-serif; border-radius: 4px; outline: none; }
        .cyber-input:focus { border-color: #22d3ee; box-shadow: 0 0 8px rgba(34,211,238,0.15); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }

        @media (max-width: 1100px) { .grid-layout{grid-template-columns:1fr} }
      `}</style>

      <PrimeTopbar />

      <div className="main-container">
        <div className="header-flex">
          <div>
            <h1 className="title-h1">FLEET OVERVIEW</h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6, fontFamily: "'Rajdhani', sans-serif" }}>Logistik global dan pelacakan armada kapal secara real-time</p>
          </div>
          <div style={{ textAlign: "right", fontFamily: "'Share Tech Mono',monospace" }}>
            <div style={{ color: "#22d3ee", fontSize: 10, letterSpacing: "0.1em" }}>SYSTEM STATUS: NOMINAL</div>
            <div style={{ color: "#4b5563", fontSize: 9, marginTop: 5 }}>Last Updated: {time}</div>
          </div>
        </div>

        <div className="grid-layout">
          <div>
            <Suspense fallback={<SuspensePanelLoader rows={4} title="Loading active fleet telemetry..." />}>
              <FleetActiveTable
                dbVessels={dbVessels}
                onOpenCreate={() => createModalRef.current?.showModal()}
                onOpenEdit={(vessel) => { setSelectedVessel(vessel); editModalRef.current?.showModal(); }}
                onDelete={handleDelete}
              />
            </Suspense>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16, marginTop: 20 }}>
              <div className="panel-v2" style={{ padding: 20 }}>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 9, color: "#6b7280", marginBottom: 16, letterSpacing: "0.12em" }}>LOGISTICS EFFICIENCY</div>
                {[{ label: "CARGO UTILIZATION", pct: "92.4%", width: "92.4%", color: "#22d3ee" }, { label: "ROUTE OPTIMIZATION", pct: "87.1%", width: "87.1%", color: "#a855f7" }].map((item) => (
                  <div key={item.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 8, fontFamily: "'Share Tech Mono', monospace" }}>
                      <span style={{ color: "#9ca3af" }}>{item.label}</span>
                      <span style={{ color: item.color }}>{item.pct}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ width: item.width, height: "100%", background: item.color, borderRadius: 10, boxShadow: `0 0 8px ${item.color}55` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel-v2">
                <div className="panel-label">REGIONAL DISTRIBUTION</div>
                <div className="dist-container">
                  {[{ h: "70%", w: 2, bg: "#22d3ee", label: "SINGAPORE 28%" }, { h: "40%", w: 1.5, bg: "#a855f7", label: "BELANDA 18%" }, { h: "60%", w: 2, bg: "#22d3ee", label: "MALAYSIA 15%" }, { h: "35%", w: 1.2, bg: "#a855f7", label: "NUGINI 10%" }].map((bar) => (
                    <div key={bar.label} className="dist-bar" style={{ height: bar.h, background: bar.bg, flex: bar.w, boxShadow: `0 0 12px ${bar.bg}33` }}><span className="dist-label">{bar.label}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="panel-v2" style={{ marginBottom: 20 }}>
              <div className="panel-label">CRITICAL ALERTS</div>
              <div className="alert-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#f87171", fontWeight: 700, fontSize: 10, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.08em" }}>WEATHER WARNING</span>
                  <span style={{ color: "#4b5563", fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}>12m ago</span>
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>Tropical depression identified in Sector 7-B. Rerouting recommended for PL-4822.</p>
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 10, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.08em" }}>ENGINE ISSUE</span>
                  <span style={{ color: "#4b5563", fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}>45m ago</span>
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>Fuel pressure drop detected in Port Engine #2 on PL-9011.</p>
              </div>
            </div>

            <div className="panel-v2">
              <div className="panel-label">FUEL CONSUMPTION</div>
              <div className="fuel-viz">
                {[{ h: "40%", bg: "#f87171" }, { h: "55%", bg: "#f472b6" }, { h: "35%", bg: "#a855f7" }, { h: "80%", bg: "#22d3ee" }, { h: "95%", bg: "#22d3ee" }, { h: "65%", bg: "#a855f7" }, { h: "50%", bg: "#f87171" }].map((bar, i) => (
                  <div key={i} className="fuel-bar-v2" style={{ height: bar.h, background: bar.bg, boxShadow: `0 0 8px ${bar.bg}44` }} />
                ))}
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 9, color: "#6b7280" }}>Aggregate Fuel Level</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#e5e7eb" }}>12.4K Liters</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, color: "#6b7280" }}>Consumption Variance</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#22d3ee" }}>+2.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <dialog ref={createModalRef} className="cyber-modal">
        <div className="form-title">// REGISTER NEW VESSEL</div>
        <form onSubmit={handleCreateSubmit}>
          <div className="cyber-group"><label>VESSEL SERIAL ID</label><input name="id" placeholder="e.g. PL-102-MARS" className="cyber-input" required /></div>
          <div className="cyber-group"><label>DESTINATION HUB</label><input name="destination" placeholder="e.g. Singapore Harbor" className="cyber-input" required /></div>
          <div className="cyber-group"><label>TELEMETRY STATUS</label><select name="status" className="cyber-input"><option value="EN ROUTE">EN ROUTE</option><option value="DELAYED">DELAYED</option><option value="IN PORT">IN PORT</option><option value="MAINTENANCE">MAINTENANCE</option></select></div>
          <div className="cyber-group"><label>ESTIMATED TIME ARRIVAL (ETA)</label><input name="eta" placeholder="e.g. 26 OCT 09:00" className="cyber-input" /></div>
          <div className="cyber-group"><label>MONITORING ICON</label><select name="monitoring_icon" className="cyber-input"><option value="chart">CHART</option><option value="warn">WARN</option><option value="wrench">WRENCH</option><option value="anchor">ANCHOR</option></select></div>
          <div className="modal-actions">
            <button type="button" className="btn-cyber" style={{ borderColor: '#f87171', color: '#f87171' }} onClick={() => createModalRef.current?.close()}>CANCEL</button>
            <button type="submit" className="btn-cyber">SUBMIT TELEMETRY</button>
          </div>
        </form>
      </dialog>

      <dialog ref={editModalRef} className="cyber-modal">
        <div className="form-title">// UPDATE TELEMETRY: {selectedVessel?.id}</div>
        <form onSubmit={handleEditSubmit}>
          <input type="hidden" name="id" value={selectedVessel?.id || ""} />
          <div className="cyber-group"><label>DESTINATION HUB</label><input name="destination" defaultValue={selectedVessel?.dest || ""} className="cyber-input" required /></div>
          <div className="cyber-group"><label>TELEMETRY STATUS</label><select name="status" defaultValue={selectedVessel?.status || "EN ROUTE"} className="cyber-input"><option value="EN ROUTE">EN ROUTE</option><option value="DELAYED">DELAYED</option><option value="IN PORT">IN PORT</option><option value="MAINTENANCE">MAINTENANCE</option></select></div>
          <div className="cyber-group"><label>ESTIMATED TIME ARRIVAL (ETA)</label><input name="eta" defaultValue={selectedVessel?.eta || ""} className="cyber-input" /></div>
          <div className="cyber-group"><label>MONITORING ICON</label><select name="monitoring_icon" defaultValue={selectedVessel?.mon || "chart"} className="cyber-input"><option value="chart">CHART</option><option value="warn">WARN</option><option value="wrench">WRENCH</option><option value="anchor">ANCHOR</option></select></div>
          <div className="modal-actions">
            <button type="button" className="btn-cyber" style={{ borderColor: '#4b5563', color: '#4b5563' }} onClick={() => { editModalRef.current?.close(); setSelectedVessel(null); }}>CANCEL</button>
            <button type="submit" className="btn-cyber" style={{ borderColor: '#a855f7', color: '#a855f7' }}>APPLY UPGRADE</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
