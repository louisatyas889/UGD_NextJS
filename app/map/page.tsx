"use client";
import { useState, useEffect, useRef } from "react";
import PrimeTopbar from "../ui/PrimeTopbar";

// Interface tetap sama
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
}

export default function MapPage() {
  const [time, setTime] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);

  useEffect(() => {
    const updateTime = () => {
      const n = new Date();
      let h = n.getHours();
      const m = String(n.getMinutes()).padStart(2, "0");
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h}:${m} ${ap}`);
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

      const map = L.map(mapRef.current, {
        center: [5, 110],
        zoom: 5,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map);

      const vessels: Vessel[] = [
        { lat: 15.0, lng: 95.0, id: "PL-992-BUMI", speed: "14.2 Knots", fuel: "82%", diag: "NO ISSUES", signal: "98.4%", weather: "OPTIMAL", color: "#a855f7" },
        { lat: 5.0, lng: 115.0, id: "PL-105-MARS", speed: "12.4 Knots", fuel: "78%", diag: "NO ISSUES", signal: "95.2%", weather: "OPTIMAL", color: "#22d3ee" },
        { lat: -2.0, lng: 120.0, id: "PL-441-MOON", speed: "10.8 Knots", fuel: "45%", diag: "ENGINE WARN", signal: "88.1%", weather: "STORMY", color: "#f87171" }
      ];

      vessels.forEach((v) => {
        const icon = L.divIcon({
          className: "custom-vessel-icon",
          html: `<div class="pulse-wrapper"><div class="pulse-ring" style="border-color: ${v.color}"></div><div class="dot" style="background: ${v.color}; box-shadow: 0 0 10px ${v.color}"></div></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);

        const content = `
          <div class="prime-popup">
            <div class="pop-header">
              <span class="pop-label">LIVE TELEMETRY</span>
              <div class="pop-title-row">
                <span class="pop-title">STATUS ARMADA</span>
                <span class="pop-tag">REGION: SE-AS2</span>
              </div>
            </div>
            <div class="pop-body">
              <div class="pop-info"><span>Vessel Speed</span> <strong>${v.speed}</strong></div>
              <div class="pop-info"><span>Fuel Remaining</span> <strong style="color:#22d3ee">${v.fuel}</strong></div>
              <div class="pop-divider"></div>
              <div class="pop-info"><span>Diagnostic</span> <strong style="color:${v.diag === 'NO ISSUES' ? '#4ade80' : '#f87171'}">${v.diag}</strong></div>
              <div class="pop-footer">
                <div class="pop-sub">F-V2 SIGNAL <span>${v.signal}</span></div>
                <div class="pop-sub">WEATHER <span>${v.weather}</span></div>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(content, {
          className: 'custom-prime-popup',
          minWidth: 220,
          closeButton: false
        });
      });

      leafletRef.current = map;
    };

    document.head.appendChild(script);
  }, []);

  return (
    <div className="map-page-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&family=Rajdhani:wght@500;700&display=swap');

        .map-page-container { width: 100vw; height: 100vh; background: #000; position: relative; overflow: hidden; }
        
        /* Ini kunci perbaikannya agar Topbar tidak hilang */
        .topbar-fixed-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 9999 !important; /* Nilai tertinggi agar selalu di depan map */
        }

        #map-el { width: 100%; height: 100%; z-index: 1; }

        .pulse-wrapper { position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
        .pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid; animation: pulse 2s infinite; opacity: 0; }
        .dot { width: 8px; height: 8px; border-radius: 50%; z-index: 2; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }

        .custom-prime-popup .leaflet-popup-content-wrapper { background: rgba(10, 10, 15, 0.95) !important; color: #fff !important; border-left: 3px solid #a855f7; border-radius: 2px !important; backdrop-filter: blur(10px); padding: 0 !important; }
        .custom-prime-popup .leaflet-popup-content { margin: 0 !important; width: 220px !important; }
        .custom-prime-popup .leaflet-popup-tip { display: none; }
        .prime-popup { padding: 15px; font-family: 'Rajdhani', sans-serif; }
        .pop-label { font-family: 'Share Tech Mono'; font-size: 7px; color: #4b5563; letter-spacing: 2px; }
        .pop-title-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 2px; }
        .pop-title { font-family: 'Orbitron'; font-size: 14px; font-weight: 700; }
        .pop-tag { font-family: 'Share Tech Mono'; font-size: 7px; color: #a855f7; }
        .pop-body { margin-top: 15px; }
        .pop-info { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; color: #9ca3af; }
        .pop-info strong { color: #fff; font-family: 'Share Tech Mono'; }
        .pop-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 10px 0; }
        .pop-footer { margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px; }
        .pop-sub { display: flex; justify-content: space-between; font-size: 8px; color: #4b5563; font-family: 'Share Tech Mono'; margin-bottom: 2px; }
        .pop-sub span { color: #fff; }

        .map-time { position: absolute; top: 80px; right: 20px; z-index: 1000; text-align: right; }
        .status-bar { position: absolute; bottom: 0; width: 100%; height: 25px; background: rgba(0,0,0,0.8); z-index: 1000; border-top: 1px solid #111; display: flex; align-items: center; padding: 0 20px; font-family: 'Share Tech Mono'; font-size: 8px; color: #4b5563; justify-content: space-between; }
      `}</style>

      {/* Gunakan wrapper absolut dengan z-index tinggi agar layout Topbar tidak rusak */}
      <div className="topbar-fixed-wrapper">
        <PrimeTopbar />
      </div>

      <div id="map-el" ref={mapRef} />

      <div className="map-time">
        <div style={{color: "#22d3ee", fontFamily: "'Share Tech Mono'", fontSize: 8}}>REAL-TIME GPS</div>
        <div style={{color: "#fff", fontFamily: "'Share Tech Mono'", fontSize: 10}}>LAST UPDATE: {time}</div>
      </div>

      <div className="status-bar">
        <div>● SYSTEM: OPERATIONAL // AUTH_TOKEN: X-771-KPR</div>
        <div>GRID: MERCATOR_WGS84 // LATENCY: 14MS</div>
      </div>
    </div>
  );
}
