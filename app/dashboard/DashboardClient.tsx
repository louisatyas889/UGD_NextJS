"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";
import { useFleet } from "../context/FleetContext";

function MonIcon({ t }: { t: string }) {
  if (t === "chart") return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
  if (t === "anchor") return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="22"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>;
  if (t === "warn") return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
}

interface DashboardClientProps {
  initialCards: { numberOfInvoices: number; totalPaidInvoices: string };
  initialLogs: any[];
  initialFuel: any[];
  initialVessels: any[];
}

const REGION_COORDINATES: { [key: string]: [number, number] } = {
  bb: [-2.5236, 106.1858],     
  sg: [1.3521, 103.8198],      
  ch: [35.0000, 105.0000],     
  cn: [31.2304, 121.4737],     
  th: [15.8700, 100.9925],     
  ph: [14.5995, 120.9842],     
  kr: [37.5665, 126.9780],     
  jp: [35.6762, 139.6503],     
};

function getAccurateCoordinates(v: any, index: number): [number, number] {
  if (v?.status && v.status.toUpperCase() === "IN PORT") {
    const targetCountry = (v.dest || "").toUpperCase().trim();
    if (targetCountry.includes("SG")) return [1.3521, 103.8198];
    if (targetCountry.includes("JP")) return [35.6762, 139.6503];
    if (targetCountry.includes("PH")) return [14.5995, 120.9842];
    if (targetCountry.includes("CN") || targetCountry.includes("CH")) return [31.2304, 121.4737];
    if (targetCountry.includes("KR")) return [37.5665, 126.9780];
  }
  
  const lat = Number(v?.current_lat);
  const lng = Number(v?.current_lng);
  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return [lat, lng];
  }

  const cleanRegion = (v?.region || v?.dest || "").toLowerCase().trim();
  for (const key in REGION_COORDINATES) {
    if (cleanRegion.includes(key) || cleanRegion === key) {
      const [baseLat, baseLng] = REGION_COORDINATES[key];
      return [baseLat + (index * 0.04), baseLng + (index * 0.04)];
    }
  }
  return [2.0 + (index * 2.8) % 12, 105.0 + (index * 4.3) % 25];
}

