"use client";
import { useState, useEffect, useRef } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";

interface Vessel {
  lat: number;
  lng: number;
  id: string;
  speed: string;
  fuel: string;
  diag: string;
  signal: string;
  weather: string;
  color: string;
  region: string;
}

interface MapPageClientProps {
  dbVessels: Vessel[];
}

// GEO-MAPPING ROUTER: Koordinat jangkar perairan dunia nyata berdasarkan nama region/hub
const REGION_COORDINATES: { [key: string]: [number, number] } = {
  jpn: [35.6764, 139.6500],
  rotterdam: [51.9244, 4.4777],
  nld: [52.1326, 5.2913],
  singapore: [1.3521, 103.8198],
  sgp: [1.1300, 103.8300],
  priok: [-6.1014, 106.8841],
  idn: [-6.1000, 106.8900],
  tanjung: [-6.1014, 106.8841],
  suez: [29.9668, 32.5498],
  egy: [29.9600, 32.5500],
  mars: [15.0000, 115.0000], // Simulasi di Laut Cina Selatan untuk nama fiksi/antariksa
};

function getAccurateCoordinates(v: Vessel, index: number): [number, number] {
  const cleanRegion = v.region?.toLowerCase() || "";
  
  // 1. Cari apakah string region mengandung salah satu kata kunci jangkar peta kita
  for (const key in REGION_COORDINATES) {
    if (cleanRegion.includes(key)) {
      const [baseLat, baseLng] = REGION_COORDINATES[key];
      // Berikan sedikit offset acak mikro (jitter) supaya kalau ada 2 kapal ke tujuan sama tidak bertumpuk pas di satu titik
      return [baseLat + (index * 0.15), baseLng + (index * 0.15)];
    }
  }

  // 2. Jika koordinat database valid (bukan 0 atau null), gunakan yang ada
  if (v.lat && v.lng && v.lat !== 3.0) {
    return [v.lat, v.lng];
  }

  // 3. Fallback terakhir: Sebaran perairan Asia-Pasifik acak dinamis agar tidak membentuk garis lurus kaku
  return [2.0 + (index * 2.8) % 12, 105.0 + (index * 4.3) % 25];
}

