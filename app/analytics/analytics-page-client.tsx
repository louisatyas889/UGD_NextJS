"use client";
import { useState, useEffect } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";
// 👍 Menggunakan relative path agar aman dari error alias path Next.js
import { useFleet } from "../context/FleetContext"; 

interface DbVessel {
  id: string;
  destination: string;
  status: string;
  status_color: string;
  eta: string;
  progress_pct?: number; 
}

interface AnalyticsPageClientProps {
  dbVessels: DbVessel[];
}

export default function AnalyticsPageClient({ dbVessels }: AnalyticsPageClientProps) {
  const [time, setTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ambil state global dari FleetContext
  const { vesselEnergy, initializeFleet } = useFleet();

  // 1. Efek Jam Digital Standard
  useEffect(() => {
    const t = () => {
      const n = new Date();
      let h = n.getHours();
      const m = String(n.getMinutes()).padStart(2, "0");
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h}:${m} ${ap}`);
    };
    t();
    const id = setInterval(t, 1000);
    return () => clearInterval(id);
  }, []);

  // 2. Hubungkan data database armada ke Global Simulator saat halaman terbuka
  useEffect(() => {
    if (dbVessels && dbVessels.length > 0) {
      initializeFleet(dbVessels);
    }
  }, [dbVessels, initializeFleet]);

  // ==========================================
  // 🔍 WIRE UP FILTER: SARING DATA BERDASARKAN KEYWORD
  // ==========================================
  const filteredVessels = dbVessels.filter((v) => {
    const query = searchQuery.toLowerCase();
    return (
      v.id?.toLowerCase().includes(query) ||
      v.destination?.toLowerCase().includes(query) ||
      v.status?.toLowerCase().includes(query)
    );
  });

  // ==========================================
  // 🔥 BRAIN CENTER: HITUNG DATA LIVE RIIL
  // ==========================================
  const globalTotal = dbVessels.length;
  const globalPortCount = dbVessels.filter(v => {
    const s = v.status?.toLowerCase() || "";
    return s.includes("port") || s.includes("docked") || s.includes("load");
  }).length;

  const dynamicArrivalRate = globalTotal > 0 
    ? Math.round(((globalTotal - globalPortCount) / globalTotal) * 100) 
    : 100;

  const totalUnits = filteredVessels.length;
  
  const enRouteCount = filteredVessels.filter(v => {
    const s = v.status?.toLowerCase() || "";
    return s.includes("route") || s.includes("transit") || s.includes("depart") || s.includes("storm") || s.includes("approach");
  }).length;

  const portCount = filteredVessels.filter(v => {
    const s = v.status?.toLowerCase() || "";
    return s.includes("port") || s.includes("docked") || s.includes("load");
  }).length;

  const maintenanceCount = filteredVessels.filter(v => {
    const s = v.status?.toLowerCase() || "";
    return s.includes("maintenance") || s.includes("repair") || s.includes("delay");
  }).length;

  const enRoutePercentage = totalUnits > 0 ? Math.round((enRouteCount / totalUnits) * 100) : 0;
  
  // ✅ DEFINISI STROKEDASHARRAY (Memperbaiki error 'strokeDasharray is not defined')
  const strokeDashOffset = totalUnits > 0 ? (enRoutePercentage / 100) * 251 : 0;
  const strokeDasharray = `${strokeDashOffset} 251`;

  // Map data energi dari global state ke chart visual
  const fuelData = filteredVessels.map(v => ({
    c: v.status_color || "#22d3ee",
    h: vesselEnergy[v.id] !== undefined ? vesselEnergy[v.id] : (v.progress_pct !== undefined ? v.progress_pct : 100), 
    l: v.id
  }));

  const topVessels = filteredVessels.slice(0, 3).map((v) => {
    const s = v.status?.toLowerCase() || "";
    const isEnRoute = s.includes("route") || s.includes("transit") || s.includes("depart") || s.includes("storm") || s.includes("approach");
    
    let cargoCapacity = isEnRoute ? 98 : 0; 

    return {
      id: v.id,
      name: v.destination || "UNKNOWN OCEAN",
      cap: cargoCapacity,
      color: v.status_color || "#22d3ee"
    };
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');
        
        body { background: #050505; color: #e5e7eb; font-family: 'Rajdhani', sans-serif; margin: 0; }
        .main-container { padding: 30px 40px; max-width: 1600px; margin: 0 auto; }
        
        .grid-layout { display: grid; grid-template-columns: 1fr 400px; gap: 30px; margin-top: 30px; }
        .left-col { display: flex; flex-direction: column; gap: 30px; }
        .right-col { display: flex; flex-direction: column; gap: 30px; }

        .panel-v3 { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.03); border-radius: 4px; padding: 24px; }
        
        .kpi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .kpi-card { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.03); border-radius: 4px; padding: 20px; position: relative; }
        .kpi-label { font-family: 'Share Tech Mono', monospace; font-size: 8px; color: #4b5563; letter-spacing: 0.1em; margin-bottom: 10px; text-transform: uppercase; }
        .kpi-val { font-family: 'Orbitron', sans-serif; font-size: 36px; font-weight: 800; }
        .kpi-sub { font-family: 'Share Tech Mono', monospace; font-size: 9px; margin-top: 10px; }
        .kpi-icon-box { position: absolute; top: 20px; right: 20px; color: #4b5563; }

        .fuel-chart-wrap { display: flex; align-items: flex-end; justify-content: flex-start; gap: 25px; height: 180px; margin-top: 30px; border-bottom: 1px solid #111; padding-bottom: 25px; padding-top: 25px; overflow-x: auto; }
        
        .fuel-bar { width: 55px; min-width: 55px; border-radius: 2px 2px 0 0; position: relative; transition: height 0.5s ease-in-out; }
        .fuel-bar-label { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-family: 'Share Tech Mono', monospace; font-size: 9px; color: #777; white-space: nowrap; }

        .loc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 15px; }
        .loc-card { background: #0d0d0d; padding: 15px; border-radius: 4px; border-left: 2px solid rgba(255,255,255,0.05); }
        .loc-id { font-family: 'Orbitron', sans-serif; font-size: 10px; color: #a855f7; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .donut-container { display: flex; align-items: center; justify-content: space-around; padding: 20px 0; }
        .donut-stats { display: flex; gap: 30px; text-align: center; justify-content: center; margin-top: 10px; }
        .donut-num { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 700; }
        .donut-label { font-family: 'Share Tech Mono', monospace; font-size: 7px; color: #4b5563; margin-top: 4px; }
      `}</style>

      <PrimeTopbar onSearch={(e: any) => setSearchQuery(e.target.value)} />

      <div className="main-container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontFamily: "'Orbitron'", fontSize: 28, fontWeight: 800, margin: 0 }}>Analytics</h1>
            <p style={{ color: "#4b5563", fontSize: 13, marginTop: 5 }}>Surveilans data real-time untuk armada PrimeLog.</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#22d3ee", fontFamily: "'Share Tech Mono'", fontSize: 10 }}>MONITORED: {totalUnits} UNITS</div>
            <div style={{ fontFamily: "'Orbitron'", fontSize: 16, color: "#fff" }}>{time}</div>
          </div>
        </div>

        <div className="grid-layout">
          {/* Sisi Kiri */}
          <div className="left-col">
            {/* KPI Row */}
            <div className="kpi-row">
              <div className="kpi-card" style={{ borderLeft: "3px solid #a855f7" }}>
                <div className="kpi-label">CARGO ARRIVAL RATE</div>
                <div className="kpi-val">{dynamicArrivalRate} <span style={{ fontSize: 16, color: "#4b5563" }}>%</span></div>
                <div className="kpi-sub" style={{ color: "#22d3ee" }}>◉ GLOBAL LOGISTICS RATE</div>
                <div className="kpi-icon-box"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
              </div>
              <div className="kpi-card" style={{ borderLeft: "3px solid #22d3ee" }}>
                <div className="kpi-label">AVG ETA ACCURACY</div>
                <div className="kpi-val">92 <span style={{ fontSize: 16, color: "#4b5563" }}>%</span></div>
                <div className="kpi-sub" style={{ color: "#f87171" }}>↑ +2.4% MOM</div>
                <div className="kpi-icon-box"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
              </div>
            </div>

            {/* Core Energy Section */}
            <div className="panel-v3">
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 600 }}>Tingkat Energi Core Armada</div>
              <div className="fuel-chart-wrap">
                {fuelData.length > 0 ? (
                  fuelData.map((f, i) => (
                    <div key={i} className="fuel-bar" style={{ height: `${f.h}%`, background: f.c }}>
                      <div style={{
                        position: "absolute",
                        top: "-22px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "11px",
                        color: f.c,
                        fontWeight: "bold",
                        textShadow: "0 0 4px rgba(0,0,0,1)"
                      }}>
                        {f.h}%
                      </div>
                      <div className="fuel-bar-label">{f.l}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 11, color: "#4b5563", width: "100%", textAlign: "center", paddingBottom: 20 }}>NO SHIPS MATCHING SEARCH FILTER</div>
                )}
              </div>
            </div>

            {/* Lokasi Terakhir */}
            <div className="panel-v3">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 600 }}>MONITORING DESTINASI TERKINI</div>
                <div style={{ color: "#a855f7", fontSize: 9, fontFamily: "'Share Tech Mono'" }}>◉ LIVE FEED FROM NEON</div>
              </div>
              <div className="loc-grid">
                {topVessels.length > 0 ? (
                  topVessels.map((v, i) => (
                    <div className="loc-card" key={i} style={{ borderLeftColor: v.color }}>
                      <div className="loc-id" style={{ color: v.color }}>{v.id}</div>
                      <div style={{ fontSize: 8, color: "#4b5563", fontFamily: "'Share Tech Mono'" }}>TRACKING ETA</div>
                      <div style={{ fontSize: 9, color: "#e5e7eb", fontFamily: "'Share Tech Mono'", marginBottom: 8 }}>ETA LOCK ACTIVE</div>
                      <div style={{ fontSize: 8, color: "#4b5563", fontFamily: "'Share Tech Mono'" }}>DESTINATION</div>
                      <div style={{ fontSize: 9, color: "#e5e7eb", fontFamily: "'Share Tech Mono'", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {v.name}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 11, color: "#4b5563" }}>NO UNITS FOUND</div>
                )}
              </div>
            </div>
          </div>

          {/* Sisi Kanan */}
          <div className="right-col">
            <div className="panel-v3">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px" }}>KAPASITAS KARGO TERKINI</div>
                <div style={{ fontSize: 8, color: "#4b5563" }}>AUDIT LOG ↗</div>
              </div>
              {topVessels.length > 0 ? (
                topVessels.map((v, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8 }}>
                      <span><span style={{ color: v.color, marginRight: 8 }}>■</span> {v.id}</span>
                      <span style={{ color: v.color, fontWeight: 700 }}>{v.cap}% Capacity</span>
                    </div>
                    <div style={{ height: 6, background: "#111", borderRadius: 3 }}>
                      <div style={{ width: `${v.cap}%`, height: "100%", background: v.color, borderRadius: 3, transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 11, color: "#4b5563" }}>NO TRANSPONDERS MATCHED</div>
              )}
            </div>

            <div className="panel-v3">
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, marginBottom: 25 }}>Operational Status</div>
              <div className="donut-container">
                <div style={{ position: "relative", width: 100, height: 100 }}>
                  <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#111" strokeWidth="10" />
                    {totalUnits > 0 && (
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="#22d3ee" 
                        strokeWidth="10" 
                        strokeDasharray={strokeDasharray} 
                        strokeLinecap="round" 
                        style={{ transition: "stroke-dasharray 0.5s ease" }}
                      />
                    )}
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", width: "100%" }}>
                    <div style={{ fontSize: 18, fontFamily: "'Orbitron'", fontWeight: 800 }}>{enRoutePercentage}%</div>
                    <div style={{ fontSize: 6, color: "#4b5563", letterSpacing: "0.5px" }}>EN ROUTE</div>
                  </div>
                </div>
              </div>
              <div className="donut-stats">
                <div>
                  <div className="donut-num" style={{ color: "#10b981" }}>{portCount}</div>
                  <div className="donut-label">IN PORT</div>
                </div>
                <div>
                  <div className="donut-num" style={{ color: "#f87171" }}>{maintenanceCount}</div>
                  <div className="donut-label">MAINTENANCE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
