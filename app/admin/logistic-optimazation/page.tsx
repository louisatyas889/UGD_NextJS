"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PrimeTopbar from "../../ui/PrimeTopbar";

const legends = [
  { label: "RUTE SAAT INI (AKTIF)", color: "#22d3ee" },
  { label: "RUTE REKOMENDASI (OPTIMISASI AI)", color: "#c084fc" },
] as const;

const metricCards = [
  {
    label: "POTENTIAL SAVINGS",
    value: "$12,400",
    caption: "Estimasi perjalanan",
    tone: "#4ade80",
  },
  {
    label: "CARBON REDUCTION",
    value: "-15%",
    caption: "Target Emisi EU 2030",
    tone: "#d8b4fe",
  },
] as const;

const routeComparison = [
  {
    parameter: "Bahan Bakar",
    active: "420 Tons",
    ai: "370 Tons",
    type: "text",
  },
  {
    parameter: "Waktu ETA",
    active: "14 Okt, 04:00",
    ai: "13 Okt, 22:00",
    type: "text",
  },
  {
    parameter: "Keandalan",
    active: 3,
    ai: 5,
    type: "rating",
  },
] as const;

const routeBadges = [
  { label: "VESSEL ID", value: "SS-VALIANT_OR82", accent: "#22d3ee" },
  { label: "ENGINE", value: "98.4% THRUST", accent: "#e5e7eb" },
  { label: "TARGET", value: "PORT OF ROTTERDAM", accent: "#22d3ee" },
] as const;

const activeRoute: [number, number][] = [
  [-23.5505, -46.6333],
  [-14.4, -35.2],
  [0.4, -24.6],
  [18.7, -16.1],
  [35.1, -9.2],
  [45.0, -1.5],
  [51.9244, 4.4777],
];

const recommendedRoute: [number, number][] = [
  [-23.5505, -46.6333],
  [-10.0, -38.5],
  [7.2, -27.0],
  [24.8, -16.2],
  [39.0, -7.4],
  [48.4, -0.6],
  [51.9244, 4.4777],
];

const routePlayback: [number, number][] = [
  [-21.2, -42.5],
  [-15.4, -38.7],
  [-8.2, -33.9],
  [0.8, -27.1],
  [10.5, -21.3],
  [20.3, -15.4],
  [31.5, -10.2],
  [42.4, -4.4],
  [48.7, 0.8],
];

const startNode = { lat: -23.5505, lng: -46.6333, label: "SOUTH ATLANTIC ORIGIN" };
const targetNode = { lat: 51.9244, lng: 4.4777, label: "PORT OF ROTTERDAM" };

function GaugeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 13a8 8 0 1 0-16 0" />
      <path d="m12 13 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
      <path d="m18.5 14 .8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8.8-1.7Z" />
    </svg>
  );
}

function Star({
  filled,
  color,
}: {
  filled: boolean;
  color: string;
}) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? color : "rgba(255,255,255,0.14)"}>
      <path d="m12 2.7 2.8 5.68 6.27.91-4.53 4.42 1.07 6.25L12 16.97 6.39 19.96l1.07-6.25L2.93 9.3l6.27-.91L12 2.7Z" />
    </svg>
  );
}

