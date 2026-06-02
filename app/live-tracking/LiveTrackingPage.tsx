"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";

// Interface ini harus SAMA dengan bentuk data yang kamu hasilkan di page.tsx
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

const BANGKA_BELITUNG_COORD: [number, number] = [-2.1000, 106.1333];
const bottomMetrics = [{ label: "Wind Speed", unit: "m/s" }, { label: "Wave Height", unit: "m" }, { label: "Fleet Load", unit: "%" }] as const;

export default function LiveTrackingPage({ vessels }: { vessels: Vessel[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastSync, setLastSync] = useState("");
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);

  // Safety check: Pastikan data ada sebelum diakses
  const selectedVessel = useMemo(() => {
    if (!vessels || vessels.length === 0) return null;
    return vessels[selectedIndex] || vessels[0];
  }, [selectedIndex, vessels]);

  // Clock Sync
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

      const map = L.map(mapRef.current, { center: [12.0, 115.0], zoom: 4, zoomControl: false, attributionControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
    };

    if ((window as any).L) { initMap(); }
    else {
      // ... (Loading script Leaflet tetap sama seperti kode aslimu)
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    }
    return () => { cancelled = true; if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
  }, []);

  // Map Drawing Logic
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !selectedVessel) return;

    if (routeLayerRef.current) routeLayerRef.current.remove();
    if (originMarkerRef.current) originMarkerRef.current.remove();
    if (destinationMarkerRef.current) destinationMarkerRef.current.remove();

    const hasArrived = selectedVessel.status.toUpperCase() === "IN PORT";

    routeLayerRef.current = L.polyline(selectedVessel.route, { color: selectedVessel.color, weight: 3, opacity: 0.8, dashArray: "6 10" }).addTo(map);

    if (!hasArrived) {
       // ... (Logic drawing marker origin)
    }

    // ... (Logic drawing marker destination)

    if (hasArrived) {
      destinationMarkerRef.current.openPopup();
      map.flyTo([selectedVessel.lat, selectedVessel.lng], 5, { animate: true, duration: 1.2 });
    } else {
      map.flyTo([ (BANGKA_BELITUNG_COORD[0] + selectedVessel.lat) / 2, (BANGKA_BELITUNG_COORD[1] + selectedVessel.lng) / 2 ], 4, { animate: true, duration: 1.2 });
    }
  }, [selectedVessel]);

  if (!selectedVessel) return <div style={{color: '#fff', padding: 20}}>Loading Data Kapal...</div>;

  return (
    <>
      <style>{/* ... (CSS kamu tetap sama) ... */}</style>
      <PrimeTopbar />
      <main className="live-root">
        <section className="live-map">
          <div id="live-map-canvas" ref={mapRef} />
          {/* ... (Sisa JSX kamu menggunakan data dari 'selectedVessel' & 'vessels' prop) ... */}
          
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
          
          {/* Dan seterusnya ... */}
        </section>
      </main>
    </>
  );
}
