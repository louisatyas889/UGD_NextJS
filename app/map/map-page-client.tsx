"use client";
import { useState, useEffect, useRef } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";

interface Vessel {
  id: string;
  subtitle: string;
  destination: string;
  status: string;
  status_color: string;
  eta: string;
  eta_color: string;
  monitoring_icon: string;
  progress_pct: number;
  speed: string;
  fuel: string;
  diag: string;
  signal: string;
  weather: string;
  color: string;
  region: string;
  current_lat?: number;
  current_lng?: number;
}

interface MapPageClientProps {
  dbVessels: Vessel[];
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

export default function MapPageClient({ dbVessels }: MapPageClientProps) {
  const [time, setTime] = useState("");
  const [notifications, setNotifications] = useState<{id: string; message: string; type: string}[]>([]);
  const previousVesselsRef = useRef<Vessel[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  function getStaticTargetCoordinates(v: Vessel, index: number): [number, number] {
    const targetCountry = (v.destination || v.region || "sg").toLowerCase().trim();
    let baseCoords: [number, number] = [1.3521, 103.8198];

    for (const key in REGION_COORDINATES) {
      if (targetCountry.includes(key) || targetCountry === key) {
        baseCoords = REGION_COORDINATES[key];
        break;
      }
    }
    return [baseCoords[0] + (index * 0.04), baseCoords[1] + (index * 0.04)];
  }

  // Pemantau Notifikasi Banner
  useEffect(() => {
    if (previousVesselsRef.current.length > 0) {
      dbVessels.forEach((currentVessel) => {
        const prevVessel = previousVesselsRef.current.find(p => p.id === currentVessel.id);
        if (prevVessel) {
          const prevStatus = (prevVessel.status || "").toUpperCase().trim();
          const currentStatus = (currentVessel.status || "").toUpperCase().trim();

          if (prevStatus !== currentStatus) {
            if (currentStatus.includes("DELAY")) {
              triggerNotification(currentVessel.id, `FLEET ${currentVessel.id}: Critical Delay detected. Operating under BAD WEATHER conditions.`, "delay");
            } else if (currentStatus === "EN RUTE" || currentStatus === "AKTIF") {
              triggerNotification(currentVessel.id, `FLEET ${currentVessel.id}: Status updated to EN RUTE. Departing from Origin.`, "warn");
            } else if (currentStatus === "IN PORT" || currentStatus === "ACTIVE") {
              setTimeout(() => {
                triggerNotification(currentVessel.id, `ARRIVED // VESSEL ${currentVessel.id} status is now IN PORT.`, "success");
              }, 10000); 
            }
          }
        }
      });
    }
    previousVesselsRef.current = dbVessels;
  }, [dbVessels]);

  const triggerNotification = (vesselId: string, message: string, type: string) => {
    const id = `${vesselId}-${Date.now()}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Clock Timer
  useEffect(() => {
    const updateTime = () => {
      const n = new Date();
      let h = n.getHours();
      const m = String(n.getMinutes()).padStart(2, "0");
      const s = String(n.getSeconds()).padStart(2, "0");
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h}:${m}:${s} ${ap}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Leaflet Engine Render
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Bersihkan map lama jika ada sebelum membuat instance baru
    if (leafletRef.current) {
      leafletRef.current.remove();
      leafletRef.current = null;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    
    script.onload = () => {
      if (!mapRef.current || (window as any).L === undefined) return;
      const L = (window as any).L;

      // Antisipasi kondisi balapan (race condition) saat pemuatan asinkronous
      if (leafletRef.current) {
        leafletRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        center: [10.0, 118.0],
        zoom: 4,
        zoomControl: false,
        attributionControl: false
      });

      // PERBAIKAN: Menyimpan instance peta ke dalam ref agar bisa dibersihkan nanti
      leafletRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map);

      // Reset daftar marker lama
      markersRef.current = {};

      dbVessels.forEach((v, index) => {
        const [finalLat, finalLng] = getStaticTargetCoordinates(v, index);
        const cleanStatus = (v.status || "").toUpperCase().trim();
        
        const themeColor = v.color || "#22d3ee";
        let statusText = cleanStatus;
        
        if (cleanStatus.includes("DELAY")) statusText = "DELAY (BAD WEATHER)";
        if (cleanStatus.includes("MAINTENANCE") || cleanStatus === "MAINTED") statusText = "MAINTENANCE (DRY DOCK)";
        if (cleanStatus === "IN PORT" || cleanStatus === "ACTIVE" || cleanStatus === "AKTIF") statusText = "IN PORT (DOCKED)";

        // Render Custom Glow Marker Kapal
        const icon = L.divIcon({
          className: "custom-vessel-icon",
          html: `
            <div class="pulse-wrapper">
              <div class="pulse-ring" style="border-color: ${themeColor}; box-shadow: 0 0 8px ${themeColor}"></div>
              <div class="dot" style="background: ${themeColor}; box-shadow: 0 0 12px ${themeColor}"></div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([finalLat, finalLng], { icon }).addTo(map);
        const telemetryLocation = v.region || "SG";

        const content = `
          <div class="prime-popup" style="border-left: 3px solid ${themeColor}">
            <div class="pop-header">
              <span class="pop-label">LIVE TELEMETRY</span>
              <div class="pop-title-row">
                <span class="pop-title" style="color: ${themeColor}">${v.id}</span>
                <span class="pop-tag" style="color: ${themeColor}">${telemetryLocation}</span>
              </div>
            </div>
            <div class="pop-body">
              <div class="pop-info"><span>CURRENT STATUS</span> <strong style="color: ${themeColor}">${statusText}</strong></div>
              <div class="pop-info"><span>VECTOR SPEED</span> <strong>${v.speed}</strong></div>
              <div class="pop-info"><span>FUEL LEVEL</span> <strong style="color:#22d3ee">${v.fuel}</strong></div>
              <div class="pop-divider"></div>
              <div class="pop-info"><span>DIAGNOSTICS</span> <strong style="color:${themeColor}">${v.diag}</strong></div>
            </div>
          </div>
        `;

        marker.bindPopup(content, { className: 'custom-prime-popup', minWidth: 240, closeButton: false });
        markersRef.current[v.id] = marker;
      });
    };

