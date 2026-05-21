"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function PrimeTopbar() {
  const router = useRouter();
  const path = usePathname();
  const [showMore, setShowMore] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    setShowMore(false);
  }, [path]);

  const navs = [
    { label: "DASHBOARD", href: "/dashboard" },
    { label: "FLEET", href: "/fleet" },
    { label: "MAP", href: "/map" },
    { label: "ANALYTICS", href: "/analytics" },
  ];

  const moreNavs = [
    { label: "LIVE TRACKING MODE", href: "/admin/live-tracking" },
    { label: "LOGISTICS OPTIMIZATION", href: "/admin/logistic-optimazation" },
    { label: "VESSEL DEPLOYMENT", href: "/admin/vessel-deployement" },
  ];

  const isActive = (href: string) => path === href;
  const isMoreActive = moreNavs.some((item) => path === item.href);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 46, padding: "0 20px", background: "#0a0a10",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      position: "sticky", top: 0, zIndex: 200,
    }}>
      {/* Kolom Kiri: Logo & Navigasi */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          onClick={() => router.push("/dashboard")}
          style={{ 
            fontFamily: "'Orbitron', sans-serif", 
            fontSize: 12, 
            fontWeight: 800, 
            color: "#a855f7", 
            letterSpacing: "0.15em", 
            marginRight: 30, 
            whiteSpace: "nowrap", 
            cursor: "pointer",
            textShadow: "0 0 10px rgba(168,85,247,0.4)" 
          }}
        >
          SERENA SAIL
        </span>
        
        <nav style={{ display: "flex" }}>
          {navs.map(n => (
            <button key={n.label} onClick={() => router.push(n.href)} style={{
              fontFamily: "'Share Tech Mono', monospace", 
              fontSize: 11, 
              fontWeight: 500,
              letterSpacing: "0.1em", 
              color: isActive(n.href) ? "#fff" : "#6b7280",
              padding: "0 16px", 
              cursor: "pointer", 
              border: "none", 
              background: "none",
              height: 46, 
              display: "flex", 
              alignItems: "center",
              borderBottom: isActive(n.href) ? "2px solid #a855f7" : "2px solid transparent",
              transition: "all 0.2s",
            }}>
              {n.label}
            </button>
          ))}

          {/* MORE Dropdown */}
          <div ref={moreRef} style={{ position: "relative" }}>
            <button onClick={() => setShowMore(v => !v)} style={{
              fontFamily: "'Share Tech Mono', monospace", 
              fontSize: 11, 
              color: showMore || isMoreActive ? "#fff" : "#6b7280",
              padding: "0 16px", 
              cursor: "pointer", 
              border: "none", 
              background: "none", 
              height: 46, 
              display: "flex", 
              alignItems: "center",
              gap: 6,
              borderBottom: isMoreActive ? "2px solid #a855f7" : "2px solid transparent",
            }}>
              MORE
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points={showMore ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
              </svg>
            </button>
            
            {showMore && (
              <div style={{
                position: "absolute", top: "100%", left: 0,
                background: "#0f0f1a", border: "1px solid rgba(168,85,247,0.2)",
                borderRadius: 4, overflow: "hidden", minWidth: 220,
                boxShadow: "0 10px 30px rgba(0,0,0,0.8)", zIndex: 300,
              }}>
                {moreNavs.map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => { setShowMore(false); router.push(item.href); }}
                    style={{
                      display: "block", width: "100%", padding: "12px 16px", textAlign: "left",
                      fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                      color: path === item.href ? "#fff" : "#9ca3af", letterSpacing: "0.1em",
                      background: path === item.href ? "rgba(168,85,247,0.1)" : "none", border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(168,85,247,0.1)"; (e.target as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = path === item.href ? "rgba(168,85,247,0.1)" : "none"; (e.target as HTMLElement).style.color = path === item.href ? "#fff" : "#9ca3af"; }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Kolom Kanan: Search, Actions, Logout, & Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        
        {/* Search Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${searchFocused ? "rgba(168,85,247,0.6)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 4,
          padding: "0 10px",
          height: 28,
          width: searchFocused ? 180 : 130,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? "#a855f7" : "#6b7280"} strokeWidth="2.5" style={{ marginRight: 6 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            placeholder="SEARCH UNIT..." 
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              background: "none", border: "none", outline: "none",
              color: "#fff", fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, width: "100%", letterSpacing: "0.1em"
            }}
          />
        </div>

        {/* Quick Action Icons */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: 'expand', icon: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /> },
            { id: 'notif', icon: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /> },
          ].map((item) => (
            <div key={item.id} style={{
              width: 28, height: 28, border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4, background: "rgba(255,255,255,0.02)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#6b7280", transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(34,211,238,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
            </div>
          ))}
        </div>

        {/* Tombol Logout Baru */}
        <div 
          onClick={() => { if(confirm("TERMINATE SESSION?")) router.push("/login"); }}
          style={{
            width: 28, height: 28, border: "1px solid rgba(244, 63, 94, 0.2)",
            borderRadius: 4, background: "rgba(244, 63, 94, 0.05)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#f43f5e", transition: "all 0.2s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(244, 63, 94, 0.2)";
            e.currentTarget.style.borderColor = "#f43f5e";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(244, 63, 94, 0.05)";
            e.currentTarget.style.borderColor = "rgba(244, 63, 94, 0.2)";
          }}
          title="Logout"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        {/* User Avatar (Kembali ke fungsi profil) */}
        <div
          onClick={() => router.push("/profile")}
          style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #22d3ee)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: "bold",
            color: "#fff", cursor: "pointer",
            border: "2px solid #0a0a10",
            boxShadow: "0 0 0 1px rgba(168,85,247,0.5)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          L
        </div>
      </div>
    </div>
  );
}
