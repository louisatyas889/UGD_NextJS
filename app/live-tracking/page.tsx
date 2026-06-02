"use client";
import type { Metadata } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";

export const metadata: Metadata = {
  title: "Live Tracking | Serena Sail",
  description: "Halaman live tracking untuk melihat pergerakan kapal secara real-time.",
};

type Vessel = {
  id: string;
  status: string;
  coordinates: string;
  lat: number;
  lng: number;
  speed: string;
  fuel: number;
  signal: string;
  eta: string;
  wind: string;
  wave: string;
  load: string;
  color: string;
  destination: string;
  route: [number, number][];
};

// Koordinat Pangkal Balam / Bangka Belitung sebagai Titik Awal Keberangkatan Global
const BANGKA_BELITUNG_COORD: [number, number] = [-2.1000, 106.1333];

// Data mock kapal disesuaikan rutenya dari Bangka Belitung menuju Asia/Eropa Timur Laut
const vessels: Vessel[] = [
  { 
    id: "PL-882-BUMI", 
    status: "SEDANG BERLAYAR", 
    coordinates: "1.3521° N, 103.8198° E", 
    lat: 1.3521, 
    lng: 103.8198, 
    speed: "21 knots", 
    fuel: 84, 
    signal: "Terhubung (High Latency AI Optimization)", 
    eta: "24 OKT 14:00", 
    wind: "12.4", 
    wave: "1.8", 
    load: "92%", 
    color: "#22d3ee", 
    destination: "PORT OF SINGAPORE (SG)", 
    route: [BANGKA_BELITUNG_COORD, [0.1000, 104.5000], [1.3521, 103.8198]] 
  },
  { 
    id: "VX-441-MOON", 
    status: "IN PORT", 
    coordinates: "35.6762° N, 139.6503° E", 
    lat: 35.6762, 
    lng: 139.6503, 
    speed: "0 knots", 
    fuel: 15, 
    signal: "Terhubung (Marine Mesh Stabilized)", 
    eta: "ARRIVED", 
    wind: "3.2", 
    wave: "0.4", 
    load: "0%", 
    color: "#a855f7", 
    destination: "PORT OF TOKYO (JP)", 
    route: [BANGKA_BELITUNG_COORD, [10.5000, 115.2000], [22.3000, 125.5000], [35.6762, 139.6503]] 
  },
  { 
    id: "DS-112-MARS", 
    status: "MAINTAINING COURSE", 
    coordinates: "14.5995° N, 120.9842° E", 
    lat: 14.5995, 
    lng: 120.9842, 
    speed: "17 knots", 
    fuel: 63, 
    signal: "Terhubung (Satellite Relay Active)", 
    eta: "27 OKT 10:45", 
    wind: "14.1", 
    wave: "2.1", 
    load: "78%", 
    color: "#4ade80", 
    destination: "PORT OF MANILA (PH)", 
    route: [BANGKA_BELITUNG_COORD, [4.2000, 112.1000], [9.5000, 118.4000], [14.5995, 120.9842]] 
  },
];

const bottomMetrics = [{ label: "Wind Speed", unit: "m/s" }, { label: "Wave Height", unit: "m" }, { label: "Fleet Load", unit: "%" }] as const;

function clampIndex(index: number) {
  if (index < 0) return 0;
  if (index >= vessels.length) return vessels.length - 1;
  return index;
}

