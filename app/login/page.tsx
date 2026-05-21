"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { users, dummyAdmins } from "../lib/placeholder-data";

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState(""); 
  const [key, setKey] = useState("");
  const [sync, setSync] = useState(false); 
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("WAITING FOR INPUT..."); 
  const [statusColor, setStatusColor] = useState("#a855f7");
  const [error, setError] = useState("");

  const handleConnect = () => {
    if (connecting) return;

    // 1. Validasi Input Kosong
    if (!id.trim() || !key.trim()) { 
      setError("OPERATOR ID & AUTHORIZATION KEY REQUIRED"); 
      setStatus("INPUT ERROR"); 
      setStatusColor("#f87171"); 
      return; 
    }

    setError(""); 
    setConnecting(true); 
    setStatus("AUTHENTICATING..."); 
    setStatusColor("#f59e0b");

    // 2. Simulasi Delay Network (2.5 detik)
    setTimeout(() => {
      // Cek apakah kredensial cocok dengan data ADMIN (Prioritas)
      const isAdmin = dummyAdmins.find(
        (admin: any) => admin.id === id && admin.key === key
      );

      // Cek apakah kredensial cocok dengan data USER biasa
      const isValidUser = users.find(
        (user: any) => user.id === id && user.key === key
      );

      if (isAdmin) {
        setStatus("ADMIN ACCESS GRANTED — INITIALIZING SECURE TERMINAL...");
        setStatusColor("#a855f7");
        
        // Arahkan ke Fleet Logistics (Serene Sail UI)
        setTimeout(() => router.push("/admin/fleet-logistics"), 2000);

      } else if (isValidUser) {
        setStatus("CONNECTION ESTABLISHED — REDIRECTING...");
        setStatusColor("#22c55e");
        
        // Arahkan ke dashboard standar
        setTimeout(() => router.push("/dashboard"), 2000);

      } else {
        setConnecting(false);
        setError("INVALID OPERATOR ID OR ACCESS KEY");
        setStatus("ACCESS DENIED");
        setStatusColor("#ef4444");
      }
    }, 2500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@300;400;500&family=Orbitron:wght@400;600;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{width:100%;height:100%;background:#000;overflow:hidden}
        .page{position:relative;width:100vw;height:100vh;display:flex;flex-direction:column;overflow:hidden;background:#050508}
        .map-bg{position:absolute;inset:0;z-index:0}
        .vignette{position:absolute;inset:0;z-index:2;background:radial-gradient(ellipse 70% 80% at 50% 40%,transparent 30%,rgba(0,0,0,0.85) 100%)}
        .route-svg{position:absolute;inset:0;z-index:3;pointer-events:none}
        .topbar{position:relative;z-index:10;display:flex;align-items:flex-start;justify-content:space-between;padding:20px 32px 0}
        .logo-block{display:flex;align-items:flex-start;gap:10px}
        .logo-icon{width:36px;height:36px;background:rgba(88,28,200,0.25);border:1px solid rgba(168,85,247,0.4);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
        .logo-text{display:flex;flex-direction:column}
        .logo-name{font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:#a855f7;letter-spacing:0.1em;line-height:1}
        .logo-sub{font-family:'Share Tech Mono',monospace;font-size:7px;color:#9ca3af;letter-spacing:0.22em;margin-top:3px}
        .logo-coords{font-family:'Share Tech Mono',monospace;font-size:7.5px;color:#6b7280;letter-spacing:0.08em;margin-top:6px;line-height:1.7}
        .status-pills{display:flex;gap:20px;align-items:center;padding-top:6px}
        .pill{display:flex;align-items:center;gap:6px;font-family:'Share Tech Mono',monospace;font-size:9px;color:#9ca3af;letter-spacing:0.16em}
        .pill-dot{width:7px;height:7px;border-radius:50%;animation:pdot 2s ease-in-out infinite}
        .pill-dot.green{background:#22c55e;box-shadow:0 0 7px #22c55e}
        .pill-dot.amber{background:#f59e0b;box-shadow:0 0 7px #f59e0b}
        @keyframes pdot{0%,100%{opacity:1}50%{opacity:0.35}}
        .center{flex:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:10}
        .modal{width:100%;max-width:360px;background:rgba(8,5,18,0.88);border:1px solid rgba(168,85,247,0.5);border-radius:6px;padding:36px 32px 28px;box-shadow:0 0 60px rgba(168,85,247,0.1);backdrop-filter:blur(16px);position:relative}
        .corner{position:absolute;width:14px;height:14px;border-color:#a855f7;border-style:solid}
        .corner.tl{top:-1px;left:-1px;border-width:2px 0 0 2px}
        .corner.tr{top:-1px;right:-1px;border-width:2px 2px 0 0}
        .corner.bl{bottom:-1px;left:-1px;border-width:0 0 2px 2px}
        .corner.br{bottom:-1px;right:-1px;border-width:0 2px 2px 0}
        .modal-title{font-family:'Orbitron',sans-serif;font-size:17px;font-weight:700;text-align:center;color:#fff;letter-spacing:0.18em;margin-bottom:8px}
        .modal-sub{font-family:'Barlow',sans-serif;font-size:13px;color:#9ca3af;text-align:center;margin-bottom:28px;font-weight:300;letter-spacing:0.02em}
        .field{margin-bottom:16px}
        .field-label{display:block;font-family:'Share Tech Mono',monospace;font-size:8px;color:#a855f7;letter-spacing:0.28em;text-transform:uppercase;margin-bottom:8px}
        .input-wrap{display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(168,85,247,0.2);border-radius:4px;transition:border-color 0.2s,box-shadow 0.2s}
        .input-wrap:focus-within{border-color:rgba(168,85,247,0.55);box-shadow:0 0 14px rgba(168,85,247,0.12)}
        .input-wrap input{background:none;border:none;outline:none;color:#d1d5db;font-family:'Share Tech Mono',monospace;font-size:12px;width:100%;letter-spacing:0.06em}
        .input-wrap input::placeholder{color:#4b5563}
        .err-box{margin-bottom:10px;padding:8px 12px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.3);border-radius:3px}
        .err-text{font-family:'Share Tech Mono',monospace;font-size:9px;color:#f87171;letter-spacing:0.14em}
        .row-opt{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
        .check-wrap{display:flex;align-items:center;gap:8px;cursor:pointer}
        .check-box{width:14px;height:14px;border:1px solid rgba(168,85,247,0.4);border-radius:2px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;flex-shrink:0}
        .check-label{font-family:'Share Tech Mono',monospace;font-size:9px;color:#6b7280;letter-spacing:0.14em}
        .key-rec{font-family:'Share Tech Mono',monospace;font-size:9px;color:#7c3aed;letter-spacing:0.14em;cursor:pointer;text-decoration:none;transition:color 0.2s}
        .key-rec:hover{color:#c084fc}
        .btn{width:100%;height:50px;border:none;border-radius:4px;background:linear-gradient(90deg,#7c3aed 0%,#a855f7 50%,#c084fc 100%);color:#fff;font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.22em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;position:relative;overflow:hidden;margin-bottom:22px;transition:opacity 0.2s,transform 0.1s}
        .btn:hover:not(:disabled){opacity:0.9}
        .btn:disabled{opacity:0.7;cursor:default}
        .btn::after{content:'';position:absolute;top:0;left:-100%;bottom:0;width:60%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);animation:shim 2.5s infinite}
        @keyframes shim{100%{left:200%}}
        .status-row{display:flex;align-items:center;justify-content:center;gap:8px}
        .sdot{width:7px;height:7px;border-radius:50%;animation:pdot 1.2s ease-in-out infinite;flex-shrink:0}
        .stext{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.2em}
        .footer-mid{position:relative;z-index:10;display:flex;justify-content:center;gap:32px;padding-bottom:10px}
        .footer-mid a{font-family:'Share Tech Mono',monospace;font-size:8.5px;color:#4b5563;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;transition:color 0.2s}
        .footer-mid a:hover{color:#9ca3af}
        .footer-bottom{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:10px 32px 18px}
        .footer-copy{font-family:'Share Tech Mono',monospace;font-size:7px;color:#374151;letter-spacing:0.1em;text-transform:uppercase}
        .footer-right{display:flex;align-items:center;gap:22px}
        .footer-links{display:flex;gap:14px}
        .footer-links a{font-family:'Share Tech Mono',monospace;font-size:7.5px;color:#4b5563;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;transition:color 0.2s}
        .footer-links a:hover{color:#9ca3af}
        .footer-enc{font-family:'Share Tech Mono',monospace;font-size:7px;color:#374151;text-align:right;letter-spacing:0.1em;line-height:1.7}
        .footer-icons{display:flex;gap:10px;align-items:center}
        .footer-icons svg{opacity:0.28;cursor:pointer;transition:opacity 0.2s}
        .footer-icons svg:hover{opacity:0.6}
      `}</style>

      <div className="page">
        <div className="map-bg">
          <svg viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
            <defs>
              <pattern id="dots2" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.1" fill="rgba(255,160,40,0.28)"/></pattern>
              <mask id="lm2">
                <ellipse cx="220" cy="260" rx="170" ry="200" fill="white"/>
                <ellipse cx="170" cy="380" rx="90" ry="120" fill="white"/>
                <ellipse cx="300" cy="420" rx="80" ry="100" fill="white"/>
                <ellipse cx="330" cy="580" rx="100" ry="140" fill="white"/>
                <ellipse cx="680" cy="210" rx="90" ry="100" fill="white"/>
                <ellipse cx="720" cy="280" rx="70" ry="60" fill="white"/>
                <ellipse cx="700" cy="430" rx="110" ry="160" fill="white"/>
                <ellipse cx="950" cy="230" rx="230" ry="170" fill="white"/>
                <ellipse cx="1050" cy="340" rx="160" ry="110" fill="white"/>
                <ellipse cx="1140" cy="560" rx="110" ry="80" fill="white"/>
                <ellipse cx="460" cy="130" rx="70" ry="60" fill="white"/>
              </mask>
            </defs>
            <rect width="1440" height="900" fill="url(#dots2)" mask="url(#lm2)"/>
          </svg>
        </div>
        <div className="vignette"/>
        <svg className="route-svg" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M 350 420 Q 500 350 650 380 Q 720 395 800 370" stroke="rgba(168,85,247,0.35)" strokeWidth="1" fill="none" strokeDasharray="4 6"/>
          <circle cx="350" cy="420" r="3" fill="#a855f7" opacity="0.6"/>
          <circle cx="800" cy="370" r="3" fill="#a855f7" opacity="0.6"/>
        </svg>

        <div className="topbar">
          <div className="logo-block">
            <div className="logo-icon">
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <path d="M1 3 Q3.5 1 6 3 Q8.5 5 11 3 Q13.5 1 16 3 Q18.5 5 20 3" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <path d="M1 8 Q3.5 6 6 8 Q8.5 10 11 8 Q13.5 6 16 8 Q18.5 10 20 8" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <path d="M1 13 Q3.5 11 6 13 Q8.5 15 11 13 Q13.5 11 16 13 Q18.5 15 20 13" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-name">Serene Sail</span>
              <span className="logo-sub">MARITIME INTELLIGENCE NETWORK</span>
              <div className="logo-coords">LAT: 51.5074° N<br/>LONG: 0.1278° W<br/>BEARING: 264.0°</div>
            </div>
          </div>
          <div className="status-pills">
            <div className="pill"><div className="pill-dot green"/>SIGNAL: STABLE</div>
            <div className="pill"><div className="pill-dot amber"/>ENCRYPTED TUNNEL</div>
          </div>
        </div>

        <div className="center">
          <div className="modal">
            <div className="corner tl"/><div className="corner tr"/><div className="corner bl"/><div className="corner br"/>
            <div className="modal-title">SECURE ACCESS PORTAL</div>
            <div className="modal-sub">Classified intelligence access. Verify credentials.</div>
            
            <div className="field">
              <span className="field-label">OPERATOR ID</span>
              <div className="input-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input 
                  type="text" 
                  value={id} 
                  onChange={e=>{setId(e.target.value); setError("")}} 
                  onKeyDown={e=>e.key==="Enter"&&handleConnect()} 
                  placeholder="e.g. Alpha-9-Delta"
                  disabled={connecting}
                />
              </div>
            </div>

            <div className="field">
              <span className="field-label">AUTHORIZATION KEY</span>
              <div className="input-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                <input 
                  type="password" 
                  value={key} 
                  onChange={e=>{setKey(e.target.value); setError("")}} 
                  onKeyDown={e=>e.key==="Enter"&&handleConnect()} 
                  placeholder="············"
                  disabled={connecting}
                />
              </div>
            </div>

            {error && (
              <div className="err-box">
                <span className="err-text">⚠ {error}</span>
              </div>
            )}

            <div className="row-opt">
              <div className="check-wrap" onClick={()=>setSync(!sync)}>
                <div className="check-box" style={{background:sync?"rgba(168,85,247,0.25)":"transparent"}}>
                  {sync&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span className="check-label">STAY SYNCHRONIZED</span>
              </div>
              <a href="#" className="key-rec" onClick={(e) => e.preventDefault()}>KEY RECOVERY</a>
            </div>

            <button className="btn" onClick={handleConnect} disabled={connecting}>
              {connecting ? "AUTHENTICATING..." : "INITIATE CONNECTION"}
              {!connecting && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
            </button>

            <div className="status-row">
              <div className="sdot" style={{background:statusColor, boxShadow:`0 0 7px ${statusColor}`}}/>
              <span className="stext" style={{color: statusColor}}>{status}</span>
            </div>
          </div>
        </div>

        <div className="footer-mid">
          <a href="#">EMERGENCY PROTOCOL</a><a href="#">NETWORK STATUS</a><a href="#">LEGAL</a>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 SERENE SAIL MARITIME INTELLIGENCE NETWORK. ALL RIGHTS RESERVED.</span>
          <div className="footer-right">
            <div className="footer-links"><a href="#">SECURE ACCESS POLICY</a><a href="#">TERMS OF SERVICE</a><a href="#">PRIVACY PROTOCOL</a></div>
            <span className="footer-enc">ENCRYPTION: AES-256-GCM<br/>PROTOCOL: MARITIME_SECURE_V4</span>
            <div className="footer-icons">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