export default function DashboardClient({ initialCards, initialLogs = [], initialFuel = [], initialVessels = [] }: DashboardClientProps) {
  const [utc, setUtc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [leafletReady, setLeafletReady] = useState(false);
  
  const [mapInstance, setMapInstance] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersGroupRef = useRef<any>(null);

  const { vesselEnergy = {} } = useFleet();

  // UTC Clock Telemetry
  useEffect(() => {
    const updateTime = () => { 
      const n = new Date(); 
      setUtc(`${String(n.getUTCHours()).padStart(2, "0")}:${String(n.getUTCMinutes()).padStart(2, "0")}:${String(n.getUTCSeconds()).padStart(2, "0")} UTC`); 
    };
    updateTime(); 
    const id = setInterval(updateTime, 1000); 
    return () => clearInterval(id);
  }, []);

  // Safe Inject Leaflet Styles & Scripts
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) { 
      setLeafletReady(true); 
      return; 
    }

    const link = document.createElement("link");
    link.rel = "stylesheet"; 
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true; 
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  // Initialize Map Instance
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstance) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapContainerRef.current, { 
      center: [12.0, 115.0], 
      zoom: 4, 
      zoomControl: false, 
      attributionControl: false 
    });
    
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { 
      maxZoom: 19 
    }).addTo(map);
    
    setMapInstance(map);

    return () => {
      map.remove();
      setMapInstance(null);
      markersGroupRef.current = null;
    };
  }, [leafletReady]);

  // Reactive Search Filter
  const filteredVessels = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return (initialVessels || []).filter((v: any) => {
      return (
        (v?.id || "").toLowerCase().includes(query) ||
        (v?.dest || "").toLowerCase().includes(query) ||
        (v?.status || "").toLowerCase().includes(query)
      );
    });
  }, [initialVessels, searchQuery]);

  // Filter untuk Warning Alerts (Delayed & Maintenance)
  const alertVessels = useMemo(() => {
    return (initialVessels || []).filter(
      (v: any) => v.status === "DELAYED" || v.status === "MAINTENANCE"
    );
  }, [initialVessels]);

  // Reactive Energy Metrics Mapping
  const dynamicEnergyData = useMemo(() => {
    return (initialFuel || []).map((f: any) => {
      if (!f || !f.l) return null;
      const currentEnergy = vesselEnergy[f.l] !== undefined ? vesselEnergy[f.l] : f.h;
      let cleanName = f.l.toUpperCase();
      if (cleanName.startsWith("V-")) cleanName = cleanName.replace("V-", "").trim();
      if (cleanName.startsWith("PL-")) cleanName = cleanName.replace("PL-", "").trim();

      return {
        label: cleanName,
        height: Math.min(Math.max(Math.round(currentEnergy), 0), 100),
        color: f.c || "#a855f7"
      };
    }).filter(Boolean);
  }, [initialFuel, vesselEnergy]);

  // Dynamic Map Layer Markers Rendering
  useEffect(() => {
    if (!mapInstance || !(window as any).L) return;
    const L = (window as any).L;

    if (!markersGroupRef.current) {
      markersGroupRef.current = L.layerGroup().addTo(mapInstance);
    } else {
      markersGroupRef.current.clearLayers();
    }

    filteredVessels.forEach((v: any, index: number) => {
      const [finalLat, finalLng] = getAccurateCoordinates(v, index);
      const customColor = v.statusColor || "#22d3ee";

      const tacticalIcon = L.divIcon({
        className: 'map-pulse-icon',
        html: `
          <div class="pulse-wrapper">
            <div class="pulse-ring" style="border-color: ${customColor}; box-shadow: 0 0 6px ${customColor}"></div>
            <div class="dot" style="background: ${customColor}; box-shadow: 0 0 10px ${customColor}"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([finalLat, finalLng], { icon: tacticalIcon });
      marker.bindPopup(`
        <div style="background:#0a0a0f; color:#fff; padding:6px; font-family:'Rajdhani',sans-serif; border-left:2px solid ${customColor}">
          <strong style="font-family:'Orbitron'; font-size:10px; color:${customColor}">${v.id || 'UNKNOWN'}</strong>
          <div style="font-size:11px; margin-top:2px;">DEST: ${v.dest || 'N/A'}</div>
          <div style="font-size:9px; color:#9ca3af; text-transform: uppercase;">STATUS: ${v.status || 'N/A'}</div>
        </div>
      `, { closeButton: false });
      markersGroupRef.current.addLayer(marker);
    });

    mapInstance.invalidateSize();
  }, [filteredVessels, mapInstance]);

  const handleZoom = (type: "in" | "out") => {
    if (!mapInstance) return;
    if (type === "in") mapInstance.zoomIn(); else mapInstance.zoomOut();
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
        
        .vid{font-family:'Orbitron',sans-serif;font-size:11px;color:#22d3ee;letter-spacing:0.05em;font-weight:700}
        .eta{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.05em}
        
        .map-panel{flex:1;min-height:350px}
        .map-outer{display:flex;height:100%;min-height:350px}
        .map-wrap{position:relative; flex:1; background-color:#05050a; overflow: hidden;}
        #map-container { position: absolute; inset: 0; z-index: 1; min-height: 350px; width: 100%; }
        
        .pulse-wrapper { position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid; animation: mapPulse 2s infinite; opacity: 0; }
        .dot { width: 6px; height: 6px; border-radius: 50%; z-index: 2; }
        @keyframes mapPulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}

        .map-card{position:absolute;top:14px;left:14px;background:rgba(8,5,22,0.85);border:1px solid rgba(168,85,247,0.45);border-radius:4px;padding:10px 16px;backdrop-filter:blur(8px);z-index:5}
        .map-card-label{font-family:'Share Tech Mono',monospace;font-size:7px;color:#a855f7;letter-spacing:0.28em;margin-bottom:4px}
        .map-card-count{font-family:'Orbitron',sans-serif;font-size:20px;font-weight:700;color:#fff}
        .map-card-sub{font-family:'Share Tech Mono',monospace;font-size:9px;color:#22d3ee}
        .map-ctrl-wrap{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:4px;z-index:10}
        .mc{width:26px;height:26px;background:rgba(10,10,20,0.9);border:1px solid rgba(255,255,255,0.2);border-radius:3px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#22d3ee;font-size:16px;transition:all 0.2s}
        .mc:hover { background: #a855f7; color: #fff; border-color: #fff; }
        .map-tele{width:180px;flex-shrink:0;background:rgba(9,9,20,0.9);border-left:1px solid rgba(255,255,255,0.07);padding:14px}
        .tt{font-family:'Share Tech Mono',monospace;font-size:8px;color:#22d3ee;letter-spacing:0.2em;margin-bottom:12px}
        .tr{display:flex;justify-content:space-between;margin-bottom:8px}
        .tk{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6b7280}
        .tv{font-family:'Share Tech Mono',monospace;font-size:10px;color:#e5e7eb}

        .fuel-panel{flex-shrink:0; display:flex; flex-direction:column; min-height:220px}
        .fca{flex:1; padding:20px 14px; display:flex; flex-direction:column; justify-content:flex-end}
        .brow{display:flex; align-items:flex-end; gap:8px; height:100px; width:100%}
        .bc{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%}
        .bf{width:100%; min-width:12px; border-radius:2px 2px 0 0; transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1)}
        .bl{margin-top:8px; font-family:'Share Tech Mono',monospace; font-size:7px; color:#4b5563; text-align:center}

        .right-col{display:flex;flex-direction:column;gap:10px}
        .ah{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .at{font-family:'Share Tech Mono',monospace;font-size:10px;color:#9ca3af;letter-spacing:0.2em}

        .alert-card { margin: 10px; padding: 12px 14px; border-radius: 2px; }

        .leaflet-popup-content-wrapper { background: #0a0a0f !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.1); border-radius:3px; }
      `}</style>
      
      <PrimeTopbar onSearch={(e: any) => setSearchQuery(e.target.value)} />
      
      <div className="layout">
        <div className="left-col">
          {/* TACTICAL FLEET OVERVIEW */}
          <div className="panel">
            <div className="ph">
              <div className="pt"><div className="ptb"/>TACTICAL FLEET OVERVIEW</div>
              <span className="pts">SYSTEM CLOCK: {utc}</span>
            </div>
            {filteredVessels && filteredVessels.length > 0 ? (
              filteredVessels.map((v: any) => {
                const currentStatusColor = v.statusColor || "#22d3ee";
                return (
                  <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,85,247,0.04)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span className="vid">{v.id}</span>
                      <div style={{ fontSize: 12, color: "#d1d5db", fontWeight: 500, marginTop: 2 }}>{v.dest || "UNKNOWN DESTINATION"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: currentStatusColor, boxShadow: `0 0 6px ${currentStatusColor}`, flexShrink: 0, animation: "blink 2s ease-in-out infinite" }} />
                      <span style={{ display: "inline-flex", fontSize: 9, fontFamily: "'Share Tech Mono', monospace", color: currentStatusColor, padding: "3px 10px", borderRadius: 20, border: `1px solid ${currentStatusColor}33`, background: `${currentStatusColor}15`, letterSpacing: "0.1em", textTransform: "uppercase" }}>{v.status}</span>
                    </div>
                    <div style={{ minWidth: 80, textAlign: "right" }}>
                      <span className="eta" style={{ color: v.etaColor || "#e5e7eb" }}>{v.eta || "N/A"}</span>
                    </div>
                    <div style={{ minWidth: 32, display: "flex", justifyContent: "center" }}>
                      <MonIcon t={v.mon || "chart"} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 24, textTransform: "uppercase", textAlign: "center", color: "#4b5563", fontFamily: "'Share Tech Mono', monospace", fontSize: 11 }}>
                {searchQuery ? `NO OPERATIONS MATCHING "${searchQuery.toUpperCase()}"` : "NO VESSEL TELEMETRY DETECTED"}
              </div>
            )}
          </div>

          {/* MAP PANEL */}
          <div className="panel map-panel">
            <div className="map-outer">
              <div className="map-wrap">
                <div id="map-container" ref={mapContainerRef} />
                <div className="map-card">
                  <div className="map-card-label">▸ GLOBAL POSITIONING</div>
                  <div className="map-card-count">{filteredVessels.length} UNITS</div>
                  <div className="map-card-sub">OP-DIST: ACTIVE SAT_TRACK</div>
                </div>
                <div className="map-ctrl-wrap">
                  <div className="mc" onClick={() => handleZoom("in")}>+</div>
                  <div className="mc" onClick={() => handleZoom("out")}>−</div>
                </div>
              </div>
              <div className="map-tele">
                <div className="tt">SATELLITE TELEMETRY</div>
                <div className="tr"><span className="tk">LINK-ID</span><span className="tv">SRN-NEXUS</span></div>
                <div className="tr"><span className="tk">ATMOS</span><span className="tv" style={{color:"#4ade80"}}>STABLE</span></div>
                <div className="tr"><span className="tk">SECTOR</span><span className="tv">GLOBAL_SEA</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="right-col">
          
          {/* 1. ANALYTICS ENERGY CORE (DI ATAS) */}
          <div className="panel fuel-panel">
            <div className="ah"><div className="at" style={{ color: "#a855f7" }}>ANALYTICS ENERGY CORE</div></div>
            <div className="fca">
              <div className="brow">
                {dynamicEnergyData.length > 0 ? (
                  dynamicEnergyData.map((b: any, i: number) => (
                    <div className="bc" key={i}>
                      <div className="bf" style={{ height: `${Math.max(b.height, 12)}%`, background: b.color, boxShadow: `0 0 10px ${b.color}55` }} />
                      <div className="bl">{b.label}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ width: "100%", textTransform: "uppercase", fontSize: 9, color: "#4b5563", fontFamily: "Share Tech Mono", textAlign: "center", marginBottom: 40 }}>
                    No Analytics Linked
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. WARNING ALERTS (DI BAWAH) */}
          <div className="panel">
            <div className="ah">
              <div className="at" style={{ color: alertVessels.length > 0 ? "#f87171" : "#4b5563" }}>
                WARNING ALERTS
              </div>
            </div>

            {alertVessels.length === 0 ? (
              <div style={{ padding: 30, fontSize: 10, color: "#4b5563", fontFamily: "'Share Tech Mono', monospace", textAlign: "center" }}>
                ALL SYSTEMS OPERATIONAL // NO ALERTS
              </div>
            ) : (
              <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 350px)" }}>
                {alertVessels.map((v: any, index: number) => {
                  const isDelayed = v.status === "DELAYED";
                  const alertTitle = isDelayed ? "WEATHER WARNING" : "MAINTENANCE ALERT";
                  const titleColor = isDelayed ? "#f87171" : "#f472b6";
                  const bgColor = isDelayed ? "rgba(248, 113, 113, 0.04)" : "rgba(244, 114, 182, 0.04)";

                  return (
                    <div
                      key={v.id || index}
                      className="alert-card"
                      style={{
                        background: bgColor,
                        borderLeft: `3px solid ${titleColor}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: titleColor, fontWeight: 700, fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}>
                          {alertTitle}
                        </span>
                        <span style={{ color: "#4b5563", fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}>
                          {v.id}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.3 }}>
                        {isDelayed 
                          ? `Anomali cuaca buruk terdeteksi di rute pelayaran.` 
                          : `Kapal masuk ke dermaga perbaikan sistem mekanis.`}
                      </p>
                      <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4, fontFamily: "'Share Tech Mono', monospace" }}>
                        HUB: {v.dest || "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
