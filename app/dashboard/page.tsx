"use client";
import { useState, useEffect, useRef } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";
import { vessels, alerts, fuel, telemetry } from "../lib/placeholder-data";

function MonIcon({t}:{t:string}) {
  if(t==="chart") return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
  if(t==="anchor") return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="22"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>;
  if(t==="warn") return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
}

export default function DashboardPage() {
  const [utc, setUtc] = useState("");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    const t = () => { const n=new Date(); setUtc(`${String(n.getUTCHours()).padStart(2,"0")}:${String(n.getUTCMinutes()).padStart(2,"0")}:${String(n.getUTCSeconds()).padStart(2,"0")} UTC`); };
    t(); const id=setInterval(t,1000); return ()=>clearInterval(id);
  }, []);

  // Inisialisasi Leaflet di dalam Map Kecil
  useEffect(() => {
    if (typeof window === "undefined" || leafletMap.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (!mapContainerRef.current || (window as any).L === undefined) return;
      const L = (window as any).L;

      const map = L.map(mapContainerRef.current, {
        center: [5, 110],
        zoom: 4,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);

      // Tambahkan marker kecil yang berdenyut (Pulse)
      const pulseIcon = L.divIcon({
        className: 'map-pulse-icon',
        html: `<div style="width:8px; height:8px; background:#22d3ee; border-radius:50%; box-shadow:0 0 10px #22d3ee; animation: blink 1.5s infinite"></div>`,
        iconSize: [8, 8]
      });

      L.marker([5, 110], { icon: pulseIcon }).addTo(map);
      L.marker([12, 100], { icon: pulseIcon }).addTo(map);

      leafletMap.current = map;
    };
    document.head.appendChild(script);
  }, []);

  const handleZoom = (type: "in" | "out") => {
    if (!leafletMap.current) return;
    if (type === "in") leafletMap.current.zoomIn();
    else leafletMap.current.zoomOut();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#0a0a10;color:#e5e7eb;font-family:'Rajdhani',sans-serif;min-height:100vh}
        .layout{display:grid;grid-template-columns:1fr 280px;gap:10px;padding:10px;background:#0a0a10;min-height:calc(100vh - 46px)}
        .left-col{display:flex;flex-direction:column;gap:10px;min-width:0}
        .panel{background:#0f0f1a;border:1px solid rgba(255,255,255,0.07);border-radius:4px;overflow:hidden}
        .ph{display:flex;align-items:center;justify-content:space-between;padding:12px 18px 10px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .pt{display:flex;align-items:center;gap:9px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.2em;color:#e5e7eb}
        .ptb{width:3px;height:14px;background:#a855f7;border-radius:2px;flex-shrink:0}
        .pts{font-family:'Share Tech Mono',monospace;font-size:8px;color:#4b5563;letter-spacing:0.12em}
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        th{font-family:'Share Tech Mono',monospace;font-size:8px;color:#4b5563;letter-spacing:0.2em;text-align:left;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:400;text-transform:uppercase;background:rgba(255,255,255,0.012);white-space:nowrap}
        th:nth-child(1){width:22%}th:nth-child(2){width:28%}th:nth-child(3){width:18%}th:nth-child(4){width:20%}th:nth-child(5){width:12%}
        td{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle}
        tbody tr:hover{background:rgba(168,85,247,0.04)}
        .vid{font-family:'Share Tech Mono',monospace;font-size:11px;color:#22d3ee;letter-spacing:0.05em}
        .sc{display:flex;align-items:center;gap:7px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.14em;white-space:nowrap}
        .sdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;animation:blink 2s ease-in-out infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .eta{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.05em}
        
        /* Map Section Perbaikan */
        .map-panel{flex:1;min-height:350px}
        .map-outer{display:flex;height:100%;min-height:350px}
        .map-wrap{position:relative; flex:1; background-color:#05050a; overflow: hidden;}
        #map-container { position: absolute; inset: 0; z-index: 1; }
        
        .map-card{position:absolute;top:14px;left:14px;background:rgba(8,5,22,0.85);border:1px solid rgba(168,85,247,0.45);border-radius:4px;padding:10px 16px;backdrop-filter:blur(8px);z-index:5}
        .map-card-label{font-family:'Share Tech Mono',monospace;font-size:7px;color:#a855f7;letter-spacing:0.28em;margin-bottom:4px}
        .map-card-count{font-family:'Orbitron',sans-serif;font-size:20px;font-weight:700;color:#fff}
        .map-card-sub{font-family:'Share Tech Mono',monospace;font-size:9px;color:#22d3ee}
        .map-ctrl-wrap{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:4px;z-index:10}
        .mc{width:26px;height:26px;background:rgba(10,10,20,0.9);border:1px solid rgba(255,255,255,0.2);border-radius:3px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#22d3ee;font-size:16px;transition:all 0.2s}
        .mc:hover{background:#a855f7;color:#fff;border-color:#fff}
        .map-tele{width:180px;flex-shrink:0;background:rgba(9,9,20,0.9);border-left:1px solid rgba(255,255,255,0.07);padding:14px}
        .tt{font-family:'Share Tech Mono',monospace;font-size:8px;color:#22d3ee;letter-spacing:0.2em;margin-bottom:12px}
        .tr{display:flex;justify-content:space-between;margin-bottom:8px}
        .tk{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6b7280}
        .tv{font-family:'Share Tech Mono',monospace;font-size:10px;color:#e5e7eb}

        /* Fuel Section */
        .fuel-panel{flex:1; display:flex; flex-direction:column; min-height:200px}
        .fca{flex:1; padding:20px 14px; display:flex; flex-direction:column; justify-content:flex-end}
        .brow{display:flex; align-items:flex-end; gap:8px; height:100px; width:100%}
        .bc{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%}
        .bf{width:100%; border-radius:2px 2px 0 0; transition: height 0.3s ease}
        .bl{margin-top:8px; font-family:'Share Tech Mono',monospace; font-size:7px; color:#4b5563; text-align:center}

        .right-col{display:flex;flex-direction:column;gap:10px}
        .ah{display:flex;align-items:center;justify-content:space-between;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .at{display:flex;align-items:center;gap:7px;font-family:'Share Tech Mono',monospace;font-size:10px;color:#e5e7eb;letter-spacing:0.18em}
        .ald{width:8px;height:8px;border-radius:50%;background:#f87171;box-shadow:0 0 7px #f87171;animation:blink 1s infinite}
        .ac{padding:10px 14px 12px;border-bottom:1px solid rgba(255,255,255,0.04)}
        .atype{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.16em;font-weight:600}
        .abody{font-family:'Rajdhani',sans-serif;font-size:12px;color:#9ca3af;line-height:1.4}
      `}</style>
      
      <PrimeTopbar/>
      
      <div className="layout">
        <div className="left-col">
          <div className="panel">
            <div className="ph">
              <div className="pt"><div className="ptb"/>FLEET OVERVIEW</div>
              <span className="pts">SYSTEM CLOCK: {utc}</span>
            </div>
            <table>
              <thead>
                <tr><th>ID KAPAL</th><th>TUJUAN</th><th>STATUS</th><th>ETA</th><th>MONITORING</th></tr>
              </thead>
              <tbody>
                {vessels.map(v=>(
                  <tr key={v.id}>
                    <td><span className="vid">{v.id}</span></td>
                    <td><span style={{fontSize:13,color:"#d1d5db",fontWeight:500}}>{v.dest}</span></td>
                    <td><div className="sc"><div className="sdot" style={{background:v.statusColor,boxShadow:`0 0 6px ${v.statusColor}`}}/><span style={{color:v.statusColor}}>{v.status}</span></div></td>
                    <td><span className="eta" style={{color:v.etaColor}}>{v.eta}</span></td>
                    <td><MonIcon t={v.mon}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel map-panel">
            <div className="map-outer">
              <div className="map-wrap">
                {/* DIV UNTUK LEAFLET MAP */}
                <div id="map-container" ref={mapContainerRef} />

                <div className="map-card">
                  <div className="map-card-label">▸ GLOBAL POSITIONING</div>
                  <div className="map-card-count">{telemetry.activeVessels} VESSELS</div>
                  <div className="map-card-sub">OP-DIST: {telemetry.totalDistance}</div>
                </div>

                <div className="map-ctrl-wrap">
                  <div className="mc" onClick={() => handleZoom("in")}>+</div>
                  <div className="mc" onClick={() => handleZoom("out")}>−</div>
                </div>
              </div>

              <div className="map-tele">
                <div className="tt">SATELLITE TELEMETRY</div>
                <div className="tr"><span className="tk">LINK-ID</span><span className="tv">{telemetry.signal}</span></div>
                <div className="tr"><span className="tk">ATMOS</span><span className="tv" style={{color:"#4ade80"}}>{telemetry.weatherStatus}</span></div>
                <div className="tr"><span className="tk">SECTOR</span><span className="tv">NW-440</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="right-col">
          <div className="panel">
            <div className="ah"><div className="at">SYSTEM LOGS</div><div className="ald"/></div>
            {alerts.map((a,i)=>(
              <div className="ac" key={i}>
                <div className="act" style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                  <span className="atype" style={{color:a.tc}}>{a.type}</span>
                  <span className="atime" style={{fontSize:8, color:"#4b5563"}}>{a.time}</span>
                </div>
                <p className="abody">{a.body}</p>
              </div>
            ))}
          </div>

          <div className="panel fuel-panel">
            <div className="ah"><div className="at" style={{color:"#a855f7"}}>ENERGY CORE</div></div>
            <div className="fca">
              <div className="brow">
                {fuel.map((b,i)=>(
                  <div className="bc" key={i}>
                    <div 
                      className="bf" 
                      style={{
                        height: `${b.h}%`, 
                        background: b.c, 
                        boxShadow: `0 0 10px ${b.c}55`
                      }}
                    />
                    <div className="bl">{b.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
