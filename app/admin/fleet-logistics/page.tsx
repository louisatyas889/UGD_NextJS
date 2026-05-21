"use client";

import { lazy, Suspense } from "react";
import { vessels4 } from "../../lib/placeholder-data";
import SereneSailTopbar from "../../ui/SereneSailTopbar";
import SuspensePanelLoader from "../../ui/suspense-panel-loader";

const FleetLogisticsBoard = lazy(() => import("./fleet-logistics-board"));

export default function FleetLogisticsPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#0a0a10;color:#e5e7eb;font-family:'Rajdhani',sans-serif;min-height:100vh; overflow: hidden;}

        .ph{padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .ph-title{display:flex;align-items:center;gap:14px;margin-bottom:4px}
        .ph-t{font-family:'Orbitron',sans-serif;font-size:18px;font-weight:700;color:#fff;letter-spacing:0.04em}
        .live-badge{display:flex;align-items:center;gap:6px;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:0.16em;padding:4px 10px;border:1px solid rgba(34,211,238,0.3);border-radius:3px;background:rgba(34,211,238,0.06)}
        .ph-sub{font-family:'Rajdhani',sans-serif;font-size:13px;color:#6b7280}

        .layout{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:0;height:calc(100vh - 165px)}
        .left-panel{border-right:1px solid rgba(255,255,255,0.07); overflow-y: auto;}
        .left-panel::-webkit-scrollbar { width: 4px; }
        .left-panel::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.2); border-radius: 10px; }
        .fl-title-row { padding: 14px 20px 6px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); }

        table{width:100%;border-collapse:collapse}
        th{font-family:'Share Tech Mono',monospace;font-size:7px;color:#4b5563;letter-spacing:0.2em;text-align:left;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.05);font-weight:400;text-transform:uppercase;background:rgba(255,255,255,0.01); position: sticky; top: 0; z-index: 10; background: #0a0a10;}
        td{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle}
        tbody tr:hover{background:rgba(168,85,247,0.03); cursor: pointer;}

        .vid3{font-family:'Share Tech Mono',monospace;font-size:10px;color:#a855f7;display:block}
        .vsub{font-family:'Share Tech Mono',monospace;font-size:7px;color:#4b5563}

        .prog-wrap{display:flex;align-items:center;gap:10px}
        .prog-status{font-family:'Share Tech Mono',monospace;font-size:8px;color:#22d3ee;letter-spacing:0.1em;min-width:100px}
        .prog-track{flex:1;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;max-width:80px}
        .prog-fill{height:100%;background:#a855f7;border-radius:2px;box-shadow:0 0 6px rgba(168,85,247,0.5)}
        .prog-pct{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6b7280;min-width:28px;text-align:right}

        .right-panel{display:flex;flex-direction:column; overflow-y: auto;}
        .size-tabs{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid rgba(255,255,255,0.07)}
        .stab{padding:12px;text-align:center;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.14em;cursor:pointer;transition:all 0.2s;border:none;background:none;color:#6b7280}
        .stab.active{background:rgba(168,85,247,0.15); color:#a855f7; box-shadow: inset 0 -2px 0 #a855f7}

        .pkg-header{display:flex;justify-content:space-between;align-items:center;padding:14px 20px 10px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .pkg-title{font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;color:#fff}
        .pkg-id{font-family:'Share Tech Mono',monospace;font-size:10px;color:#6b7280}
        .size-badge{display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:9px;color:#a855f7}
        .size-icon{width:8px;height:8px;border-radius:50%;background:#a855f7;box-shadow: 0 0 5px #a855f7}

        .view-all{text-align:center;padding:12px;font-family:'Share Tech Mono',monospace;font-size:9px;color:#22d3ee;cursor:pointer;border-top:1px solid rgba(255,255,255,0.05);letter-spacing:0.14em}

        .health-section{padding:14px 20px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.01); margin-top: auto;}
        .health-title{font-family:'Share Tech Mono',monospace;font-size:8px;color:#6b7280;letter-spacing:0.2em;margin-bottom:10px}
        .health-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .hk{font-family:'Rajdhani',sans-serif;font-size:12px;color:#9ca3af}
        .hv{font-family:'Share Tech Mono',monospace;font-size:10px;color:#e5e7eb}

        .footer-bar2{position:fixed;bottom:0;left:0;right:0;height:28px;background:#05050a;border-top:1px solid rgba(168,85,247,0.2);display:flex;align-items:center;gap:20px;padding:0 24px; z-index: 100;}
        .fb2{font-family:'Share Tech Mono',monospace;font-size:8px;color:#4b5563;letter-spacing:0.14em}
        .fb2 span{color:#a855f7}
      `}</style>

      <SereneSailTopbar />

      <div className="ph">
        <div className="ph-title">
          <div className="ph-t">OPERATIONS HUB</div>
          <div className="live-badge" style={{ color: "#22d3ee" }}>
            LIVE TELEMETRY
          </div>
        </div>
        <div className="ph-sub">
          Real-time oversight of global maritime assets and high-priority
          logistics segments.
        </div>
      </div>

      <div className="fl-title-row">
        <span
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 10,
            color: "#a855f7",
            letterSpacing: "0.22em",
          }}
        >
          FLEET OVERVIEW
        </span>
        <span
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 8,
            color: "#4b5563",
            letterSpacing: "0.14em",
          }}
        >
          ACTIVE VESSELS: {vessels4.length}
        </span>
      </div>

      <Suspense
        fallback={
          <div style={{ padding: "20px" }}>
            <SuspensePanelLoader
              rows={6}
              title="Loading logistics command board..."
            />
          </div>
        }
      >
        <FleetLogisticsBoard />
      </Suspense>

      <div className="footer-bar2">
        <span className="fb2">SYSTEM HEALTH: <span>NOMINAL</span></span>
        <span className="fb2">CONNECTIVITY: <span>ACTIVE</span></span>
        <span className="fb2">TELEMETRY: <span>SYNCHRONIZED</span></span>
      </div>
    </>
  );
}