export default function LogisticOptimazationPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const liveMarkerRef = useRef<any>(null);
  const livePulseRef = useRef<any>(null);
  const focusBoundsRef = useRef<any>(null);

  const [syncTime, setSyncTime] = useState("");
  const [playbackIndex, setPlaybackIndex] = useState(0);

  const currentLocation = useMemo(
    () => routePlayback[playbackIndex % routePlayback.length],
    [playbackIndex],
  );

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setSyncTime(
        `${String(now.getUTCHours()).padStart(2, "0")}:${String(
          now.getUTCMinutes(),
        ).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")} UTC`,
      );
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaybackIndex((current) => (current + 1) % routePlayback.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return;

    let cancelled = false;

    const initMap = () => {
      if (cancelled || !mapContainerRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [20, -24],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      const vesselIcon = L.divIcon({
        className: "serena-route-marker",
        html: `
          <div class="route-marker-core">
            <div class="route-marker-ring"></div>
            <div class="route-marker-dot"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const targetIcon = L.divIcon({
        className: "serena-target-marker",
        html: `
          <div class="target-marker-core">
            <div class="target-marker-pulse"></div>
            <div class="target-marker-dot"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const sourceIcon = L.divIcon({
        className: "serena-source-marker",
        html: `
          <div class="source-marker-core">
            <div class="source-marker-dot"></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      focusBoundsRef.current = L.latLngBounds([...activeRoute, ...recommendedRoute]);

      L.marker([startNode.lat, startNode.lng], { icon: sourceIcon })
        .addTo(map)
        .bindPopup(
          `
            <div class="serena-popup">
              <div class="popup-label">ORIGIN</div>
              <div class="popup-title">${startNode.label}</div>
            </div>
          `,
          { className: "serena-leaflet-popup", closeButton: false, minWidth: 170 },
        );

      L.marker([targetNode.lat, targetNode.lng], { icon: targetIcon })
        .addTo(map)
        .bindPopup(
          `
            <div class="serena-popup">
              <div class="popup-label">TARGET</div>
              <div class="popup-title">${targetNode.label}</div>
            </div>
          `,
          { className: "serena-leaflet-popup", closeButton: false, minWidth: 170 },
        );

      L.polyline(activeRoute, {
        color: "rgba(34,211,238,0.24)",
        weight: 7,
        opacity: 0.85,
      }).addTo(map);

      L.polyline(activeRoute, {
        color: "#22d3ee",
        weight: 2.5,
        opacity: 0.95,
        dashArray: "7 9",
      }).addTo(map);

      L.polyline(recommendedRoute, {
        color: "rgba(196,181,253,0.24)",
        weight: 8,
        opacity: 0.85,
      }).addTo(map);

      L.polyline(recommendedRoute, {
        color: "#d8b4fe",
        weight: 3,
        opacity: 0.92,
      }).addTo(map);

      livePulseRef.current = L.circleMarker(currentLocation, {
        radius: 12,
        color: "#22d3ee",
        weight: 1,
        opacity: 0.35,
        fillColor: "#22d3ee",
        fillOpacity: 0.1,
      }).addTo(map);

      liveMarkerRef.current = L.marker(currentLocation, { icon: vesselIcon }).addTo(map);
      liveMarkerRef.current.bindPopup(
        `
          <div class="serena-popup">
            <div class="popup-label">LIVE ROUTE MODEL</div>
            <div class="popup-title">SS-VALIANT_OR82</div>
            <div class="popup-row"><span>MODE</span><strong>OPTIMIZATION LIVE</strong></div>
            <div class="popup-row"><span>TARGET</span><strong>${targetNode.label}</strong></div>
          </div>
        `,
        { className: "serena-leaflet-popup", closeButton: false, minWidth: 210 },
      );
      liveMarkerRef.current.openPopup();

      map.fitBounds(focusBoundsRef.current, { padding: [40, 40] });
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
      liveMarkerRef.current = null;
      livePulseRef.current = null;
      focusBoundsRef.current = null;
    };
  }, [currentLocation]);

  useEffect(() => {
    if (!liveMarkerRef.current || !livePulseRef.current) return;
    liveMarkerRef.current.setLatLng(currentLocation);
    livePulseRef.current.setLatLng(currentLocation);
  }, [currentLocation]);

  const handleZoom = (mode: "in" | "out") => {
    if (!mapInstanceRef.current) return;
    if (mode === "in") {
      mapInstanceRef.current.zoomIn();
      return;
    }
    mapInstanceRef.current.zoomOut();
  };

  const handleRefocus = () => {
    if (!mapInstanceRef.current || !focusBoundsRef.current) return;
    mapInstanceRef.current.fitBounds(focusBoundsRef.current, { padding: [40, 40] });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#0a0a10;color:#e5e7eb;font-family:'Rajdhani',sans-serif;min-height:100vh}

        .rt-page{
          min-height:calc(100vh - 46px);
          padding:10px;
          background:
            radial-gradient(circle at top left, rgba(34,211,238,0.06), transparent 24%),
            radial-gradient(circle at top right, rgba(168,85,247,0.08), transparent 22%),
            #0a0a10;
        }

        .rt-layout{
          display:grid;
          grid-template-columns:minmax(0,1.6fr) minmax(360px,1fr);
          gap:10px;
          min-height:calc(100vh - 66px);
        }

        .panel{
          position:relative;
          overflow:hidden;
          background:#0f0f1a;
          border:1px solid rgba(255,255,255,0.07);
          border-radius:6px;
          box-shadow:0 18px 40px rgba(0,0,0,0.35);
        }

        .panel::before{
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          background:linear-gradient(180deg, rgba(255,255,255,0.02), transparent 28%);
        }

        .left-col,.right-col{
          display:flex;
          flex-direction:column;
          gap:10px;
          min-width:0;
        }

        .map-shell{
          position:relative;
          min-height:560px;
          overflow:hidden;
        }

        #route-live-map{
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
            radial-gradient(circle at center, rgba(34,211,238,0.05), transparent 30%),
            linear-gradient(180deg, rgba(3,7,18,0.14), rgba(3,7,18,0.34));
        }

        .map-grid{
          position:absolute;
          inset:0;
          z-index:2;
          pointer-events:none;
          background:
            linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size:42px 42px;
          opacity:.55;
        }

        .legend-stack{
          position:absolute;
          top:14px;
          left:14px;
          display:flex;
          flex-direction:column;
          gap:8px;
          z-index:5;
        }

        .legend-chip{
          display:flex;
          align-items:center;
          gap:10px;
          padding:9px 14px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(8,10,18,0.72);
          backdrop-filter:blur(12px);
        }

        .legend-line{
          width:34px;
          height:3px;
          border-radius:999px;
          flex-shrink:0;
        }

        .legend-text,
        .live-pill,
        .eyebrow,
        .footer-badge,
        .telemetry-chip,
        .control-btn,
        .apply-btn{
          font-family:'Share Tech Mono',monospace;
          text-transform:uppercase;
        }

        .legend-text{
          font-size:9px;
          letter-spacing:.18em;
          color:#d1d5db;
          white-space:nowrap;
        }

        .telemetry-chip{
          position:absolute;
          top:14px;
          right:14px;
          z-index:5;
          display:flex;
          flex-direction:column;
          align-items:flex-end;
          gap:4px;
          padding:10px 14px;
          border-radius:6px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(8,10,18,0.78);
          backdrop-filter:blur(12px);
        }

        .telemetry-chip span:first-child{
          font-size:8px;
          letter-spacing:.18em;
          color:#22d3ee;
        }

        .telemetry-chip span:last-child{
          font-size:10px;
          color:#e5e7eb;
          letter-spacing:.12em;
        }

        .map-controls{
          position:absolute;
          right:14px;
          bottom:110px;
          z-index:5;
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
          border:none;
          border-radius:6px;
          background:rgba(8,10,18,0.82);
          border:1px solid rgba(255,255,255,0.12);
          color:#22d3ee;
          cursor:pointer;
          font-size:17px;
          transition:all .2s ease;
        }

        .control-btn:hover{
          background:rgba(168,85,247,0.22);
          border-color:rgba(196,181,253,0.28);
          color:#f5f3ff;
        }

        .insight-wrap{
          position:absolute;
          left:14px;
          right:14px;
          bottom:14px;
          z-index:5;
        }

        .insight-panel{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:18px;
          padding:18px 20px;
          border-radius:6px;
          border:1px solid rgba(196,181,253,0.22);
          background:linear-gradient(135deg, rgba(168,85,247,0.18), rgba(255,255,255,0.05));
          backdrop-filter:blur(14px);
          box-shadow:0 12px 35px rgba(88,28,135,0.22);
        }

        .insight-left{
          display:flex;
          align-items:flex-start;
          gap:14px;
          min-width:0;
        }

        .icon-box{
          width:42px;
          height:42px;
          border-radius:6px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          border:1px solid rgba(196,181,253,0.2);
          background:rgba(168,85,247,0.12);
          color:#e9d5ff;
        }

        .insight-title{
          font-size:15px;
          font-weight:600;
          color:#f5f3ff;
          margin-bottom:4px;
        }

        .insight-text{
          font-size:13px;
          line-height:1.55;
          color:#d1d5db;
          max-width:650px;
        }

        .apply-btn{
          border:none;
          border-radius:6px;
          padding:12px 18px;
          background:#e9d5ff;
          color:#581c87;
          font-size:10px;
          letter-spacing:.16em;
          cursor:pointer;
          font-weight:700;
          white-space:nowrap;
          box-shadow:0 0 24px rgba(196,181,253,0.35);
        }

        .map-footer{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .footer-badge{
          display:flex;
          align-items:center;
          gap:6px;
          padding:9px 14px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.03);
          backdrop-filter:blur(12px);
          font-size:9px;
          letter-spacing:.16em;
          color:#6b7280;
        }

        .footer-badge strong{
          font-weight:700;
        }

        .kpi-card{
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          min-height:196px;
          padding:24px 22px;
          text-align:center;
        }

        .kpi-top{
          width:100%;
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          margin-bottom:30px;
        }

        .eyebrow{
          font-size:9px;
          letter-spacing:.24em;
          color:#6b7280;
        }

        .gauge-box{
          width:34px;
          height:34px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:6px;
          border:1px solid rgba(34,211,238,0.18);
          background:rgba(34,211,238,0.08);
          color:#22d3ee;
        }

        .kpi-value{
          font-family:'Orbitron',sans-serif;
          font-size:58px;
          line-height:1;
          color:#22d3ee;
          text-shadow:0 0 20px rgba(34,211,238,0.35);
        }

        .kpi-value small{
          font-size:20px;
        }

        .delta-badge{
          margin-top:16px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:6px 12px;
          border-radius:999px;
          border:1px solid rgba(74,222,128,0.14);
          background:rgba(34,197,94,0.08);
          color:#4ade80;
          font-family:'Share Tech Mono',monospace;
          font-size:9px;
          letter-spacing:.14em;
          text-transform:uppercase;
        }

        .metric-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        }

        .metric-card{
          padding:18px 18px 16px;
          min-height:122px;
        }

        .metric-value{
          margin-top:24px;
          font-family:'Orbitron',sans-serif;
          font-size:36px;
          line-height:1;
          letter-spacing:.02em;
        }

        .metric-caption{
          margin-top:8px;
          font-size:12px;
          color:#6b7280;
        }

        .table-card{
          padding:18px;
        }

        .table-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding-bottom:14px;
          border-bottom:1px solid rgba(255,255,255,0.07);
        }

        .live-pill{
          padding:4px 10px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,0.08);
          font-size:9px;
          letter-spacing:.14em;
          color:#6b7280;
        }

        table{
          width:100%;
          border-collapse:collapse;
          margin-top:12px;
        }

        th{
          text-align:left;
          padding:12px 14px;
          background:rgba(255,255,255,0.02);
          border-bottom:1px solid rgba(255,255,255,0.05);
          font-family:'Share Tech Mono',monospace;
          font-size:9px;
          letter-spacing:.18em;
          text-transform:uppercase;
          color:#6b7280;
          font-weight:400;
        }

        td{
          padding:14px;
          border-bottom:1px solid rgba(255,255,255,0.05);
          font-size:13px;
          color:#e5e7eb;
        }

        tbody tr:last-child td{border-bottom:none}
        .param{color:#9ca3af}
        .ai-col{color:#e9d5ff}
        .rating{display:flex;align-items:center;gap:4px}

        .serena-route-marker,
        .serena-target-marker,
        .serena-source-marker{
          background:none !important;
          border:none !important;
        }

        .route-marker-core{
          position:relative;
          width:28px;
          height:28px;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .route-marker-ring{
          position:absolute;
          inset:0;
          border-radius:999px;
          border:1px solid rgba(34,211,238,0.45);
          animation:pulse 1.8s ease-in-out infinite;
        }

        .route-marker-dot{
          width:10px;
          height:10px;
          border-radius:50%;
          background:#22d3ee;
          box-shadow:0 0 16px rgba(34,211,238,0.9);
        }

        .target-marker-core,
        .source-marker-core{
          position:relative;
          width:26px;
          height:26px;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .target-marker-pulse{
          position:absolute;
          inset:0;
          border-radius:999px;
          background:rgba(216,180,254,0.18);
          animation:pulse 1.8s ease-in-out infinite;
        }

        .target-marker-dot{
          width:8px;
          height:8px;
          border-radius:50%;
          background:#f5f3ff;
          box-shadow:0 0 14px rgba(216,180,254,0.8);
        }

        .source-marker-dot{
          width:8px;
          height:8px;
          border-radius:50%;
          background:#4ade80;
          box-shadow:0 0 10px rgba(74,222,128,0.75);
        }

        .serena-leaflet-popup .leaflet-popup-content-wrapper{
          background:rgba(9,12,20,0.92);
          color:#e5e7eb;
          border:1px solid rgba(255,255,255,0.08);
          border-radius:6px;
          box-shadow:0 18px 40px rgba(0,0,0,0.4);
          backdrop-filter:blur(12px);
        }

        .serena-leaflet-popup .leaflet-popup-tip{
          background:rgba(9,12,20,0.92);
          border:1px solid rgba(255,255,255,0.08);
        }

        .serena-popup{
          font-family:'Rajdhani',sans-serif;
          min-width:150px;
        }

        .popup-label{
          font-family:'Share Tech Mono',monospace;
          font-size:8px;
          letter-spacing:.18em;
          color:#22d3ee;
          text-transform:uppercase;
        }

        .popup-title{
          margin-top:6px;
          font-size:14px;
          font-weight:700;
          color:#fff;
        }

        .popup-row{
          display:flex;
          justify-content:space-between;
          gap:16px;
          margin-top:8px;
          font-size:11px;
          color:#cbd5e1;
        }

        .popup-row span{
          color:#64748b;
          text-transform:uppercase;
          letter-spacing:.12em;
          font-size:9px;
        }

        @keyframes pulse{
          0%,100%{transform:scale(1);opacity:.5}
          50%{transform:scale(1.18);opacity:.15}
        }

        @media (max-width: 1180px){
          .rt-layout{grid-template-columns:1fr}
        }

        @media (max-width: 720px){
          .rt-page{padding:8px}
          .metric-grid{grid-template-columns:1fr}
          .map-shell{min-height:520px}
          .insight-panel{flex-direction:column;align-items:flex-start}
          .apply-btn{width:100%}
          .insight-wrap{left:10px;right:10px;bottom:10px}
          .legend-stack{left:10px;top:10px}
          .map-controls{right:10px;bottom:132px}
          .map-footer{gap:6px}
          .footer-badge{width:100%;justify-content:flex-start}
          .telemetry-chip{right:10px;top:auto;bottom:10px}
        }
      `}</style>

      <PrimeTopbar />

      <main className="rt-page">
        <div className="rt-layout">
          <div className="left-col">
            <div className="panel map-shell">
              <div id="route-live-map" ref={mapContainerRef} />
              <div className="map-shade" />
              <div className="map-grid" />

              <div className="legend-stack">
                {legends.map((legend) => (
                  <div key={legend.label} className="legend-chip">
                    <span
                      className="legend-line"
                      style={{
                        background: legend.color,
                        boxShadow: `0 0 14px ${legend.color}`,
                      }}
                    />
                    <span className="legend-text">{legend.label}</span>
                  </div>
                ))}
              </div>

              <div className="telemetry-chip">
                <span>LIVE ROUTE TELEMETRY</span>
                <span>{syncTime}</span>
              </div>

              <div className="map-controls">
                <button type="button" className="control-btn" onClick={() => handleZoom("in")}>
                  +
                </button>
                <button type="button" className="control-btn" onClick={() => handleZoom("out")}>
                  -
                </button>
                <button type="button" className="control-btn" onClick={handleRefocus}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <circle cx="12" cy="12" r="8" />
                    <path d="m12 7 2 5-5 2" />
                  </svg>
                </button>
              </div>

              <div className="insight-wrap">
                <div className="insight-panel">
                  <div className="insight-left">
                    <div className="icon-box">
                      <SparkleIcon />
                    </div>
                    <div>
                      <div className="insight-title">AI Recommendation Insight</div>
                      <div className="insight-text">
                        Saran AI: Ambil Rute via Arus Atlantik Utara untuk hemat
                        12% bahan bakar. Cuaca stabil. Estimasi kedatangan 6 jam
                        lebih awal.
                      </div>
                    </div>
                  </div>

                  <button type="button" className="apply-btn">
                    Terapkan Rute
                  </button>
                </div>
              </div>
            </div>

            <div className="map-footer">
              {routeBadges.map((badge) => (
                <div key={badge.label} className="footer-badge">
                  <span>{badge.label}:</span>
                  <strong style={{ color: badge.accent }}>{badge.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="right-col">
            <div className="panel kpi-card">
              <div className="kpi-top">
                <div className="eyebrow">SKOR EFISIENSI ARMADA</div>
                <div className="gauge-box">
                  <GaugeIcon />
                </div>
              </div>

              <div className="kpi-value">
                92<small>%</small>
              </div>
              <div className="delta-badge">+4.2% dari kemarin</div>
            </div>

            <div className="metric-grid">
              {metricCards.map((metric) => (
                <div key={metric.label} className="panel metric-card">
                  <div className="eyebrow">{metric.label}</div>
                  <div className="metric-value" style={{ color: metric.tone }}>
                    {metric.value}
                  </div>
                  <div className="metric-caption">{metric.caption}</div>
                </div>
              ))}
            </div>

            <div className="panel table-card">
              <div className="table-head">
                <div className="eyebrow">PERBANDINGAN PERFORMA RUTE</div>
                <div className="live-pill">LIVE</div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Route Active</th>
                    <th>Route AI</th>
                  </tr>
                </thead>
                <tbody>
                  {routeComparison.map((row) => (
                    <tr key={row.parameter}>
                      <td className="param">{row.parameter}</td>
                      <td>
                        {row.type === "rating" ? (
                          <div className="rating">
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star key={index} filled={index < row.active} color="#fbbf24" />
                            ))}
                          </div>
                        ) : (
                          row.active
                        )}
                      </td>
                      <td className="ai-col">
                        {row.type === "rating" ? (
                          <div className="rating">
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star key={index} filled={index < row.ai} color="#d8b4fe" />
                            ))}
                          </div>
                        ) : (
                          row.ai
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