    document.head.appendChild(script);

    // PERBAIKAN: Fungsi cleanup saat komponen unmount atau dbVessels berubah
    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
      if (document.head.contains(script)) document.head.removeChild(script);
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, [dbVessels]);

  const handleFocusVessel = (v: Vessel) => {
    if (!leafletRef.current) return;
    const targetIndex = dbVessels.findIndex(item => item.id === v.id);
    const [finalLat, finalLng] = getStaticTargetCoordinates(v, targetIndex >= 0 ? targetIndex : 0);

    leafletRef.current.flyTo([finalLat, finalLng], 5, { animate: true, duration: 1.2 });
    setTimeout(() => {
      const targetMarker = markersRef.current[v.id];
      if (targetMarker) targetMarker.openPopup();
    }, 1200);
  };

  return (
    <div className="map-page-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@500;600;700&display=swap');

        .map-page-container { width: 100vw; height: 100vh; background: #050505; position: relative; overflow: hidden; }
        .topbar-fixed-wrapper { position: absolute; top: 0; left: 0; width: 100%; z-index: 9999 !important; }
        #map-el { width: 100%; height: 100%; z-index: 1; }

        /* HUD TOAST CONTAINER */
        .hud-notification-center { position: absolute; top: 90px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 8px; width: 400px; pointer-events: none; }
        .hud-toast { background: rgba(10, 10, 15, 0.85); border: 1px solid rgba(255,255,255,0.05); padding: 10px 14px; border-radius: 2px; font-family: 'Share Tech Mono', monospace; font-size: 10px; color: #fff; backdrop-filter: blur(8px); animation: slideDown 0.3s ease-out; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .hud-toast.success { border-left: 3px solid #a855f7; color: #a855f7; }
        .hud-toast.delay { border-left: 3px solid #ef4444; color: #ef4444; }
        .hud-toast.warn { border-left: 3px solid #22d3ee; color: #22d3ee; }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* HUD SIDEBAR KIRI */
        .hud-sidebar-left { position: absolute; top: 90px; left: 24px; width: 210px; background: rgba(6, 6, 6, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); border-left: 2px solid #22d3ee; backdrop-filter: blur(10px); z-index: 1000; padding: 10px; border-radius: 3px; transition: all 0.3s ease; }
        .hud-title { font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: #fff; margin-bottom: 10px; display: flex; justify-content: space-between; }
        .vessel-tactical-card { background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.02); padding: 6px 8px; margin-bottom: 5px; cursor: pointer; transition: all 0.2s ease; font-family: 'Rajdhani', sans-serif; }
        .vessel-tactical-card:hover { background: rgba(34, 211, 238, 0.08); border-color: rgba(34, 211, 238, 0.25); transform: translateX(3px); }
        .card-id { font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 700; }

        /* HUD SIDEBAR KANAN */
        .hud-sidebar-right { position: absolute; top: 90px; right: 24px; width: 230px; background: rgba(6, 6, 6, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); z-index: 1000; padding: 10px; border-radius: 3px; font-family: 'Share Tech Mono', monospace; }

        /* CIRCLE WAVE ANIMATION */
        .pulse-wrapper { position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid; animation: pulse 2s infinite; opacity: 0; }
        .dot { width: 8px; height: 8px; border-radius: 50%; z-index: 2; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }

        /* LEAFLET PRIME PANEL POPUP */
        .custom-prime-popup .leaflet-popup-content-wrapper { background: #0a0a0f !important; color: #fff !important; border-radius: 2px !important; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 0 25px rgba(0,0,0,0.9); padding: 0 !important; }
        .custom-prime-popup .leaflet-popup-content { margin: 0 !important; width: 240px !important; }
        .custom-prime-popup .leaflet-popup-tip { display: none; }
        
        .prime-popup { padding: 14px; font-family: 'Rajdhani', sans-serif; }
        .pop-label { font-family: 'Share Tech Mono'; font-size: 8px; color: #4b5563; letter-spacing: 2px; display: block; }
        .pop-title-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
        .pop-title { font-family: 'Orbitron'; font-size: 12px; font-weight: 800; color: #fff; letter-spacing: 0.05em; }
        .pop-tag { font-family: 'Share Tech Mono'; font-size: 8px; font-weight: 600; }
        .pop-body { margin-top: 10px; }
        .pop-info { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 4px; color: #9ca3af; }
        .pop-info strong { color: #fff; font-family: 'Share Tech Mono'; font-weight: 400; }
        .pop-divider { height: 1px; background: rgba(255,255,255,0.04); margin: 8px 0; }

        .status-bar { position: absolute; bottom: 0; width: 100%; height: 26px; background: #030303; z-index: 1000; border-top: 1px solid rgba(255,255,255,0.02); display: flex; align-items: center; padding: 0 24px; font-family: 'Share Tech Mono'; font-size: 8px; color: #4b5563; justify-content: space-between; letter-spacing: 0.05em; }
      `}</style>

      <div className="topbar-fixed-wrapper">
        <PrimeTopbar />
      </div>

      {/* CENTER HUD NOTIFICATION */}
      <div className="hud-notification-center">
        {notifications.map(n => (
          <div key={n.id} className={`hud-toast ${n.type}`}>
            {n.type === "delay" ? "[⛈️ BAD WEATHER] " : n.type === "warn" ? "[📡 VOYAGE DEPARTURE] " : "[⚓ PORT ARRIVAL] "} {n.message}
          </div>
        ))}
      </div>

      {/* SIDEBAR MONITORING KIRI */}
      <div className="hud-sidebar-left">
        <div className="hud-title">
          <span>ACTIVE FLEETS</span>
          <span style={{ color: "#22d3ee" }}>{dbVessels.length} UNITS</span>
        </div>
        <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: "2px" }}>
          {dbVessels.map((v) => {
            const cleanStatus = (v.status || "").toUpperCase().trim();
            const isEnRute = cleanStatus === "EN RUTE" || cleanStatus === "AKTIF";
            const themeColor = v.color || "#22d3ee"; 

            return (
              <div key={v.id} className="vessel-tactical-card" onClick={() => handleFocusVessel(v)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="card-id" style={{ color: themeColor }}>{v.id}</span>
                  <span className="card-meta" style={{ 
                    color: themeColor, 
                    fontSize: '7px', border: `1px solid ${themeColor}40`, padding: '1px 3px' 
                  }}>
                    {cleanStatus}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                  <span style={{ fontSize: "9px", color: "#9ca3af", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isEnRute ? "Origin: Indonesia" : `Region: ${v.region}`}
                  </span>
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#fff" }}>{v.speed}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LEAFLET COMPONENT CONTAINER */}
      <div id="map-el" ref={mapRef} />

      {/* SIDEBAR DETAIL KANAN */}
      <div className="hud-sidebar-right">
        <div style={{ color: "#22d3ee", fontSize: "8px", letterSpacing: "1px", marginBottom: "4px" }}>REAL-TIME GPS SAT_TRACK</div>
        <div style={{ color: "#fff", fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px", marginBottom: "10px" }}>
          CLOCK: {time || "00:00:00 AM"}
        </div>
        
        <div style={{ fontSize: "9px", color: "#9ca3af", marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>ORBITER ST:</span><span style={{ color: "#4ade80" }}>CONNECTED</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>SYS LATENCY:</span><span style={{ color: "#22d3ee" }}>14 MS</span>
          </div>
        </div>
      </div>

      <div className="status-bar">
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <div>... MAIN GPS ENGINE: ACTIVE // CLEAN STATIC MODE: ENABLED</div>
          <div style={{ color: "#22d3ee" }}>NEON FLEET CONTROLLER V2.5</div>
        </div>
      </div>
    </div>
  );
}
