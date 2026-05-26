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

export default function FleetPageClient({
  dbVessels,
}: FleetPageClientProps) {
  const [time, setTime] = useState("");
  const createModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const { vesselEnergy, initializeFleet } = useFleet();

  const [selectedVessel, setSelectedVessel] = useState<any>(null);

  // ==========================================
  // INITIALIZE GLOBAL ENERGY STATE
  // ==========================================
  useEffect(() => {
    if (dbVessels && dbVessels.length > 0) {
      initializeFleet(dbVessels);
    }
  }, [dbVessels, initializeFleet]);

  // ==========================================
  // LIVE CLOCK
  // ==========================================
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

  // ==========================================
  // CRUD HANDLER
  // ==========================================
  async function handleCreateSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const id = formData.get("id") as string;
    const dest = formData.get("destination") as string;

    if (!id?.trim() || !dest?.trim()) {
      alert("Error: ID dan Tujuan tidak boleh kosong.");
      return;
    }

    try {
      const res = await createVessel(formData);

      if (res?.success) {
        createModalRef.current?.close();
        (e.target as HTMLFormElement).reset();
      } else {
        alert(res?.error || "Gagal menambahkan kapal.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat menambah data.");
    }
  }

  async function handleEditSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const dest = formData.get("destination") as string;

    if (!dest?.trim()) {
      alert("Error: Tujuan tidak boleh kosong.");
      return;
    }

    try {
      const res = await updateVessel(formData);

      if (res?.success) {
        editModalRef.current?.close();
        editFormRef.current?.reset();
        setSelectedVessel(null);
      } else {
        alert(res?.error || "Gagal memperbarui kapal.");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem saat memperbarui data.");
    }
  }

  async function handleDelete(id: string) {
    if (!id) return;

    if (
      confirm(
        `Apakah Anda yakin ingin menghapus sistem telemetri kapal ${id}?`
      )
    ) {
      try {
        const res = await deleteVessel(id);

        if (!res?.success) {
          alert(res?.error || "Gagal menghapus kapal.");
        }
      } catch (err) {
        alert("Terjadi kesalahan sistem saat menghapus data.");
      }
    }
  }

  const handleCancelEdit = () => {
    editFormRef.current?.reset();
    editModalRef.current?.close();
    setSelectedVessel(null);
  };

  // ==========================================
  // SINKRONISASI GRAFIK DENGAN GLOBAL ENERGY
  // ==========================================
  const fuelFleetData = dbVessels
    .filter((v) => v.id && v.id !== "NNN")
    .map((v) => {
      const currentEnergy =
        vesselEnergy[v.id] !== undefined
          ? vesselEnergy[v.id]
          : v.progress;

      let cleanName = v.id.toUpperCase();

      if (cleanName.startsWith("V-")) {
        cleanName = cleanName.replace("V-", "").trim();
      } else if (cleanName.startsWith("PL-")) {
        cleanName = cleanName.replace("PL-", "").trim();
      }

      return {
        id: v.id,
        cleanName,
        color: v.st || "#22d3ee",
        percentage: Math.round(currentEnergy),
      };
    });

  // ==========================================
  // AVG FUEL
  // ==========================================
  const totalFuelAggregate =
    fuelFleetData.length > 0
      ? (
          fuelFleetData.reduce(
            (acc, v) => acc + v.percentage,
            0
          ) / fuelFleetData.length
        ).toFixed(1)
      : "0";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');

        *,*::before,*::after{
          box-sizing:border-box;
          margin:0;
          padding:0
        }

        body{
          background:#050505;
          color:#e5e7eb;
          font-family:'Rajdhani',sans-serif
        }

        .main-container{
          padding:24px;
          max-width:1600px;
          margin:0 auto
        }

        .header-flex{
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
          margin-bottom:30px
        }

        .title-h1{
          font-family:'Orbitron',sans-serif;
          font-size:28px;
          font-weight:800;
          letter-spacing:0.05em;
          color:#fff
        }

        .grid-layout{
          display:grid;
          grid-template-columns:1fr 340px;
          gap:24px
        }

        .panel-v2{
          background:#0a0a0a;
          border:1px solid rgba(255,255,255,0.03);
          border-radius:4px
        }

        .panel-label{
          font-family:'Share Tech Mono',monospace;
          font-size:10px;
          color:#4b5563;
          letter-spacing:0.2em;
          padding:16px 20px;
          border-bottom:1px solid rgba(255,255,255,0.03)
        }

        .table-wrap{
          padding:0 20px 20px
        }

        table{
          width:100%;
          border-collapse:collapse
        }

        th{
          font-family:'Share Tech Mono',monospace;
          font-size:9px;
          color:#374151;
          text-align:center;
          padding:20px 10px;
          font-weight:400;
          text-transform:uppercase
        }

        td{
          padding:25px 10px;
          text-align:center;
          vertical-align:middle;
          border-bottom:1px solid rgba(255,255,255,0.02)
        }

        .v-id{
          font-family:'Orbitron',sans-serif;
          font-size:13px;
          font-weight:600;
          color:#22d3ee;
          letter-spacing:0.05em
        }

        .v-dest{
          font-size:12px;
          color:#9ca3af;
          line-height:1.2
        }

        .pill{
          display:inline-block;
          padding:4px 15px;
          border-radius:20px;
          font-family:'Share Tech Mono',monospace;
          font-size:9px;
          border:1px solid
        }

        .enroute{
          color:#22d3ee;
          border-color:#22d3ee;
          background:rgba(34,211,238,0.05)
        }

        .delayed{
          color:#f87171;
          border-color:#f87171;
          background:rgba(248,113,113,0.05)
        }

        .inport{
          color:#9ca3af;
          border-color:#4b5563
        }

        .maint{
          color:#f472b6;
          border-color:#f472b6
        }

        .table-header-ctrl{
          display:flex;
          justify-content:flex-end;
          align-items:center;
          gap:12px;
          padding:15px 20px
        }

        .dist-container{
          display:flex;
          gap:10px;
          padding:20px;
          align-items:flex-end;
          height:180px
        }

        .dist-bar{
          flex:1;
          border-radius:2px;
          position:relative
        }

        .dist-label{
          position:absolute;
          bottom:-25px;
          left:0;
          font-family:'Share Tech Mono',monospace;
          font-size:8px;
          color:#4b5563;
          white-space:nowrap
        }

        .alert-card{
          margin:15px;
          padding:20px;
          background:rgba(248,113,113,0.05);
          border-left:3px solid #f87171
        }

        .fuel-chart-wrapper{
          width:100%;
          overflow-x:auto;
          padding-bottom:15px;
        }

        .fuel-chart-wrapper::-webkit-scrollbar{
          height:4px;
        }

        .fuel-chart-wrapper::-webkit-scrollbar-thumb{
          background:rgba(168,85,247,0.4);
          border-radius:10px;
        }

        .fuel-viz{
          height:240px;
          display:flex;
          align-items:flex-end;
          justify-content:flex-start;
          gap:16px;
          padding:35px 20px 40px;
          border-bottom:1px solid rgba(255,255,255,0.02);
          background:#0a0a0a;
          min-width:600px;
        }

        .fuel-bar-container{
          flex:1;
          min-width:48px;
          height:100%;
          display:flex;
          flex-direction:column;
          justify-content:flex-end;
          position:relative;
          background:rgba(255,255,255,0.02);
          border-radius:2px;
        }

        .fuel-bar-v2{
          width:100%;
          border-radius:2px 2px 0 0;
          position:relative;
          transition:height 0.5s cubic-bezier(0.4,0,0.2,1);
          box-shadow:0 0 15px rgba(34,211,238,0.2);
        }

        .fuel-pct-label{
          position:absolute;
          top:-22px;
          left:50%;
          transform:translateX(-50%);
          font-family:'Share Tech Mono',monospace;
          font-size:11px;
          font-weight:bold;
          letter-spacing:0.05em;
        }

        .fuel-name-label{
          position:absolute;
          bottom:-28px;
          left:50%;
          transform:translateX(-50%);
          font-family:'Share Tech Mono',monospace;
          font-size:9px;
          color:#6b7280;
          white-space:nowrap;
          text-align:center;
          letter-spacing:0.02em;
        }

        .btn-cyber{
          font-family:'Share Tech Mono',monospace;
          font-size:11px;
          background:transparent;
          color:#22d3ee;
          border:1px dashed #22d3ee;
          padding:6px 14px;
          cursor:pointer;
          letter-spacing:0.1em;
          transition:all 0.2s ease;
        }

        .btn-cyber:hover{
          background:rgba(34,211,238,0.1);
          box-shadow:0 0 10px rgba(34,211,238,0.2);
        }

        .cyber-modal{
          background:#0a0a0a;
          border:1px solid #22d3ee;
          color:#fff;
          padding:24px;
          margin:auto;
          max-width:400px;
          width:100%;
          box-shadow:0 0 30px rgba(0,0,0,0.8);
        }

        .cyber-modal::backdrop{
          background:rgba(0,0,0,0.7);
          backdrop-filter:blur(3px);
        }

        .form-title{
          font-family:'Orbitron',sans-serif;
          font-size:14px;
          letter-spacing:0.1em;
          color:#22d3ee;
          margin-bottom:20px;
          border-bottom:1px solid rgba(255,255,255,0.05);
          padding-bottom:8px;
        }

        .cyber-group{
          margin-bottom:16px;
        }

        .cyber-group label{
          display:block;
          font-family:'Share Tech Mono',monospace;
          font-size:10px;
          color:#4b5563;
          margin-bottom:6px;
          letter-spacing:0.05em;
        }

        .cyber-input{
          width:100%;
          background:#111;
          border:1px solid rgba(255,255,255,0.08);
          color:#fff;
          padding:8px 12px;
          font-size:13px;
          font-family:'Rajdhani',sans-serif;
        }

        .cyber-input:focus{
          outline:none;
          border-color:#22d3ee;
        }

        .modal-actions{
          display:flex;
          justify-content:flex-end;
          gap:12px;
          margin-top:24px;
        }
      `}</style>

      <PrimeTopbar />

      <div className="main-container">
        <div className="header-flex">
          <div>
            <h1 className="title-h1">FLEET OVERVIEW</h1>

            <p
              style={{
                fontSize: 13,
                color: "#4b5563",
                marginTop: 5,
              }}
            >
              Logistik global dan pelacakan kapal
            </p>
          </div>

          <div
            style={{
              textAlign: "right",
              fontFamily: "'Share Tech Mono',monospace",
            }}
          >
            <div
              style={{
                color: "#22d3ee",
                fontSize: 10,
                letterSpacing: "0.1em",
              }}
            >
              SYSTEM STATUS: NOMINAL
            </div>

            <div
              style={{
                color: "#374151",
                fontSize: 9,
                marginTop: 4,
              }}
            >
              Last Updated: {time}
            </div>
          </div>
        </div>

        <div className="grid-layout">
          <div className="left-side">
            <Suspense
              fallback={
                <SuspensePanelLoader
                  rows={4}
                  title="Loading active fleet telemetry..."
                />
              }
            >
              <FleetActiveTable
                dbVessels={dbVessels}
                onOpenCreate={() =>
                  createModalRef.current?.showModal()
                }
                onOpenEdit={(vessel) => {
                  setSelectedVessel(vessel);
                  editModalRef.current?.showModal();
                }}
                onDelete={handleDelete}
              />
            </Suspense>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr",
                gap: 20,
                marginTop: 24,
              }}
            >
              <div className="panel-v2" style={{ padding: 20 }}>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono'",
                    fontSize: 9,
                    color: "#4b5563",
                    marginBottom: 20,
                  }}
                >
                  LOGISTICS EFFICIENCY
                </div>

                <div style={{ marginBottom: 15 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      marginBottom: 8,
                    }}
                  >
                    <span>CARGO UTILIZATION</span>
                    <span style={{ color: "#22d3ee" }}>
                      92.4%
                    </span>
                  </div>

                  <div style={{ height: 4, background: "#111" }}>
                    <div
                      style={{
                        width: "92.4%",
                        height: "100%",
                        background: "#22d3ee",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      marginBottom: 8,
                    }}
                  >
                    <span>ROUTE OPTIMIZATION</span>
                    <span style={{ color: "#a855f7" }}>
                      87.1%
                    </span>
                  </div>

                  <div style={{ height: 4, background: "#111" }}>
                    <div
                      style={{
                        width: "87.1%",
                        height: "100%",
                        background: "#a855f7",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="panel-v2">
                <div className="panel-label">
                  REGIONAL DISTRIBUTION
                </div>

                <div className="dist-container">
                  <div
                    className="dist-bar"
                    style={{
                      height: "70%",
                      background: "#22d3ee",
                      flex: 2,
                    }}
                  >
                    <span className="dist-label">
                      BUMI - REG SINGAPORE - 28%
                    </span>
                  </div>

                  <div
                    className="dist-bar"
                    style={{
                      height: "40%",
                      background: "#a855f7",
                      flex: 1.5,
                    }}
                  >
                    <span className="dist-label">
                      MARS - REG BELANDA - 18%
                    </span>
                  </div>

                  <div
                    className="dist-bar"
                    style={{
                      height: "60%",
                      background: "#22d3ee",
                      flex: 2,
                    }}
                  >
                    <span className="dist-label">
                      MOON - REG MALAYSIA - 15%
                    </span>
                  </div>

                  <div
                    className="dist-bar"
                    style={{
                      height: "35%",
                      background: "#a855f7",
                      flex: 1.2,
                    }}
                  >
                    <span className="dist-label">
                      ORION - REG NUGINI - 10%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="right-side">
            <div
              className="panel-v2"
              style={{ marginBottom: 24 }}
            >
              <div className="panel-label">
                CRITICAL ALERTS
              </div>

              <div className="alert-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "#f87171",
                      fontWeight: 700,
                      fontSize: 10,
                    }}
                  >
                    WEATHER WARNING
                  </span>

                  <span
                    style={{
                      color: "#4b5563",
                      fontSize: 9,
                    }}
                  >
                    12m ago
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    lineHeight: 1.4,
                  }}
                >
                  Tropical depression identified in Sector
                  7-B. Rerouting recommended for PL-4822.
                </p>
              </div>

              <div style={{ padding: "0 20px 20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "#f59e0b",
                      fontWeight: 700,
                      fontSize: 10,
                    }}
                  >
                    ENGINE ISSUE
                  </span>

                  <span
                    style={{
                      color: "#4b5563",
                      fontSize: 9,
                    }}
                  >
                    45m ago
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    lineHeight: 1.4,
                  }}
                >
                  Fuel pressure drop detected in Port Engine
                  #2 on PL-9011.
                </p>
              </div>
            </div>

            {/* FUEL CHART */}
            <div className="panel-v2">
              <div className="panel-label">
                FUEL CONSUMPTION (BAHAN BAKAR)
              </div>

              <div className="fuel-chart-wrapper">
                <div className="fuel-viz">
                  {fuelFleetData.length > 0 ? (
                    fuelFleetData.map((v, i) => (
                      <div
                        className="fuel-bar-container"
                        key={i}
                      >
                        <span
                          className="fuel-pct-label"
                          style={{ color: v.color }}
                        >
                          {v.percentage}%
                        </span>

                        <div
                          className="fuel-bar-v2"
                          style={{
                            height: `${v.percentage}%`,
                            background: v.color,
                          }}
                        />

                        <span className="fuel-name-label">
                          {v.cleanName}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#4b5563",
                        paddingBottom: 20,
                        width: "100%",
                        textAlign: "center",
                      }}
                    >
                      NO TELEMETRY DATA
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  padding: 20,
                  borderTop:
                    "1px solid rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: "#4b5563",
                    }}
                  >
                    Avg Fleet Fuel Level
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    {totalFuelAggregate}%
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: "#4b5563",
                    }}
                  >
                    Consumption Status
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#22d3ee",
                    }}
                  >
                    ONLINE MONITORING
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      <dialog
        ref={createModalRef}
        className="cyber-modal"
      >
        <div className="form-title">
          // REGISTER NEW VESSEL
        </div>

        <form onSubmit={handleCreateSubmit}>
          <div className="cyber-group">
            <label>VESSEL SERIAL ID</label>

            <input
              name="id"
              placeholder="e.g. PL-102-MARS"
              className="cyber-input"
              required
            />
          </div>

          <div className="cyber-group">
            <label>DESTINATION HUB</label>

            <input
              name="destination"
              placeholder="e.g. Singapore Harbor"
              className="cyber-input"
              required
            />
          </div>

          <div className="cyber-group">
            <label>TELEMETRY STATUS</label>

            <select
              name="status"
              className="cyber-input"
              style={{ background: "#111" }}
            >
              <option value="EN ROUTE">
                EN ROUTE
              </option>

              <option value="DELAYED">
                DELAYED
              </option>

              <option value="IN PORT">
                IN PORT
              </option>

              <option value="MAINTENANCE">
                MAINTENANCE
              </option>
            </select>
          </div>

          <div className="cyber-group">
            <label>
              ESTIMATED TIME ARRIVAL (ETA)
            </label>

            <input
              name="eta"
              placeholder="e.g. 26 OCT 09:00"
              className="cyber-input"
            />
          </div>

          <div className="cyber-group">
            <label>MONITORING ICON</label>

            <select
              name="monitoring_icon"
              className="cyber-input"
              style={{ background: "#111" }}
            >
              <option value="chart">CHART</option>
              <option value="warn">WARN</option>
              <option value="wrench">
                WRENCH
              </option>
              <option value="anchor">
                ANCHOR
              </option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cyber"
              style={{
                borderColor: "#f87171",
                color: "#f87171",
              }}
              onClick={() =>
                createModalRef.current?.close()
              }
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="btn-cyber"
            >
              SUBMIT TELEMETRY
            </button>
          </div>
        </form>
      </dialog>

      {/* EDIT MODAL */}
      <dialog
        ref={editModalRef}
        className="cyber-modal"
      >
        <div className="form-title">
          // UPDATE TELEMETRY: {selectedVessel?.id}
        </div>

        <form
          ref={editFormRef}
          onSubmit={handleEditSubmit}
        >
          <input
            type="hidden"
            name="id"
            value={selectedVessel?.id || ""}
          />

          <div className="cyber-group">
            <label>DESTINATION HUB</label>

            <input
              name="destination"
              defaultValue={
                selectedVessel?.dest || ""
              }
              className="cyber-input"
              required
            />
          </div>

          <div className="cyber-group">
            <label>TELEMETRY STATUS</label>

            <select
              name="status"
              defaultValue={
                selectedVessel?.status ||
                "EN ROUTE"
              }
              className="cyber-input"
              style={{ background: "#111" }}
            >
              <option value="EN ROUTE">
                EN ROUTE
              </option>

              <option value="DELAYED">
                DELAYED
              </option>

              <option value="IN PORT">
                IN PORT
              </option>

              <option value="MAINTENANCE">
                MAINTENANCE
              </option>
            </select>
          </div>

          <div className="cyber-group">
            <label>
              ESTIMATED TIME ARRIVAL (ETA)
            </label>

            <input
              name="eta"
              defaultValue={
                selectedVessel?.eta || ""
              }
              className="cyber-input"
            />
          </div>

          <div className="cyber-group">
            <label>MONITORING ICON</label>

            <select
              name="monitoring_icon"
              defaultValue={
                selectedVessel?.mon || "chart"
              }
              className="cyber-input"
              style={{ background: "#111" }}
            >
              <option value="chart">CHART</option>
              <option value="warn">WARN</option>
              <option value="wrench">
                WRENCH
              </option>
              <option value="anchor">
                ANCHOR
              </option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cyber"
              style={{
                borderColor: "#4b5563",
                color: "#4b5563",
              }}
              onClick={handleCancelEdit}
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="btn-cyber"
              style={{
                borderColor: "#a855f7",
                color: "#a855f7",
              }}
            >
              APPLY UPGRADE
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
