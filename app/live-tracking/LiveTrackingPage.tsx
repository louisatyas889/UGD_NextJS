"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script"; 
import PrimeTopbar from "../ui/PrimeTopbar";

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
  destLat: number;
  destLng: number;
};

const BANGKA_BELITUNG_COORD: [number, number] = [-2.1000, 106.1333];
const bottomMetrics = [
  { label: "Wind Speed", unit: "m/s" }, 
  { label: "Wave Height", unit: "m" }, 
  { label: "Fleet Load", unit: "%" }
] as const;

export default function LiveTrackingPage({ vessels }: { vessels: Vessel[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastSync, setLastSync] = useState("");
  const [leafletLoaded, setLeafletLoaded] = useState(false); 
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const vesselMarkerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);

  // Ambil data aktif terpilih dari array hasil database
  const selectedVessel = useMemo(() => {
    if (!vessels || vessels.length === 0) return null;
    return vessels[selectedIndex] || vessels[0];
  }, [vessels, selectedIndex]);

  // Efek pembantu untuk memperbarui teks jam satelit di HUD
  useEffect(() => {
    setLastSync(new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const t = setInterval(() => {
      setLastSync(new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // 🌟 FIX UTAMA UNTUK MAP GELAP: Pastikan state disinkronkan jika skrip leaflet sudah ter-cache di window browser
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).L) {
      setLeafletLoaded(true);
    }
  }, []);

  // Inisialisasi Peta Leaflet Utama
  useEffect(() => {
    if (!leafletLoaded || typeof window === "undefined" || !mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Hancurkan instance map usang jika masih menggantung di memory virtual DOM
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Build Instance Peta Baru menggunakan reference DOM langsung
    const map = L.map(mapRef.current, {
      center: [4.0, 115.0],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 10,
      minZoom: 3,
    }).addTo(map);

    mapInstanceRef.current = map;

    // 🌟 FORCE INVALIDATE SIZE: Memaksa peta menggambar ulang grid kontainernya
    const resizeTimeout = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(resizeTimeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Update Gambar Rute Dinamis Garis Putus-Putus & Posisi Bulatan Setiap Kapal Berubah
  useEffect(() => {
    if (!leafletLoaded) return;
    
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L || !selectedVessel) return;

    // Bersihkan Layer Rute & Marker Sebelumnya agar tidak menumpuk/bocor memori
    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
    if (vesselMarkerRef.current) map.removeLayer(vesselMarkerRef.current);
    if (originMarkerRef.current) map.removeLayer(originMarkerRef.current);
    if (destinationMarkerRef.current) map.removeLayer(destinationMarkerRef.current);

    // 1. Gambar Garis Putus-Putus Menghubungkan Pangkal Keberangkatan Ke Negara Tujuan
    if (selectedVessel.route && selectedVessel.route.length > 0) {
      routeLayerRef.current = L.polyline(selectedVessel.route, {
        color: selectedVessel.color || "#22d3ee",
        weight: 2,
        opacity: 0.6,
        dashArray: "6 10"
      }).addTo(map);
    }

    // 2. Buat Titik Pangkal Keberangkatan (Bangka Belitung Hub Utama)
    const originIcon = L.divIcon({
      className: "custom-node-origin",
      html: `<div style="background: rgba(255,255,255,0.1); border: 1px dashed #fff; width: 10px; height: 10px; border-radius: 50%;"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
    originMarkerRef.current = L.marker(BANGKA_BELITUNG_COORD, { icon: originIcon })
      .addTo(map)
      .bindPopup(`<strong style="color:#22d3ee">MAIN HUB BASE</strong><br><span style="color:#aaa">Bangka Belitung, ID</span>`);

    // 3. Buat Titik Hub Negara Tujuan Ekspor Penerima Barang
    const destLat = selectedVessel.destLat ?? 0;
    const destLng = selectedVessel.destLng ?? 0;
    const destIcon = L.divIcon({
      className: "custom-node-dest",
      html: `<div style="background: rgba(168,85,247,0.2); border: 1px solid #a855f7; width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 8px #a855f7;"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
    destinationMarkerRef.current = L.marker([destLat, destLng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<strong style="color:#a855f7">DESTINATION HUB</strong><br><span style="color:#aaa">${selectedVessel.destination || "Unknown"}</span>`);

    // 4. Gambar Bulatan Kapal Utama yang Bergerak/Berpindah Sesuai Status Sinkron DB
    const vesselColor = selectedVessel.color || "#22d3ee";
    const vesselIcon = L.divIcon({
      className: "custom-active-vessel",
      html: `
        <div style="position: relative; width: 14px; height: 14px;">
          <div style="position: absolute; width: 100%; height: 100%; background: ${vesselColor}; border-radius: 50%; box-shadow: 0 0 14px ${vesselColor}, 0 0 4px #fff; border: 2px solid #fff; z-index: 2;"></div>
          <div style="position: absolute; width: 100%; height: 100%; background: ${vesselColor}; border-radius: 50%; scale: 2.2; opacity: 0.25; animation: pulse-glow 1.8s infinite ease-in-out; z-index: 1;"></div>
        </div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const vLat = selectedVessel.lat ?? 0;
    const vLng = selectedVessel.lng ?? 0;
    vesselMarkerRef.current = L.marker([vLat, vLng], { icon: vesselIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:'Share Tech Mono', monospace; background:#000; color:#fff; padding:4px;">
          <b style="color:#22d3ee; font-size:12px;">${selectedVessel.id}</b><br>
          STATUS: <span style="color:${vesselColor}">${selectedVessel.status}</span><br>
          TUJUAN: ${selectedVessel.destination}
        </div>
      `);

    // Arahkan kamera peta ke lokasi bulatan armada aktif berada secara smooth fly
    map.flyTo([vLat, vLng], 5, { animate: true, duration: 1.2 });
  }, [selectedVessel, leafletLoaded]);

  if (!selectedVessel) {
    return (
      <div style={{ background: "#06060e", color: "#6b7280", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Share Tech Mono', monospace" }}>
        [ REKORD DATA ARMADA DI NEON DB KOSONG / LOADING TELEMETRI... ]
      </div>
    );
  }

  return (
    <>
      {/* Google Fonts diload secara eksternal melalui link terpisah agar anti-error */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" />

      {/* 1. Inject JavaScript Leaflet secara asynchronous */}
      <Script 
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        onLoad={() => setLeafletLoaded(true)}
      />

      {/* 2. Link Stylesheet Bawaan Leaflet */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      
      <style>{`
        /* 🌟 FIX UTAMA DROPDOWN BLOCKED: Paksa Topbar/Header menembus z-index radar peta */
        header, nav, .prime-topbar, [class*="topbar"], [class*="Topbar"] {
          position: relative !important;
          z-index: 99999 !important;
        }

        .live-root { display: flex; height: calc(100vh - 56px); background: #05050a; overflow: hidden; position: relative; font-family: 'Share Tech Mono', monospace; }
        .live-map { flex: 1; position: relative; height: 100%; }
        
        /* HUD UI OVERLAYS */
        .hud-sidebar-left { position: absolute; top: 20px; left: 20px; width: 280px; background: linear-gradient(135deg, rgba(10,10,18,0.95) 0%, rgba(5,5,10,0.95) 100%); border: 1px solid rgba(34,211,238,0.15); border-radius: 8px; z-index: 1000; padding: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
        .hud-sidebar-right { position: absolute; top: 20px; right: 20px; width: 220px; background: rgba(8,8,16,0.9); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; z-index: 1000; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.6); backdrop-filter: blur(2px); }
        .vessel-selector { position: absolute; bottom: 85px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 1000; background: rgba(6,6,12,0.85); padding: 6px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(6px); max-width: 90vw; overflow-x: auto; scrollbar-width: none; }
        .vessel-selector::-webkit-scrollbar { display: none; }
        
        .vessel-btn { background: transparent; border: 1px solid transparent; color: #6b7280; padding: 6px 16px; font-size: 11px; font-family: 'Orbitron', sans-serif; font-weight: 700; border-radius: 20px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .vessel-btn.active { color: #fff; background: rgba(34,211,238,0.15); border-color: rgba(34,211,238,0.4); box-shadow: 0 0 10px rgba(34,211,238,0.2); }
        
        .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 14px; }
        .detail-label { font-size: 9px; color: #4b5563; letter-spacing: 0.05em; text-transform: uppercase; }
        .detail-value { font-size: 13px; color: #e5e7eb; font-weight: bold; margin-top: 2px; }
        
        .top-chip { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; }
        .telemetry-chip { background: rgba(10,10,20,0.9); border: 1px solid rgba(34,211,238,0.2); border-radius: 4px; padding: 6px 16px; display: flex; gap: 20px; align-items: center; box-shadow: 0 0 15px rgba(0,0,0,0.5); }
        .telemetry-label { font-size: 9px; color: #22d3ee; letter-spacing: 0.1em; }
        .telemetry-time { font-size: 11px; color: #fff; font-family: 'Orbitron', sans-serif; font-weight: bold; }
        
        .controls { position: absolute; bottom: 25px; right: 20px; display: flex; flex-direction: column; gap: 6px; z-index: 1000; }
        .control-btn { width: 32px; height: 32px; background: rgba(10,10,18,0.9); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .control-btn:hover { background: #22d3ee; color: #000; border-color: #22d3ee; }
        
        .bottom-metrics { position: absolute; bottom: 20px; left: 20px; display: flex; gap: 10px; z-index: 1000; }
        .metric-pill { background: rgba(8,8,14,0.9); border: 1px solid rgba(255,255,255,0.05); border-radius: 4px; padding: 6px 12px; display: flex; flex-direction: column; min-width: 90px; }
        .metric-label { font-size: 8px; color: #4b5563; text-transform: uppercase; }
        .metric-value { font-size: 11px; color: #d1d5db; margin-top: 2px; }
        
        .leaflet-popup-content-wrapper { background: #000002 !important; border: 1px solid rgba(255,255,255,0.15) !important; color: #fff !important; border-radius: 4px !important; }
        .leaflet-popup-tip { background: #000002 !important; border: 1px solid rgba(255,255,255,0.15) !important; }
        
        @keyframes pulse-glow {
          0% { transform: scale(1.0); opacity: 0.35; }
          50% { transform: scale(2.2); opacity: 0.0; }
          100% { transform: scale(1.0); opacity: 0.35; }
        }
      `}</style>

      {/* 🌟 WRAPPER TOPBAR: Menjaga dropdown menu aman di kasta teratas z-index */}
      <div style={{ position: "relative", zIndex: 99999 }}>
        <PrimeTopbar />
      </div>
      
      <main className="live-root">
        <section className="live-map">
          {/* Menggunakan ref langsung pada wadah peta */}
          <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#040408" }} />

          {/* SIDEBAR DETIL RADAR KIRI */}
          <aside className="hud-sidebar-left">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "15px", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, color: "#fff", letterSpacing: "0.02em" }}>{selectedVessel.id}</h2>
                <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>RADAR TELEMETRY NODE</div>
              </div>
              <span style={{
                background: `${selectedVessel.color || "#22d3ee"}15`, color: selectedVessel.color || "#22d3ee", border: `1px solid ${selectedVessel.color || "#22d3ee"}44`,
                fontSize: "9px", padding: "3px 8px", borderRadius: "3px", fontWeight: "bold"
              }}>{selectedVessel.status}</span>
            </div>

            <div className="detail-grid">
              <div>
                <div className="detail-label">Koordinat GPS</div>
                <div className="detail-value" style={{ fontSize: "11px", color: "#22d3ee" }}>{selectedVessel.coordinates}</div>
              </div>
              <div>
                <div className="detail-label">Kecepatan Log</div>
                <div className="detail-value">{selectedVessel.speed}</div>
              </div>
              <div>
                <div className="detail-label">Sisa Bahan Bakar</div>
                <div className="detail-value" style={{ color: (selectedVessel.fuel ?? 0) < 50 ? "#f87171" : "#4ade80" }}>{selectedVessel.fuel}%</div>
              </div>
              <div>
                <div className="detail-label">Kondisi Sinyal</div>
                <div className="detail-value" style={{ fontSize: "10px" }}>{selectedVessel.signal}</div>
              </div>
              <div>
                <div className="detail-label">Negara Tujuan</div>
                <div className="detail-value" style={{ color: "#a855f7" }}>{selectedVessel.destination}</div>
              </div>
              <div>
                <div className="detail-label">Estimasi Tiba (ETA)</div>
                <div className="detail-value" style={{ color: "#fff" }}>{selectedVessel.eta}</div>
              </div>
            </div>
          </aside>

          {/* CHIP ATAS JAM SATELIT */}
          <div className="top-chip">
            <div className="telemetry-chip">
              <div className="telemetry-label">TACTICAL CORE ASSIST</div>
              <div className="telemetry-time">CLOCK: {lastSync}</div>
            </div>
          </div>

          {/* PILIHAN ARMADA DARI DATABASE DI BAGIAN BAWAH */}
          <div className="vessel-selector">
            {vessels.map((v, idx) => (
              <button
                key={v.id || idx}
                className={`vessel-btn ${idx === selectedIndex ? "active" : ""}`}
                onClick={() => setSelectedIndex(idx)}
              >
                {v.id}
              </button>
            ))}
          </div>

          {/* ZOOM CONTROLS CUSTOM */}
          <div className="controls">
            <button type="button" className="control-btn" onClick={() => mapInstanceRef.current?.zoomIn()}>+</button>
            <button type="button" className="control-btn" onClick={() => mapInstanceRef.current?.zoomOut()}>-</button>
          </div>

          {/* METRIKS BAWAH SENSOR CUACA */}
          <div className="bottom-metrics">
            {bottomMetrics.map((metric) => (
              <div key={metric.label} className="metric-pill">
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">
                  <strong style={{ color: "#fff", marginRight: "3px" }}>
                    {metric.label === "Wind Speed" ? selectedVessel.wind : metric.label === "Wave Height" ? selectedVessel.wave : selectedVessel.load}
                  </strong>
                  <span style={{ color: "#4b5563", fontSize: "9px" }}>{metric.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SIDEBAR MONITORING STATIK KANAN */}
        <aside className="hud-sidebar-right">
          <div style={{ color: "#22d3ee", fontSize: "8px", letterSpacing: "1px", marginBottom: "4px" }}>REAL-TIME GPS SAT_TRACK</div>
          <div style={{ color: "#fff", fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px", marginBottom: "10px" }}>
            ORBIT SYSTEM LINK
          </div>
          <div style={{ fontSize: "9px", color: "#9ca3af", marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>ORBITER ST:</span><span style={{ color: "#4ade80" }}>CONNECTED</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>SYS LATENCY:</span><span style={{ color: "#22d3ee" }}>14 MS</span>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