export default function MapPageClient({ dbVessels }: MapPageClientProps) {
  const [time, setTime] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

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

  useEffect(() => {
    if (typeof window === "undefined" || leafletRef.current) return;

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

      // Center map global agak dizoom out sedikit (zoom: 4) agar area dari Eropa ke Jepang kelihatan megah
      const map = L.map(mapRef.current, {
        center: [15.0, 115.0],
        zoom: 4,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map);

      // MAPPING MARKER DARI DATA DATABASE NEON
      dbVessels.forEach((v, index) => {
        // Panggil fungsi geo-router pencari koordinat akurat
        const [finalLat, finalLng] = getAccurateCoordinates(v, index);

        const icon = L.divIcon({
          className: "custom-vessel-icon",
          html: `
            <div class="pulse-wrapper">
              <div class="pulse-ring" style="border-color: ${v.color}; box-shadow: 0 0 8px ${v.color}"></div>
              <div class="dot" style="background: ${v.color}; box-shadow: 0 0 12px ${v.color}"></div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([finalLat, finalLng], { icon }).addTo(map);

        const content = `
          <div class="prime-popup" style="border-left: 3px solid ${v.color}">
            <div class="pop-header">
              <span class="pop-label">LIVE TELEMETRY</span>
              <div class="pop-title-row">
                <span class="pop-title">${v.id}</span>
                <span class="pop-tag" style="color: ${v.color}">${v.region}</span>
              </div>
            </div>
            <div class="pop-body">
              <div class="pop-info"><span>VECTOR SPEED</span> <strong>${v.speed}</strong></div>
              <div class="pop-info"><span>FUEL LEVEL</span> <strong style="color:#22d3ee">${v.fuel}</strong></div>
              <div class="pop-divider"></div>
              <div class="pop-info"><span>DIAGNOSTICS</span> <strong style="color:${v.diag === 'NO ISSUES' ? '#4ade80' : '#f87171'}">${v.diag}</strong></div>
              <div class="pop-footer">
                <div class="pop-sub">SIGNAL CAPTURE <span>${v.signal}</span></div>
                <div class="pop-sub">CORE WEATHER <span>${v.weather}</span></div>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(content, {
          className: 'custom-prime-popup',
          minWidth: 240,
          closeButton: false
        });

        markersRef.current[v.id] = marker;
      });

      leafletRef.current = map;
    };

    document.head.appendChild(script);
  }, [dbVessels]);

  const handleFocusVessel = (v: Vessel) => {
    if (!leafletRef.current) return;
    
    // Cari index asli kapal untuk mencocokkan koordinat router saat di-flyTo
    const targetIndex = dbVessels.findIndex(item => item.id === v.id);
    const [finalLat, finalLng] = getAccurateCoordinates(v, targetIndex >= 0 ? targetIndex : 0);

    leafletRef.current.flyTo([finalLat, finalLng], 6, {
      animate: true,
      duration: 1.5
    });
    
    setTimeout(() => {
      const targetMarker = markersRef.current[v.id];
      if (targetMarker) targetMarker.openPopup();
    }, 1500);
  };

  return (
    <div className="map-page-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@500;600;700&display=swap');

        .map-page-container { width: 100vw; height: 100vh; background: #050505; position: relative; overflow: hidden; }
        .topbar-fixed-wrapper { position: absolute; top: 0; left: 0; width: 100%; z-index: 9999 !important; }
        #map-el { width: 100%; height: 100%; z-index: 1; }

        /* FIX UI SIDEBAR KIRI: Diperkecil dari width 260px ke 210px, font & padding dibuat super taktis minimalis */
        .hud-sidebar-left { position: absolute; top: 90px; left: 24px; width: 210px; background: rgba(6, 6, 6, 0.45); border: 1px solid rgba(255, 255, 255, 0.05); border-left: 2px solid #22d3ee; backdrop-filter: blur(10px); z-index: 1000; padding: 10px; border-radius: 3px; transition: all 0.3s ease; }
        .hud-title { font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: #fff; margin-bottom: 10px; display: flex; justify-content: space-between; }
        
        /* ADJUSTMENT COMPACT VESSEL CARD */
        .vessel-tactical-card { background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.02); padding: 6px 8px; margin-bottom: 5px; cursor: pointer; transition: all 0.2s ease; font-family: 'Rajdhani', sans-serif; }
        .vessel-tactical-card:hover { background: rgba(34, 211, 238, 0.08); border-color: rgba(34, 211, 238, 0.25); transform: translateX(3px); }

        /* FIX ERROR TERMINAL: Pastikan properti flexbox ditulis camelCase dengan benar */
        .card-row { display: flex; justifyContent: space-between; align-items: center; }
        .card-id { font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 700; }
        .card-meta { font-family: 'Share Tech Mono', monospace; font-size: 8px; }

        /* FIX UI SIDEBAR KANAN: Penyesuaian sinkronisasi */
        .hud-sidebar-right { position: absolute; top: 90px; right: 24px; width: 230px; background: rgba(6, 6, 6, 0.45); border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); z-index: 1000; padding: 10px; border-radius: 3px; font-family: 'Share Tech Mono', monospace; }

        .pulse-wrapper { position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid; animation: pulse 2s infinite; opacity: 0; }
        .dot { width: 8px; height: 8px; border-radius: 50%; z-index: 2; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }

        .custom-prime-popup .leaflet-popup-content-wrapper { background: #0a0a0f !important; color: #fff !important; border-radius: 2px !important; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 0 25px rgba(0,0,0,0.9); padding: 0 !important; }
        .custom-prime-popup .leaflet-popup-content { margin: 0 !important; width: 240px !important; }
        .custom-prime-popup .leaflet-popup-tip { display: none; }
        
        .prime-popup { padding: 14px; font-family: 'Rajdhani', sans-serif; }
        .pop-label { font-family: 'Share Tech Mono'; font-size: 8px; color: #4b5563; letter-spacing: 2px; display: block; }
        .pop-title-row { display: flex; justifyContent: space-between; align-items: center; margin-top: 4px; }
        .pop-title { font-family: 'Orbitron'; font-size: 12px; font-weight: 800; color: #fff; letter-spacing: 0.05em; }
        .pop-tag { font-family: 'Share Tech Mono'; font-size: 8px; font-weight: 600; }
        .pop-body { margin-top: 10px; }
        .pop-info { display: flex; justifyContent: space-between; font-size: 10px; margin-bottom: 4px; color: #9ca3af; }
        .pop-info strong { color: #fff; font-family: 'Share Tech Mono'; font-weight: 400; }
        .pop-divider { height: 1px; background: rgba(255,255,255,0.04); margin: 8px 0; }
        .pop-footer { margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px; }
        .pop-sub { display: flex; justifyContent: space-between; font-size: 8px; color: #4b5563; font-family: 'Share Tech Mono'; margin-bottom: 2px; }
        .pop-sub span { color: #e5e7eb; }

        .status-bar { position: absolute; bottom: 0; width: 100%; height: 26px; background: #030303; z-index: 1000; border-top: 1px solid rgba(255,255,255,0.02); display: flex; align-items: center; padding: 0 24px; font-family: 'Share Tech Mono'; font-size: 8px; color: #4b5563; justifyContent: space-between; letter-spacing: 0.05em; }
      `}</style>

      <div className="topbar-fixed-wrapper">
        <PrimeTopbar />
      </div>

      {/* SIDEBAR KIRI (ACTIVE TELEMETRY) */}
      <div className="hud-sidebar-left">
        <div className="hud-title">
          <span>ACTIVE TELEMETRY</span>
          <span style={{ color: "#22d3ee" }}>{dbVessels.length} UNITS</span>
        </div>
        <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: "2px" }}>
          {dbVessels.map((v) => (
            <div key={v.id} className="vessel-tactical-card" onClick={() => handleFocusVessel(v)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="card-id" style={{ color: v.color }}>{v.id}</span>
                <span className="card-meta" style={{ color: v.diag.includes('NO ISSUES') ? '#4ade80' : '#f87171' }}>
                  {v.diag.includes('NO ISSUES') ? 'OK' : 'WARN'}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                <span style={{ fontSize: "9px", color: "#9ca3af", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.region}
                </span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#fff" }}>{v.speed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="map-el" ref={mapRef} />

      {/* SIDEBAR KANAN */}
      <div className="hud-sidebar-right">
        <div style={{ color: "#22d3ee", fontSize: "8px", letterSpacing: "1px", marginBottom: "4px" }}>REAL-TIME GPS SAT_TRACK</div>
        <div style={{ color: "#fff", fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px", marginBottom: "10px" }}>
          CLOCK: {time || "00:00:00 AM"}
        </div>
        
        <div style={{ fontSize: "9px", color: "#9ca3af", marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>ORBITER ST:</span><span style={{ color: "#4ade80" }}>CONNECTED</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>MAP RESOLUTION:</span><span>WGS84_MERCATOR</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>SYS LATENCY:</span><span style={{ color: "#22d3ee" }}>14 MS</span>
          </div>
        </div>

        <div style={{ background: "rgba(248,113,113,0.02)", borderLeft: "2px solid #f87171", padding: "6px", fontSize: "8px", color: "#9ca3af" }}>
          <span style={{ color: "#f87171", fontWeight: "bold" }}>ALERT //</span> PACIFIC REGION HAS HIGH PRESSURE WEATHER SYSTEM.
        </div>
      </div>

      <div className="status-bar">
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <div>... MAIN SYSTEM: ONLINE // DATA_SOURCE: NEON_DATABASE</div>
          <div style={{ color: "#22d3ee" }}>NEON FLEET CONTROLLER V2.0</div>
        </div>
      </div>
    </div>
  );
}