export default function LiveTrackingPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastSync, setLastSync] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  
  // Layer Tracker References
  const routeLayerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const liveVesselMarkerRef = useRef<any>(null);

  const selectedVessel = useMemo(() => vessels[clampIndex(selectedIndex)], [selectedIndex]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLastSync(`${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")} UTC`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Map Initialization
  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return;
    let cancelled = false;

    const initMap = () => {
      if (cancelled || !mapRef.current) return;
      const L = (window as any).L;
      if (!L) return;
      leafletRef.current = L;

      const map = L.map(mapRef.current, { 
        center: [12.0, 115.0], 
        zoom: 4, 
        zoomControl: false, 
        attributionControl: false 
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

      mapInstanceRef.current = map;
    };

    if ((window as any).L) { 
      initMap(); 
    } else {
      const existingLink = document.querySelector("link[data-serena-leaflet='true']");
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.setAttribute("data-serena-leaflet", "true");
        document.head.appendChild(link);
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => { 
      cancelled = true; 
      if (mapInstanceRef.current) { 
        mapInstanceRef.current.remove(); 
        mapInstanceRef.current = null; 
      } 
    };
  }, []);

  // Update Map Elements Dynamically based on Selection & Status Logic
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    // Bersihkan Layer lama agar tidak tumpang tindih saat ganti kapal
    if (routeLayerRef.current) routeLayerRef.current.remove();
    if (originMarkerRef.current) originMarkerRef.current.remove();
    if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
    if (liveVesselMarkerRef.current) liveVesselMarkerRef.current.remove();

    const hasArrived = selectedVessel.status.toUpperCase() === "IN PORT";

    // 1. Pembuatan Garis Putus-Putus Rute Pelayaran Lintasan
    routeLayerRef.current = L.polyline(selectedVessel.route, { 
      color: selectedVessel.color, 
      weight: 3, 
      opacity: 0.8, 
      dashArray: "6 10" 
    }).addTo(map);

    // 2. Logic Buletan Titik Keberangkatan (Bangka Belitung)
    // "kalau kapal udh sampai bulet-buet di bangka tuh ilang"
    if (!hasArrived) {
      const originIcon = L.divIcon({
        className: "serena-live-marker",
        html: `<div class="marker-core active"><div class="marker-ring" style="border-color:${selectedVessel.color}"></div><div class="marker-dot" style="background:${selectedVessel.color}; box-shadow:0 0 14px ${selectedVessel.color}"></div></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      originMarkerRef.current = L.marker(BANGKA_BELITUNG_COORD, { icon: originIcon }).addTo(map);
      originMarkerRef.current.bindPopup(`<div class="serena-popup"><div class="popup-label">ORIGIN NODE</div><div class="popup-title">BANGKA BELITUNG</div><div class="popup-row"><span>STATUS</span><strong>DEPARTED</strong></div></div>`, { className: "serena-leaflet-popup", closeButton: false });
    }

    // 3. Logic Buletan Titik Negara Tujuan
    // "nyala di titik kordinat negara yg di tuju, kalau belum nyampai bulet-buet di titik negara itu yg mati"
    const destIcon = L.divIcon({
      className: "serena-live-marker",
      html: `<div class="marker-core ${hasArrived ? "active" : "system-inactive"}">
        <div class="marker-ring" style="border-color: ${hasArrived ? selectedVessel.color : '#4b5563'}"></div>
        <div class="marker-dot" style="background: ${hasArrived ? selectedVessel.color : '#2d3748'}; box-shadow: ${hasArrived ? `0 0 14px ${selectedVessel.color}` : 'none'}"></div>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    destinationMarkerRef.current = L.marker([selectedVessel.lat, selectedVessel.lng], { icon: destIcon }).addTo(map);
    destinationMarkerRef.current.bindPopup(`
      <div class="serena-popup">
        <div class="popup-label">DESTINATION NODE</div>
        <div class="popup-title">${selectedVessel.destination}</div>
        <div class="popup-row"><span>STATUS</span><strong style="color:${hasArrived ? '#4ade80' : '#9ca3af'}">${hasArrived ? "ARRIVED / IN PORT" : "WAITING COURSE"}</strong></div>
      </div>
    `, { className: "serena-leaflet-popup", closeButton: false });

    // Buka popup otomatis pada target kapal saat ini
    if (hasArrived) {
      destinationMarkerRef.current.openPopup();
      map.flyTo([selectedVessel.lat, selectedVessel.lng], 5, { animate: true, duration: 1.2 });
    } else {
      originMarkerRef.current?.openPopup();
      // Tengahkan map di antara jalur Bangka Belitung dan Posisi Kapal Aktual
      map.flyTo([ (BANGKA_BELITUNG_COORD[0] + selectedVessel.lat) / 2, (BANGKA_BELITUNG_COORD[1] + selectedVessel.lng) / 2 ], 4, { animate: true, duration: 1.2 });
    }

  }, [selectedVessel]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#0a0a10;color:#e5e7eb;font-family:'Rajdhani',sans-serif;min-height:100vh}
        .live-root{position:relative;min-height:calc(100vh - 46px);background:#0a0a10;overflow:hidden}
        .live-map{position:relative;height:calc(100vh - 46px);min-height:680px;overflow:hidden}
        #live-map-canvas{position:absolute;inset:0;z-index:1}
        .map-shade{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(circle at 30% 20%, rgba(34,211,238,0.06), transparent 20%),linear-gradient(180deg, rgba(3,6,14,0.1) 0%, rgba(3,6,14,0.4) 100%)}
        
        .left-panel{position:absolute;top:16px;left:16px;z-index:20;width:320px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(10,10,20,0.85);backdrop-filter:blur(12px);box-shadow:0 16px 35px rgba(0,0,0,0.4);overflow:hidden}
        .panel-header{padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .panel-title{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.18em;color:#e5e7eb;text-transform:uppercase}
        .panel-status{margin-top:12px;display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
        .status-dot{width:7px;height:7px;border-radius:50%;animation:blink 1.6s ease-in-out infinite}
        
        .panel-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:14px}
        .vessel-selector{display:flex;gap:6px;margin-bottom:6px}
        .vessel-btn{flex:1;padding:6px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;color:#9ca3af;font-family:'Orbitron',sans-serif;font-size:9px;cursor:pointer;transition:all 0.2s}
        .vessel-btn.active{background:rgba(34,211,238,0.12);border-color:#22d3ee;color:#fff}

        .detail-row{display:flex;gap:12px;align-items:flex-start}
        .detail-icon{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#22d3ee;flex-shrink:0}
        .detail-label{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.16em;color:#6b7280;text-transform:uppercase;margin-bottom:4px}
        .detail-value{font-size:13px;color:#e5e7eb;line-height:1.5}
        
        .fuel-card{border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.025);border-radius:6px;padding:14px}
        .fuel-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .fuel-track{width:100%;height:10px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,0.08)}
        .fuel-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#38bdf8)}
        
        .top-chip{position:absolute;top:16px;right:16px;z-index:20}
        .telemetry-chip{padding:10px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(10,10,20,0.84);backdrop-filter:blur(12px);text-align:right}
        .telemetry-label{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.18em;color:#22d3ee;text-transform:uppercase}
        .telemetry-time{margin-top:4px;font-family:'Share Tech Mono',monospace;font-size:10px;color:#e5e7eb}
        
        .controls{position:absolute;right:16px;bottom:22px;z-index:20;display:flex;flex-direction:column;gap:8px}
        .control-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;border:1px solid rgba(255,255,255,0.14);background:rgba(10,10,20,0.88);color:#22d3ee;cursor:pointer;font-size:18px}
        .control-btn:hover{background:#a855f7;color:#fff}
        
        .bottom-metrics{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:20;display:flex;gap:10px;width:100%;max-width:480px;justify-content:center}
        .metric-pill{min-width:120px;padding:12px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.08);background:rgba(10,10,20,0.8);backdrop-filter:blur(12px);text-align:center}
        .metric-label{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.16em;color:#6b7280;text-transform:uppercase}
        .metric-value strong{font-size:18px;color:#22d3ee;font-family:'Orbitron'}
        .metric-value span{font-size:9px;color:#94a3b8;margin-left:2px}

        .serena-live-marker{background:none !important;border:none !important}
        .marker-core{position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center}
        .marker-ring{position:absolute;width:100%;height:100%;border-radius:50%;border:2px solid;opacity:0}
        .marker-core.active .marker-ring{animation:pulse 1.5s infinite}
        .marker-core.system-inactive .marker-ring{animation:none; border: 1px solid #4b5563; opacity: 0.4;}
        .marker-dot{width:10px;height:10px;border-radius:50%;z-index:2}
        
        .serena-leaflet-popup .leaflet-popup-content-wrapper{background:rgba(10,10,20,0.96) !important;border-left:3px solid #22d3ee;border-radius:4px !important;color:#fff}
        .serena-popup{padding:10px;font-family:'Rajdhani'}
        .popup-label{font-family:'Share Tech Mono';font-size:8px;color:#6b7280}
        .popup-title{font-family:'Orbitron';font-size:12px;font-weight:700;margin-top:2px}
        .popup-row{display:flex;justify-content:space-between;font-size:11px;margin-top:6px}

        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pulse{0%{transform:scale(.6);opacity:1}100%{transform:scale(2.2);opacity:0}}
      `}</style>

      <PrimeTopbar />
      <main className="live-root">
        <section className="live-map">
          <div id="live-map-canvas" ref={mapRef} />
          <div className="map-shade" />
          
          <aside className="left-panel">
            <div className="panel-header">
              <div className="vessel-selector">
                {vessels.map((v, idx) => (
                  <button 
                    key={v.id} 
                    className={`vessel-btn ${idx === selectedIndex ? "active" : ""}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    {v.id.split("-")[2] || v.id}
                  </button>
                ))}
              </div>
              <div className="panel-title">LIVE TELEMETRY: {selectedVessel.id}</div>
              <div className="panel-status">
                <span className="status-dot" style={{ background: selectedVessel.status === "IN PORT" ? "#a855f7" : "#22d3ee", boxShadow: `0 0 10px ${selectedVessel.status === "IN PORT" ? "#a855f7" : "#22d3ee"}` }} />
                <span style={{ color: selectedVessel.status === "IN PORT" ? "#a855f7" : "#22d3ee" }}>STATUS: {selectedVessel.status}</span>
              </div>
            </div>
            
            <div className="panel-body">
              <div className="detail-row">
                <div className="detail-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2" />
                  </svg>
                </div>
                <div>
                  <div className="detail-label">Rute Pelayaran</div>
                  <div className="detail-value" style={{fontSize:11}}>BB (BANGKA) → {selectedVessel.destination}</div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 13a8 8 0 1 0-16 0 M12 13l4-4 M5 19h14" />
                  </svg>
                </div>
                <div>
                  <div className="detail-label">Kecepatan Log</div>
                  <div className="detail-value">{selectedVessel.speed}</div>
                </div>
              </div>

              <div className="fuel-card">
                <div className="fuel-top">
                  <div className="detail-label">Bahan Bakar Core</div>
                  <div className="detail-label" style={{ color: selectedVessel.color, marginBottom: 0 }}>{selectedVessel.fuel}%</div>
                </div>
                <div className="fuel-track">
                  <div className="fuel-fill" style={{ width: `${selectedVessel.fuel}%`, background: selectedVessel.color }} />
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 8v4l2.5 2.5 M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                  </svg>
                </div>
                <div>
                  <div className="detail-label">Estimasi Tiba (ETA)</div>
                  <div className="detail-value" style={{color: selectedVessel.status === "IN PORT" ? "#a855f7" : "#e5e7eb"}}>{selectedVessel.eta}</div>
                </div>
              </div>
            </div>
          </aside>

          <div className="top-chip">
            <div className="telemetry-chip">
              <div className="telemetry-label">TACTICAL COORD ASSIST</div>
              <div className="telemetry-time">CLOCK: {lastSync}</div>
            </div>
          </div>

          <div className="controls">
            <button type="button" className="control-btn" onClick={() => mapInstanceRef.current?.zoomIn()}>+</button>
            <button type="button" className="control-btn" onClick={() => mapInstanceRef.current?.zoomOut()}>-</button>
          </div>

          <div className="bottom-metrics">
            {bottomMetrics.map((metric) => (
              <div key={metric.label} className="metric-pill">
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">
                  <strong>{metric.label === "Wind Speed" ? selectedVessel.wind : metric.label === "Wave Height" ? selectedVessel.wave : selectedVessel.load}</strong>
                  <span>{metric.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
