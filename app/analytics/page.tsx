"use client";
import { useState, useEffect } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";

// Data disesuaikan dengan visual Figma
const fuelData = [
  { c: "#f87171", h: 45, l: "MERCURIUS" },
  { c: "#c084fc", h: 65, l: "ORION" },
  { c: "#f87171", h: 50, l: "SATURNUS" },
  { c: "#22d3ee", h: 85, l: "MARS" },
  { c: "#22d3ee", h: 95, l: "JUPITER" },
  { c: "#c084fc", h: 70, l: "BUMI" },
  { c: "#f87171", h: 55, l: "MOON" }
];

const vessels3 = [
  { id: "PL-4822", name: "Bumi", cap: 94, color: "#a855f7" },
  { id: "PL-9011", name: "Moon", cap: 78, color: "#22d3ee" },
  { id: "PL-3310", name: "Mars", cap: 42, color: "#f87171" }
];

export default function AnalyticsPage() {
  const [time, setTime] = useState("");

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');
        
        body { background: #050505; color: #e5e7eb; font-family: 'Rajdhani', sans-serif; margin: 0; }
        .main-container { padding: 30px 40px; max-width: 1600px; margin: 0 auto; }
        
        .grid-layout { display: grid; grid-template-columns: 1fr 400px; gap: 30px; margin-top: 30px; }
        .left-col { display: flex; flex-direction: column; gap: 30px; }
        .right-col { display: flex; flex-direction: column; gap: 30px; }

        /* Panel Base */
        .panel-v3 { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.03); border-radius: 4px; padding: 24px; }
        
        /* KPI Cards Section */
        .kpi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .kpi-card { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.03); border-radius: 4px; padding: 20px; position: relative; }
        .kpi-label { font-family: 'Share Tech Mono', monospace; font-size: 8px; color: #4b5563; letter-spacing: 0.1em; margin-bottom: 10px; text-transform: uppercase; }
        .kpi-val { font-family: 'Orbitron', sans-serif; font-size: 36px; font-weight: 800; }
        .kpi-sub { font-family: 'Share Tech Mono', monospace; font-size: 9px; margin-top: 10px; }
        .kpi-icon-box { position: absolute; top: 20px; right: 20px; color: #4b5563; }

        /* Bahan Bakar Chart */
        .fuel-chart-wrap { display: flex; align-items: flex-end; gap: 10px; height: 180px; margin-top: 30px; border-bottom: 1px solid #111; padding-bottom: 10px; }
        .fuel-bar { flex: 1; border-radius: 2px 2px 0 0; position: relative; }
        .fuel-bar-label { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-family: 'Share Tech Mono', monospace; font-size: 7px; color: #374151; }

        /* Location Row */
        .loc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .loc-card { background: #0d0d0d; padding: 15px; border-radius: 4px; }
        .loc-id { font-family: 'Orbitron', sans-serif; font-size: 10px; color: #a855f7; margin-bottom: 8px; }

        /* Donut Chart */
        .donut-container { display: flex; align-items: center; justify-content: space-around; padding: 20px 0; }
        .donut-stats { display: flex; gap: 30px; text-align: center; }
        .donut-num { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 700; }
        .donut-label { font-family: 'Share Tech Mono', monospace; font-size: 7px; color: #4b5563; margin-top: 4px; }
      `}</style>

      <PrimeTopbar />

      <div className="main-container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontFamily: "'Orbitron'", fontSize: 28, fontWeight: 800, margin: 0 }}>Analytics</h1>
            <p style={{ color: "#4b5563", fontSize: 13, marginTop: 5 }}>Surveilans data real-time untuk armada PrimeLog.</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#22d3ee", fontFamily: "'Share Tech Mono'", fontSize: 10 }}>SYSTEM OPERATIONAL</div>
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
                <div className="kpi-val">88.2 <span style={{ fontSize: 16, color: "#4b5563" }}>%</span></div>
                <div className="kpi-sub" style={{ color: "#22d3ee" }}>◉ SUCCESS DELIVERY</div>
                <div className="kpi-icon-box"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
              </div>
              <div className="kpi-card" style={{ borderLeft: "3px solid #22d3ee" }}>
                <div className="kpi-label">AVG ETA ACCURACY</div>
                <div className="kpi-val">92 <span style={{ fontSize: 16, color: "#4b5563" }}>%</span></div>
                <div className="kpi-sub" style={{ color: "#f87171" }}>↑ +2.4% MOM</div>
                <div className="kpi-icon-box"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
              </div>
            </div>

            {/* Bahan Bakar Section */}
            <div className="panel-v3">
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 600 }}>Bahan Bakar</div>
              <div className="fuel-chart-wrap">
                {fuelData.map((f, i) => (
                  <div key={i} className="fuel-bar" style={{ height: `${f.h}%`, background: f.c }}>
                    <div className="fuel-bar-label">{f.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lokasi Terakhir */}
            <div className="panel-v3">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 600 }}>LOKASI TERAKHIR</div>
                <div style={{ color: "#a855f7", fontSize: 9, fontFamily: "'Share Tech Mono'" }}>◉ LIVE FEED</div>
              </div>
              <div className="loc-grid">
                {vessels3.map((v, i) => (
                  <div className="loc-card" key={i}>
                    <div className="loc-id">{v.id} {v.name}</div>
                    <div style={{ fontSize: 8, color: "#4b5563", fontFamily: "'Share Tech Mono'" }}>COORDINATES</div>
                    <div style={{ fontSize: 9, color: "#e5e7eb", fontFamily: "'Share Tech Mono'", marginBottom: 8 }}>1.2902° N, 103.6519° E</div>
                    <div style={{ fontSize: 8, color: "#4b5563", fontFamily: "'Share Tech Mono'" }}>REGION</div>
                    <div style={{ fontSize: 9, color: "#e5e7eb", fontFamily: "'Share Tech Mono'" }}>Selat Singapura</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sisi Kanan */}
          <div className="right-col">
            {/* Kapasitas Kargo */}
            <div className="panel-v3">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>KAPASITAS KARGO PER KAPAL</div>
                <div style={{ fontSize: 8, color: "#4b5563" }}>AUDIT LOG ↗</div>
              </div>
              {vessels3.map((v, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8 }}>
                    <span><span style={{ color: v.color, marginRight: 8 }}>■</span> {v.name}</span>
                    <span style={{ color: v.color, fontWeight: 700 }}>{v.cap}% Capacity</span>
                  </div>
                  <div style={{ height: 6, background: "#111", borderRadius: 3 }}>
                    <div style={{ width: `${v.cap}%`, height: "100%", background: v.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Operational Status */}
            <div className="panel-v3">
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, marginBottom: 25 }}>Operational Status</div>
              <div className="donut-container">
                <div style={{ position: "relative", width: 100, height: 100 }}>
                  <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#111" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="10" strokeDasharray="188 251" strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>75%</div>
                    <div style={{ fontSize: 6, color: "#4b5563" }}>DALAM PERJALANAN</div>
                  </div>
                </div>
              </div>
              <div className="donut-stats">
                <div>
                  <div className="donut-num">3</div>
                  <div className="donut-label">DI PELABUHAN</div>
                </div>
                <div>
                  <div className="donut-num" style={{ color: "#f87171" }}>7</div>
                  <div className="donut-label">PEMELIHARAAN</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
