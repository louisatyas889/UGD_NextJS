"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PrimeTopbar from "../../ui/PrimeTopbar"; 

// HELPER: Koordinat Default Negara Tujuan (Fallback otomatis jika jalur rute di DB kosong)
const getDestinationCoordinates = (code: string): [number, number] => {
  switch (code?.toUpperCase()) {
    case "SG": return [1.3521, 103.8198];
    case "PH": return [14.5995, 120.9842];
    case "CN": return [31.2304, 121.4737];
    case "TH": return [13.7563, 100.5018];
    case "JP": return [35.6762, 139.6503];
    default: return [0.0, 100.0];
  }
};

// HELPER: Penamaan Pelabuhan Lengkap Berdasarkan Kode Negara
const getFullDestinationName = (code: string) => {
  switch (code?.toUpperCase()) {
    case "SG": return "PORT OF SINGAPORE (SG)";
    case "PH": return "PORT OF MANILA (PH)";
    case "CN": return "PORT OF SHANGHAI (CN)";
    case "TH": return "PORT OF BANGKOK (TH)";
    case "JP": return "PORT OF TOKYO (JP)";
    default: return `PORT OF DESTINATION (${code || "INT"})`;
  }
};

export default function LogisticOptimizePage() {
  // STATE UNTUK DATABASE NEON
  const [fleetVesselsRaw, setFleetVesselsRaw] = useState<any[]>([]);
  const [vesselRoutesRaw, setVesselRoutesRaw] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);


  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0); 
  const [lastSync, setLastSync] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);

  // 1. AMBIL DATA LEWAT API ROUTE DATABASE NEON
  useEffect(() => {
    async function fetchNeonData() {
      try {
        const response = await fetch("/api/maritime-data");
        const data = await response.json();

        if (!response.ok) {
          setApiError(data?.error ? String(data.error) : "Gagal mengambil data");
          setFleetVesselsRaw([]);
          setVesselRoutesRaw([]);
          return;
        }

        // API saat ini hanya mengirim fleetVessels (dengan field routes nested)
        setFleetVesselsRaw((data?.fleetVessels || []) as any[]);
        setVesselRoutesRaw((data?.vesselRoutes || []) as any[]); // tetap ada untuk kompatibilitas (kalau suatu saat API dikembangkan)
        setApiError(null);

      } catch (error) {
        console.error("Gagal mengambil data dari API Maritime:", error);
        setApiError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }

    }
    fetchNeonData();
    // Opsional: Polling data tiap 30 detik
    const interval = setInterval(fetchNeonData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. OTOMATIS SINKRONISASI JALUR BERDASARKAN VESSEL_ID KE FORMAT UI ANDA
  const integratedFleetData = useMemo(() => {
    if (!fleetVesselsRaw.length) return [];

    return fleetVesselsRaw.map((vessel) => {
      // API sekarang mengirim routes nested dalam fleetVessels
      const matchedRoutes = vessel.routes && vessel.routes.length > 0 ? vessel.routes : [];

      let finalRoutes: any[] = [];

      // Helper untuk parse jalur_koordinat menjadi [lat,lng][]
      const parseCoords = (raw: any): [number, number][] => {
        if (!raw) return [];

        // Jika DB mengirim string JSON
        if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }

        // Jika DB mengirim array langsung
        if (Array.isArray(raw)) return raw as [number, number][];

        return [];
      };

      if (matchedRoutes.length > 0) {
        const sortedRoutes = [...matchedRoutes].sort((a, b) => (a.nomor_rute || 0) - (b.nomor_rute || 0));

        finalRoutes = sortedRoutes.map((r) => {
          const parsedCoords = parseCoords(r.jalur_koordinat);

          return {
            id: r.nomor_rute ?? r.id,
            name: r.status_rute === "ACTIVE" || r.status_rute === "Aktif" ? "Rute Utama" : `AI ${r.status_rute}`,
            label: r.nomor_rute === 1 ? "UTAMA" : r.nomor_rute === 2 ? "ALT A" : "ALT B",
            type: r.status_rute,
            coords: parsedCoords,
          };
        });
      }

      // Kalau ternyata DB punya routes tapi coords kosong/invalid, jangan tampilkan fallback sembarangan,
      // karena tujuan masalahnya: garis tidak muncul padahal rute ada.
      // Kita tetap buat fallback hanya kalau TIDAK ada route sama sekali.
      if (!finalRoutes.length && (!vessel.routes || vessel.routes.length === 0)) {
        const origin: [number, number] = [
          Number(vessel.current_lat) || -2.5236,
          Number(vessel.current_lng) || 106.1858,
        ];
        const dest = getDestinationCoordinates(vessel.destination);
        const midUtama: [number, number] = [(origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2];

        finalRoutes = [
          { id: 1, name: "Rute Utama (Dinamis)", label: "UTAMA", type: "Aktif", coords: [origin, midUtama, dest] },
          { id: 2, name: "AI Alternatif A", label: "ALT A", type: "Alternatif A", coords: [origin, [midUtama[0] + 1.5, midUtama[1] - 1.5], dest] },
          { id: 3, name: "AI Alternatif B", label: "ALT B", type: "Alternatif B", coords: [origin, [midUtama[0] - 1.5, midUtama[1] + 1.5], dest] },
        ];
      }

      return {
        id: vessel.id,
        name: vessel.id.replace(/-/g, " "),
        destination: getFullDestinationName(vessel.destination),
        color: vessel.status_color || "#22d3ee",
        status: vessel.status,
        routes: finalRoutes,
      };
    });
  }, [fleetVesselsRaw, vesselRoutesRaw]);


  const selectedVessel = useMemo(() => integratedFleetData[selectedIndex] || integratedFleetData[0], [integratedFleetData, selectedIndex]);
  const currentRoute = useMemo(() => selectedVessel?.routes?.[activeRouteIndex] || selectedVessel?.routes?.[0], [selectedVessel, activeRouteIndex]);

  // Reset rute variant ke Utama tiap kali ganti kapal
  useEffect(() => {
    setActiveRouteIndex(0);
  }, [selectedIndex]);

  // Realtime Telemetry Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLastSync(`${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")} UTC`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Map Initialization & Fix Error Zombie Map
  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return;
    let cancelled = false;

    const initMap = () => {
      if (cancelled || !mapRef.current) return;
      const L = (window as any).L;
      if (!L) return;
      leafletRef.current = L;

      const map = L.map(mapRef.current, { center: [5.0, 115.0], zoom: 4, zoomControl: false, attributionControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      setIsMapReady(true);
    };

    if ((window as any).L) { initMap(); }
    else {
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

    // FIX: Hapus instansiasi peta secara total saat unmount agar DOM bersih kembali
    return () => { 
      cancelled = true; 
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Map Drawing Logic & Safe Polyline Drawing
  useEffect(() => {
    if (!isMapReady) return;

    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    
    // FIX: Validasi map._container agar terhindar dari appendChild error pada strictmode
    if (!map || !L || !selectedVessel || !currentRoute || !map._container || !currentRoute.coords || currentRoute.coords.length === 0) return;

    if (routeLayerRef.current && map.hasLayer?.(routeLayerRef.current)) map.removeLayer(routeLayerRef.current);
    if (originMarkerRef.current && map.hasLayer?.(originMarkerRef.current)) map.removeLayer(originMarkerRef.current);
    if (destinationMarkerRef.current && map.hasLayer?.(destinationMarkerRef.current)) map.removeLayer(destinationMarkerRef.current);

    const originCoord = currentRoute.coords[0];
    const destCoord = currentRoute.coords[currentRoute.coords.length - 1];
    
    const isAiRoute = activeRouteIndex > 0;

    // Gambar Polyline Lintasan Jalur (Dengan Garis Putus-Putus)
    routeLayerRef.current = L.polyline(currentRoute.coords as [number, number][], { 
      color: isAiRoute ? "#c084fc" : selectedVessel.color, 
      weight: isAiRoute ? 4 : 3, 
      opacity: 0.9, 
      dashArray: "5, 10" // <--- Memastikan efek garis putus-putus
    }).addTo(map);

    // Titik Keberangkatan (Origin)
    const originIcon = L.divIcon({
      className: "serena-live-marker",
      html: `<div class="marker-core active"><div class="marker-ring" style="border-color:${selectedVessel.color}"></div><div class="marker-dot" style="background:${selectedVessel.color}; box-shadow:0 0 14px ${selectedVessel.color}"></div></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    originMarkerRef.current = L.marker(originCoord as [number, number], { icon: originIcon }).addTo(map);

    // Titik Tujuan Pelabuhan (Destination)
    const destIcon = L.divIcon({
      className: "serena-live-marker",
      html: `<div class="marker-core active"><div class="marker-ring" style="border-color:#4b5563"></div><div class="marker-dot" style="background:#2d3748;"></div></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    destinationMarkerRef.current = L.marker(destCoord as [number, number], { icon: destIcon }).addTo(map);
    
    // Fit Bounds Autofocus Rute Pelayaran
    try {
      const bounds = L.latLngBounds(currentRoute.coords as [number, number][]);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6, animate: true, duration: 1.2 });
      }
    } catch (e) {
      console.warn("Bounds Leaflet bermasalah", e);
    }

    // Cleanup layer on change/unmount
    return () => {
      const currentMap = mapInstanceRef.current;
      if (!currentMap || !currentMap._container) return;

      if (routeLayerRef.current && currentMap.hasLayer?.(routeLayerRef.current)) currentMap.removeLayer(routeLayerRef.current);
      if (originMarkerRef.current && currentMap.hasLayer?.(originMarkerRef.current)) currentMap.removeLayer(originMarkerRef.current);
      if (destinationMarkerRef.current && currentMap.hasLayer?.(destinationMarkerRef.current)) currentMap.removeLayer(destinationMarkerRef.current);
    };
  }, [selectedVessel, currentRoute, activeRouteIndex, isMapReady]);

  // Loading UI Screen
  if (isLoading || !Array.isArray(integratedFleetData) || integratedFleetData.length === 0) {
    return (
      <div style={{ background: "#0a0a10", color: apiError ? "#f87171" : "#22d3ee", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Orbitron, sans-serif", fontSize: "14px", letterSpacing: "0.1em", flexDirection: "column", gap: 10 }}>
        <div>{apiError ? `API ERROR: ${apiError}` : "MENYINKRONKAN ARMADA DATABASE NEON..."}</div>
      </div>
    );
  }


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
        
        .left-panel{position:absolute;top:16px;left:16px;z-index:20;width:350px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(10,10,20,0.85);backdrop-filter:blur(12px);box-shadow:0 16px 35px rgba(0,0,0,0.4);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 80px)}
        .panel-header{padding:18px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .panel-title{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.14em;color:#858594;text-transform:uppercase;margin-bottom:12px}
        
        .vessel-selector{display:flex;flex-direction:column;gap:6px}
        .vessel-btn{width:100%;padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:4px;color:#9ca3af;font-family:'Orbitron',sans-serif;font-size:11px;font-weight:600;letter-spacing:.05em;text-align:left;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:space-between}
        .vessel-btn.active{background:rgba(34,211,238,0.08);border-color:#22d3ee;color:#fff;box-shadow:inset 0 0 8px rgba(34,211,238,0.15)}
        .vessel-indicator{width:6px;height:6px;border-radius:50%;margin-right:10px;display:inline-block}

        .panel-body{padding:18px;display:flex;flex-direction:column;gap:16px;overflow-y:auto}
        
        /* UI SWAP CONTROL SEGMENTED TAB STYLE */
        .swap-wrapper{background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:4px;display:flex;position:relative}
        .swap-item{flex:1;text-align:center;padding:8px 0;font-family:'Share Tech Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.05em;color:#6b7280;cursor:pointer;z-index:2;transition:color 0.2s;text-transform:uppercase}
        .swap-item.active{color:#fff}
        .swap-slider{position:absolute;top:4px;bottom:4px;border-radius:4px;transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);z-index:1}

        .route-info{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:14px}
        .ri-label{font-family:'Share Tech Mono';font-size:9px;color:#6b7280;text-transform:uppercase;margin-bottom:4px}
        .ri-value{font-size:14px;color:#fff;font-weight:600}

        .top-chip{position:absolute;top:16px;right:16px;z-index:20}
        .telemetry-chip{padding:10px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(10,10,20,0.84);backdrop-filter:blur(12px);text-align:right}
        .telemetry-label{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:.18em;color:#22d3ee;text-transform:uppercase}
        .telemetry-time{margin-top:4px;font-family:'Share Tech Mono',monospace;font-size:10px;color:#e5e7eb}

        .controls{position:absolute;right:16px;bottom:22px;z-index:20;display:flex;flex-direction:column;gap:8px}
        .control-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;border:1px solid rgba(255,255,255,0.14);background:rgba(10,10,20,0.88);color:#22d3ee;cursor:pointer;font-size:18px}
        .control-btn:hover{background:#a855f7;color:#fff}

        .serena-live-marker{background:none !important;border:none !important}
        .marker-core{position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center}
        .marker-ring{position:absolute;width:100%;height:100%;border-radius:50%;border:2px solid;opacity:0}
        .marker-core.active .marker-ring{animation:pulse 1.5s infinite}
        .marker-dot{width:10px;height:10px;border-radius:50%;z-index:2}
        
        @keyframes pulse{0%{transform:scale(.6);opacity:1}100%{transform:scale(2.2);opacity:0}}
      `}</style>

      <PrimeTopbar />
      
      <main className="live-root">
        <section className="live-map">
          <div id="live-map-canvas" ref={mapRef} />
          <div className="map-shade" />
          
          <aside className="left-panel">
            <div className="panel-header">
              <div className="panel-title">FLEET MANAGEMENT LIST</div>
              <div className="vessel-selector">
                {integratedFleetData.map((v, idx) => (
                  <button 
                    key={v.id} 
                    className={`vessel-btn ${idx === selectedIndex ? "active" : ""}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="vessel-indicator" style={{ background: v.color }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', color: idx === selectedIndex ? '#fff' : '#d1d5db' }}>{v.name}</span>
                        <span style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>{v.destination}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="panel-body">
              <div className="route-info">
                <div className="ri-label">Status Navigasi</div>
                <div className="ri-value" style={{ color: selectedVessel?.status === "WEATHER DELAY" ? "#f87171" : "#4ade80" }}>
                  {selectedVessel?.status}
                </div>
              </div>

              {/* PANEL COMPONENT SWAP VARIANT */}
              <div>
                <div className="ri-label" style={{ marginBottom: "6px" }}>SWAP ROUTE VARIANT</div>
                <div className="swap-wrapper">
                  {selectedVessel?.routes?.map((route, rIdx) => (
                    <div
                      key={`${route.id}-${rIdx}`}
                      className={`swap-item ${rIdx === activeRouteIndex ? "active" : ""}`}
                      onClick={() => setActiveRouteIndex(rIdx)}
                    >
                      {route.label}
                    </div>
                  ))}
                  {/* Slide Slider Indicator */}
                  <div 
                    className="swap-slider" 
                    style={{
                      left: `calc(${activeRouteIndex} * 33.33% + 4px)`,
                      width: "calc(33.33% - 8px)",
                      background: activeRouteIndex === 0 ? "rgba(34,211,238,0.15)" : "rgba(192,132,252,0.22)",
                      border: `1px solid ${activeRouteIndex === 0 ? "#22d3ee" : "#c084fc"}`
                    }}
                  />
                </div>
              </div>

              {/* Tampilan Konten Dinamis Berdasarkan Hasil Swap */}
              <div className="route-info" style={{ 
                borderLeft: `3px solid ${activeRouteIndex > 0 ? "#c084fc" : selectedVessel?.color}`,
                background: activeRouteIndex > 0 ? "rgba(192,132,252,0.03)" : "rgba(255,255,255,0.01)"
              }}>
                <div className="ri-label" style={{ color: activeRouteIndex > 0 ? "#c084fc" : selectedVessel?.color }}>
                  {activeRouteIndex > 0 ? "OPTIMISASI AI AKTIF" : "RUTE JALUR STANDAR"}
                </div>
                <div className="ri-value" style={{ fontSize: 13 }}>
                  {currentRoute?.name}
                </div>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: "6px", lineHeight: 1.4 }}>
                  {activeRouteIndex === 0 && selectedVessel?.status === "WEATHER DELAY" 
                    ? "⚠️ Jalur ini mendeteksi cuaca buruk. Silakan swap panel di atas ke ALT A atau ALT B untuk mengubah arah koordinat kapal otomatis."
                    : activeRouteIndex === 1
                    ? "✨ Optimisasi Rute AI: Koordinat kapal digeser menjauhi pusat tekanan badai berawan tinggi."
                    : activeRouteIndex === 2 
                    ? "🔋 Mode Efisiensi: Jalur navigasi alternatif disesuaikan untuk menghemat konsumsi bahan bakar kapal."
                    : "Jalur rute utama berjalan normal, aman dan terpantau radar maritim."}
                </p>
              </div>

            </div>
          </aside>

          <div className="top-chip">
            <div className="telemetry-chip">
              <div className="telemetry-label">AI ROUTE TELEMETRY</div>
              <div className="telemetry-time">CLOCK: {lastSync}</div>
            </div>
          </div>

          <div className="controls">
            <button type="button" className="control-btn" onClick={() => mapInstanceRef.current?.zoomIn()}>+</button>
            <button type="button" className="control-btn" onClick={() => mapInstanceRef.current?.zoomOut()}>-</button>
          </div>
        </section>
      </main>
    </>
  );
}
