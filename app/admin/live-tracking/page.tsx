"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PrimeTopbar from "../../ui/PrimeTopbar";

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

const vessels: Vessel[] = [
  {
    id: "PL-882-BUMI",
    status: "SEDANG BERLAYAR",
    coordinates: `40\u00B0 41' 12" N, 74\u00B0 0' 54" W`,
    lat: 40.6892,
    lng: -74.0445,
    speed: "21 knots",
    fuel: 84,
    signal: "Terhubung (High Latency AI Optimization)",
    eta: "24 OKT 14:00",
    wind: "12.4",
    wave: "1.8",
    load: "92%",
    color: "#22d3ee",
    destination: "PORT OF ROTTERDAM",
    route: [
      [40.6892, -74.0445],
      [45.2, -46.8],
      [50.5, -18.2],
      [51.9244, 4.4777],
    ],
  },
  {
    id: "VX-441-MOON",
    status: "SEDANG BERLAYAR",
    coordinates: `34\u00B0 3' 8" N, 18\u00B0 25' 26" W`,
    lat: 34.0522,
    lng: -18.4239,
    speed: "19 knots",
    fuel: 71,
    signal: "Terhubung (Marine Mesh Stabilized)",
    eta: "26 OKT 07:20",
    wind: "9.6",
    wave: "1.2",
    load: "87%",
    color: "#a855f7",
    destination: "PORT OF ROTTERDAM",
    route: [
      [34.0522, -18.4239],
      [41.4, -10.8],
      [47.6, -1.5],
      [51.9244, 4.4777],
    ],
  },
  {
    id: "DS-112-MARS",
    status: "MAINTAINING COURSE",
    coordinates: `25\u00B0 46' 30" N, 45\u00B0 10' 12" W`,
    lat: 25.775,
    lng: -45.17,
    speed: "17 knots",
    fuel: 63,
    signal: "Terhubung (Satellite Relay Active)",
    eta: "27 OKT 10:45",
    wind: "14.1",
    wave: "2.1",
    load: "78%",
    color: "#4ade80",
    destination: "PORT OF ROTTERDAM",
    route: [
      [25.775, -45.17],
      [36.2, -31.4],
      [46.5, -8.8],
      [51.9244, 4.4777],
    ],
  },
];

const destinationNode = {
  lat: 51.9244,
  lng: 4.4777,
  label: "PORT OF ROTTERDAM",
};

const bottomMetrics = [
  { label: "Wind Speed", unit: "m/s" },
  { label: "Wave Height", unit: "m" },
  { label: "Fleet Load", unit: "%" },
] as const;

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
  const routeLayerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const selectedVessel = useMemo(
    () => vessels[clampIndex(selectedIndex)],
    [selectedIndex],
  );

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLastSync(
        `${String(now.getUTCHours()).padStart(2, "0")}:${String(
          now.getUTCMinutes(),
        ).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(
          2,
          "0",
        )} UTC`,
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return;

    let cancelled = false;

    const initMap = () => {
      if (cancelled || !mapRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      leafletRef.current = L;

      const map = L.map(mapRef.current, {
        center: [selectedVessel.lat, selectedVessel.lng],
        zoom: 4,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      const createVesselIcon = (color: string, active: boolean) =>
        L.divIcon({
          className: "serena-live-marker",
          html: `
            <div class="marker-core ${active ? "active" : ""}">
              <div class="marker-ring" style="border-color:${color}"></div>
              <div class="marker-dot" style="background:${color}; box-shadow:0 0 14px ${color}"></div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

      const destinationIcon = L.divIcon({
        className: "serena-destination-marker",
        html: `
          <div class="destination-core">
            <div class="destination-pulse"></div>
            <div class="destination-dot"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      destinationMarkerRef.current = L.marker(
        [destinationNode.lat, destinationNode.lng],
        { icon: destinationIcon },
      ).addTo(map);

      destinationMarkerRef.current.bindPopup(
        `
          <div class="serena-popup">
            <div class="popup-label">TARGET NODE</div>
            <div class="popup-title">${destinationNode.label}</div>
            <div class="popup-row"><span>STATUS</span><strong>OPEN BERTH</strong></div>
          </div>
        `,
        {
          className: "serena-leaflet-popup",
          closeButton: false,
          minWidth: 180,
        },
      );

      markersRef.current = vessels.map((vessel, index) => {
        const marker = L.marker([vessel.lat, vessel.lng], {
          icon: createVesselIcon(vessel.color, index === selectedIndex),
        }).addTo(map);

        marker.bindPopup(
          `
            <div class="serena-popup">
              <div class="popup-label">LIVE TRACKING</div>
              <div class="popup-title">${vessel.id}</div>
              <div class="popup-row"><span>STATUS</span><strong>${vessel.status}</strong></div>
              <div class="popup-row"><span>SPEED</span><strong>${vessel.speed}</strong></div>
              <div class="popup-row"><span>FUEL</span><strong>${vessel.fuel}%</strong></div>
            </div>
          `,
          {
            className: "serena-leaflet-popup",
            closeButton: false,
            minWidth: 200,
          },
        );

        marker.on("click", () => setSelectedIndex(index));
        return marker;
      });

      mapInstanceRef.current = map;
    };

    if ((window as any).L) {
      initMap();
    } else {
      const existingLink = document.querySelector(
        "link[data-serena-leaflet='true']",
      );
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
      markersRef.current = [];
      routeLayerRef.current = null;
      destinationMarkerRef.current = null;
    };
  }, [selectedIndex, selectedVessel.lat, selectedVessel.lng]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const createVesselIcon = (color: string, active: boolean) =>
      L.divIcon({
        className: "serena-live-marker",
        html: `
          <div class="marker-core ${active ? "active" : ""}">
            <div class="marker-ring" style="border-color:${color}"></div>
            <div class="marker-dot" style="background:${color}; box-shadow:0 0 14px ${color}"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

    markersRef.current.forEach((marker, index) => {
      marker.setIcon(
        createVesselIcon(vessels[index].color, index === selectedIndex),
      );
    });

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
    }

    routeLayerRef.current = L.polyline(selectedVessel.route, {
      color: "#22d3ee",
      weight: 3,
      opacity: 0.9,
      dashArray: "6 10",
    }).addTo(map);

    const marker = markersRef.current[selectedIndex];
    if (marker) {
      marker.openPopup();
    }

    map.flyTo([selectedVessel.lat, selectedVessel.lng], 4, {
      animate: true,
      duration: 1.2,
    });
  }, [selectedIndex, selectedVessel]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');

        *,*::before,*::after{box-sizing:border-box}
        html,body{background:#0a0a10;color:#e5e7eb;font-family:'Rajdhani',sans-serif;min-height:100vh}

        .live-root{
          position:relative;
          min-height:calc(100vh - 46px);
          background:
            radial-gradient(circle at top left, rgba(34,211,238,0.08), transparent 24%),
            radial-gradient(circle at top right, rgba(168,85,247,0.10), transparent 22%),
            #0a0a10;
          overflow:hidden;
        }

        .live-map{
          position:relative;
          height:calc(100vh - 46px);
          min-height:680px;
          overflow:hidden;
        }

        #live-map-canvas{
          position:absolute;
          inset:0;
          z-index:1;
        }

        .map-shade{
          position:absolute;
          inset:0;
          z-index:2;
          pointer-events:none;
          background:
            radial-gradient(circle at 30% 20%, rgba(34,211,238,0.06), transparent 20%),
            linear-gradient(180deg, rgba(3,6,14,0.22), rgba(3,6,14,0.46));
        }

        .map-grid{
          position:absolute;
          inset:0;
          z-index:2;
          pointer-events:none;
          background:
            linear-gradient(0deg, rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size:42px 42px;
          opacity:.55;
        }

        .left-panel{
          position:absolute;
          top:16px;
          left:16px;
          z-index:20;
          width:min(92vw,320px);
          border-radius:6px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(10,10,20,0.84);
          backdrop-filter:blur(12px);
          box-shadow:0 16px 35px rgba(0,0,0,0.38);
          overflow:hidden;
        }

        .panel-header{
          padding:18px 18px 14px;
          border-bottom:1px solid rgba(255,255,255,0.06);
        }

        .panel-title{
          font-family:'Share Tech Mono',monospace;
          font-size:10px;
          letter-spacing:.18em;
          color:#e5e7eb;
          text-transform:uppercase;
        }

        .panel-status{
          margin-top:12px;
          display:flex;
          align-items:center;
          gap:8px;
          font-family:'Share Tech Mono',monospace;
          font-size:10px;
          letter-spacing:.14em;
          text-transform:uppercase;
          color:#22d3ee;
        }

        .status-dot{
          width:7px;
          height:7px;
          border-radius:50%;
          background:#22d3ee;
          box-shadow:0 0 10px #22d3ee;
          animation:blink 1.6s ease-in-out infinite;
        }

        .panel-body{
          padding:16px 18px 18px;
          display:flex;
          flex-direction:column;
          gap:14px;
        }

        .detail-row{
          display:flex;
          gap:12px;
          align-items:flex-start;
        }

        .detail-icon{
          width:34px;
          height:34px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:6px;
          border:1px solid rgba(255,255,255,0.07);
          background:rgba(255,255,255,0.03);
          color:#22d3ee;
          flex-shrink:0;
        }

        .detail-label{
          font-family:'Share Tech Mono',monospace;
          font-size:9px;
          letter-spacing:.16em;
          color:#6b7280;
          text-transform:uppercase;
          margin-bottom:4px;
        }

        .detail-value{
          font-size:13px;
          color:#e5e7eb;
          line-height:1.5;
        }

        .fuel-card{
          border:1px solid rgba(255,255,255,0.06);
          background:rgba(255,255,255,0.025);
          border-radius:6px;
          padding:14px;
        }

        .fuel-top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:10px;
        }

        .fuel-track{
          width:100%;
          height:10px;
          border-radius:999px;
          overflow:hidden;
          background:rgba(255,255,255,0.08);
        }

        .fuel-fill{
          height:100%;
          border-radius:999px;
          background:linear-gradient(90deg,#22d3ee,#38bdf8);
          box-shadow:0 0 18px rgba(34,211,238,0.38);
        }

        .action-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
          padding-top:2px;
        }

        .assist-copy{
          flex:1;
        }

        .intervene-btn{
          border:none;
          border-radius:6px;
          padding:11px 16px;
          background:rgba(34,211,238,0.16);
          border:1px solid rgba(34,211,238,0.32);
          color:#cffafe;
          font-family:'Share Tech Mono',monospace;
          font-size:10px;
          letter-spacing:.14em;
          text-transform:uppercase;
          cursor:pointer;
          box-shadow:0 0 18px rgba(34,211,238,0.18);
        }

        .top-chip{
          position:absolute;
          top:16px;
          right:16px;
          z-index:20;
          display:flex;
          flex-direction:column;
          gap:10px;
          align-items:flex-end;
        }

        .telemetry-chip{
          padding:10px 14px;
          border-radius:6px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(10,10,20,0.84);
          backdrop-filter:blur(12px);
          text-align:right;
        }

        .telemetry-label{
          font-family:'Share Tech Mono',monospace;
          font-size:8px;
          letter-spacing:.18em;
          color:#22d3ee;
          text-transform:uppercase;
        }

        .telemetry-time{
          margin-top:4px;
          font-family:'Share Tech Mono',monospace;
          font-size:10px;
          color:#e5e7eb;
        }

        .controls{
          position:absolute;
          right:16px;
          bottom:22px;
          z-index:20;
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .control-btn{
          width:34px;
          height:34px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:6px;
          border:1px solid rgba(255,255,255,0.14);
          background:rgba(10,10,20,0.88);
          color:#22d3ee;
          cursor:pointer;
          font-size:18px;
          transition:all .2s ease;
        }

        .control-btn:hover{
          background:#a855f7;
          color:#fff;
          border-color:#fff;
        }

        .bottom-metrics{
          position:absolute;
          left:50%;
          bottom:18px;
          transform:translateX(-50%);
          z-index:20;
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          justify-content:center;
          width:calc(100% - 40px);
          max-width:480px;
        }

        .metric-pill{
          min-width:110px;
          padding:12px 14px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(10,10,20,0.72);
          backdrop-filter:blur(12px);
          text-align:center;
          box-shadow:0 12px 28px rgba(0,0,0,0.32);
        }

        .metric-label{
          font-family:'Share Tech Mono',monospace;
          font-size:8px;
          letter-spacing:.16em;
          color:#6b7280;
          text-transform:uppercase;
        }

        .metric-value{
          margin-top:6px;
          display:flex;
          align-items:flex-end;
          justify-content:center;
          gap:4px;
          font-family:'Orbitron',sans-serif;
          color:#fff;
        }

        .metric-value strong{
          font-size:20px;
          color:#22d3ee;
          text-shadow:0 0 16px rgba(34,211,238,0.28);
        }

        .metric-value span{
          font-size:9px;
          color:#94a3b8;
          letter-spacing:.14em;
          text-transform:uppercase;
          padding-bottom:2px;
        }

        .leaflet-container{
          background:#04050a !important;
          font-family:'Rajdhani',sans-serif;
        }

        .serena-live-marker{background:none !important;border:none !important}
        .marker-core{
          position:relative;
          width:30px;
          height:30px;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .marker-ring{
          position:absolute;
          width:100%;
          height:100%;
          border-radius:50%;
          border:2px solid;
          animation:pulse 2s infinite;
          opacity:0;
        }

        .marker-core.active .marker-ring{
          animation-duration:1.35s;
        }

        .marker-dot{
          width:9px;
          height:9px;
          border-radius:50%;
          z-index:2;
        }

        .destination-core{
          position:relative;
          width:28px;
          height:28px;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .destination-pulse{
          position:absolute;
          width:100%;
          height:100%;
          border-radius:50%;
          border:2px solid rgba(168,85,247,0.42);
          animation:pulse 1.8s infinite;
        }

        .destination-dot{
          width:10px;
          height:10px;
          border-radius:50%;
          background:#c084fc;
          box-shadow:0 0 14px #c084fc;
        }

        .serena-leaflet-popup .leaflet-popup-content-wrapper{
          background:rgba(10,10,20,0.96) !important;
          border-left:3px solid #22d3ee;
          border-radius:4px !important;
          padding:0 !important;
          box-shadow:0 10px 30px rgba(0,0,0,0.45);
        }

        .serena-leaflet-popup .leaflet-popup-content{
          margin:0 !important;
          width:200px !important;
        }

        .serena-leaflet-popup .leaflet-popup-tip{
          background:rgba(10,10,20,0.96) !important;
        }

        .serena-popup{
          padding:14px;
          font-family:'Rajdhani',sans-serif;
          color:#e5e7eb;
        }

        .popup-label{
          font-family:'Share Tech Mono',monospace;
          font-size:8px;
          letter-spacing:.2em;
          color:#6b7280;
          text-transform:uppercase;
        }

        .popup-title{
          margin-top:4px;
          font-family:'Orbitron',sans-serif;
          font-size:13px;
          color:#fff;
        }

        .popup-row{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-top:8px;
          font-size:12px;
          color:#9ca3af;
        }

        .popup-row strong{
          color:#fff;
          font-family:'Share Tech Mono',monospace;
          font-size:10px;
        }

        @keyframes blink{
          0%,100%{opacity:1}
          50%{opacity:.3}
        }

        @keyframes pulse{
          0%{transform:scale(.55);opacity:.85}
          100%{transform:scale(2);opacity:0}
        }

        @media (max-width: 900px){
          .live-map{min-height:780px}
          .left-panel{
            position:absolute;
            left:10px;
            right:10px;
            top:10px;
            width:auto;
          }
          .top-chip{
            top:auto;
            right:10px;
            bottom:110px;
          }
          .controls{
            right:10px;
            bottom:18px;
          }
          .bottom-metrics{
            bottom:18px;
            max-width:360px;
          }
        }

        @media (max-width: 560px){
          .live-map{min-height:860px}
          .panel-body{gap:12px}
          .action-row{
            flex-direction:column;
            align-items:flex-start;
          }
          .intervene-btn{width:100%}
          .bottom-metrics{
            width:calc(100% - 20px);
            gap:8px;
          }
          .metric-pill{
            width:100%;
          }
        }
      `}</style>

      <PrimeTopbar />

      <main className="live-root">
        <section className="live-map">
          <div id="live-map-canvas" ref={mapRef} />
          <div className="map-shade" />
          <div className="map-grid" />

          <aside className="left-panel">
            <div className="panel-header">
              <div className="panel-title">
                DETAIL KAPAL PILIHAN: {selectedVessel.id}
              </div>
              <div className="panel-status">
                <span className="status-dot" />
                <span>STATUS: {selectedVessel.status}</span>
              </div>
            </div>

            <div className="panel-body">
              {[
                {
                  label: "Koordinat",
                  value: selectedVessel.coordinates,
                  icon: (
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z M12 10a2.5 2.5 0 1 0 0 .1Z" />
                  ),
                },
                {
                  label: "Kecepatan",
                  value: selectedVessel.speed,
                  icon: (
                    <path d="M20 13a8 8 0 1 0-16 0 M12 13l4-4 M5 19h14" />
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="detail-row">
                  <div className="detail-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <div className="detail-label">{item.label}</div>
                    <div className="detail-value">{item.value}</div>
                  </div>
                </div>
              ))}

              <div className="fuel-card">
                <div className="fuel-top">
                  <div className="detail-label">Level Bahan Bakar</div>
                  <div
                    className="detail-label"
                    style={{ color: "#22d3ee", marginBottom: 0 }}
                  >
                    {selectedVessel.fuel}%
                  </div>
                </div>
                <div className="fuel-track">
                  <div
                    className="fuel-fill"
                    style={{ width: `${selectedVessel.fuel}%` }}
                  />
                </div>
              </div>

              {[
                {
                  label: "Sinyal Satelit",
                  value: selectedVessel.signal,
                  icon: (
                    <path d="M4 18h1 M7 14h1 M10 10h1 M13 6h1 M16 3l5 5 M21 3v5h-5" />
                  ),
                },
                {
                  label: "Estimasi Kedatangan",
                  value: selectedVessel.eta,
                  icon: (
                    <path d="M12 8v4l2.5 2.5 M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="detail-row">
                  <div className="detail-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <div className="detail-label">{item.label}</div>
                    <div className="detail-value">{item.value}</div>
                  </div>
                </div>
              ))}

              <div className="action-row">
                <div className="assist-copy">
                  <div className="detail-label">Live Route Assist</div>
                  <div className="detail-value">
                    Tracking node aktif. Satellite relay stabilized.
                  </div>
                </div>
                <button type="button" className="intervene-btn">
                  INTERVENSI
                </button>
              </div>
            </div>
          </aside>

          <div className="top-chip">
            <div className="telemetry-chip">
              <div className="telemetry-label">REAL-TIME GPS</div>
              <div className="telemetry-time">LAST UPDATE: {lastSync}</div>
            </div>
          </div>

          <div className="controls">
            <button
              type="button"
              className="control-btn"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="control-btn"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              aria-label="Zoom out"
            >
              -
            </button>
            <button
              type="button"
              className="control-btn"
              onClick={() =>
                mapInstanceRef.current?.flyTo(
                  [selectedVessel.lat, selectedVessel.lng],
                  4,
                  {
                    animate: true,
                    duration: 1,
                  },
                )
              }
              aria-label="Center selected vessel"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="m12 7 2 5-5 2" />
              </svg>
            </button>
          </div>

          <div className="bottom-metrics">
            {bottomMetrics.map((metric) => (
              <div key={metric.label} className="metric-pill">
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">
                  <strong>
                    {metric.label === "Wind Speed"
                      ? selectedVessel.wind
                      : metric.label === "Wave Height"
                        ? selectedVessel.wave
                        : selectedVessel.load}
                  </strong>
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
