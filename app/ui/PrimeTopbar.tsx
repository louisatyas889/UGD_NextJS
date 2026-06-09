"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMaintenance } from "../context/MaintenanceContext";

//Definisikan tipe data Props agar TypeScript tahu komponen ini bisa menerima fungsi onSearch
interface PrimeTopbarProps {
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

//Masukkan destructuring props { onSearch } ke dalam argumen fungsi komponen
export default function PrimeTopbar({ onSearch }: PrimeTopbarProps) {
  const router = useRouter();
  const path = usePathname();
  const [showMore, setShowMore] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // ✨ State baru untuk pop up logout
  const moreRef = useRef<HTMLDivElement>(null);

  // Data kapal MAINTENANCE dari context (auto-update via polling)
  const { vessels: maintenanceVessels } = useMaintenance();
  const maintenanceCount = maintenanceVessels.length;

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
    { label: "LIVE TRACKING MODE", href: "/live-tracking" },
    { label: "MAINTENANCE VESSEL", href: "/maintenance_vessels" },
    { label: "VESSEL DEPLOYMENT", href: "/vessel-deployment" },
  ];

  const isActive = (href: string) => path === href;
  const isMoreActive = moreNavs.some((item) => path === item.href);

  // 🔍 Cek kondisi: Sembunyikan search jika berada di halaman /fleet atau /map
  const hideSearch = path === "/fleet" || path === "/map";

  // Fungsi eksekusi logout
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    router.push("/login");
  };

  return (
    <>
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
                  borderRadius: 4, overflow: "hidden", minWidth: 260,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.8)", zIndex: 300,
                }}>
                  {/* Item MAINTENANCE VESSEL dengan daftar kapal embedded langsung di dropdown (inline) */}
                  <div style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <button
                      onClick={() => { setShowMore(false); router.push("/maintenance_vessels"); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "12px 16px", textAlign: "left",
                        fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                        color: path === "/maintenance_vessels" ? "#fff" : "#9ca3af", letterSpacing: "0.1em",
                        background: path === "/maintenance_vessels" ? "rgba(168,85,247,0.1)" : "none", border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => { 
                        e.currentTarget.style.background = "rgba(168,85,247,0.1)"; 
                        e.currentTarget.style.color = "#fff"; 
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.background = path === "/maintenance_vessels" ? "rgba(168,85,247,0.1)" : "none"; 
                        e.currentTarget.style.color = path === "/maintenance_vessels" ? "#fff" : "#9ca3af"; 
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#a855f7" }}>●</span>
                        MAINTENANCE VESSEL
                      </span>
                      {maintenanceCount > 0 && (
                        <span style={{
                          fontSize: 9, fontWeight: "bold", color: "#0a0a0a",
                          background: "#a855f7", padding: "2px 7px", borderRadius: 8,
                          minWidth: 18, textAlign: "center",
                        }}>{maintenanceCount}</span>
                      )}
                    </button>

                    {/* Sub-list kapal MAINTENANCE (inline, max 5 item) */}
                    {maintenanceCount === 0 ? (
                      <div style={{
                        padding: "8px 16px 12px 36px",
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 9, color: "#4b5563", letterSpacing: "0.05em",
                      }}>
                        // NO ACTIVE UNITS //
                      </div>
                    ) : (
                      <div style={{ padding: "0 0 8px 0" }}>
                        {maintenanceVessels.slice(0, 5).map(v => (
                          <div
                            key={v.id}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowMore(false); 
                              router.push("/maintenance_vessels"); 
                            }}
                            style={{
                              padding: "6px 16px 6px 36px",
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: 9, color: "#9ca3af",
                              cursor: "pointer",
                              borderTop: "1px solid rgba(168,85,247,0.08)",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={e => { 
                              e.currentTarget.style.color = "#a855f7"; 
                              e.currentTarget.style.background = "rgba(168,85,247,0.05)"; 
                            }}
                            onMouseLeave={e => { 
                              e.currentTarget.style.color = "#9ca3af"; 
                              e.currentTarget.style.background = "transparent"; 
                            }}
                          >
                            <span style={{ color: "#a855f7" }}>⚙</span> {v.id}
                            <span style={{ color: "#4b5563", marginLeft: 6 }}>· {v.destination}</span>
                          </div>
                        ))}
                        {maintenanceCount > 5 && (
                          <div style={{
                            padding: "6px 16px 6px 36px",
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: 9, color: "#6b7280", fontStyle: "italic",
                          }}>
                            + {maintenanceCount - 5} more...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Item MORE biasa (tanpa sub) */}
                  {moreNavs.filter(item => item.label !== "MAINTENANCE VESSEL").map(item => (
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
                      onMouseEnter={e => { 
                        e.currentTarget.style.background = "rgba(168,85,247,0.1)"; 
                        e.currentTarget.style.color = "#fff"; 
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.background = path === item.href ? "rgba(168,85,247,0.1)" : "none"; 
                        e.currentTarget.style.color = path === item.href ? "#fff" : "#9ca3af"; 
                      }}
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
          
          {/* 🔍 Search Bar */}
          {!hideSearch && (
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
                onChange={onSearch}
                style={{
                  background: "none", border: "none", outline: "none",
                  color: "#fff", fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9, width: "100%", letterSpacing: "0.1em"
                }}
              />
            </div>
          )}

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

          {/* Tombol Logout (Membuka Modal) */}
          <div 
            onClick={() => setShowLogoutModal(true)} // ✨ Buka pop up
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

          {/* User Avatar */}
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

      {/* ✨ Modal Custom Logout Neon Purple */}
      {showLogoutModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)", // Efek blur di background
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, // Pastikan ini paling depan
        }}>
          <div style={{
            background: "#0f0f1a",
            border: "1px solid rgba(168, 85, 247, 0.6)", // Border ungu neon
            boxShadow: "0 0 30px rgba(168, 85, 247, 0.25), inset 0 0 20px rgba(168, 85, 247, 0.05)", // Glow ungu
            borderRadius: "8px",
            padding: "30px",
            width: "360px",
            textAlign: "center",
            animation: "fadeIn 0.2s ease-out",
          }}>
            <h2 style={{
              fontFamily: "'Orbitron', sans-serif",
              color: "#fff",
              fontSize: "18px",
              letterSpacing: "0.15em",
              margin: "0 0 10px 0",
              textShadow: "0 0 10px rgba(168, 85, 247, 0.8)", // Text glow ungu
            }}>
              TERMINATE SESSION
            </h2>
            <p style={{
              fontFamily: "'Share Tech Mono', monospace",
              color: "#9ca3af",
              fontSize: "12px",
              marginBottom: "30px",
            }}>
              Are you sure you want to log out from the dashboard?
            </p>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  flex: 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                CANCEL
              </button>
              
              <button 
                onClick={handleConfirmLogout}
                style={{
                  background: "linear-gradient(90deg, #9333ea, #a855f7)", // Gradient ungu
                  border: "none",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  fontWeight: "bold",
                  cursor: "pointer",
                  flex: 1,
                  boxShadow: "0 0 15px rgba(168, 85, 247, 0.5)", // Glow ungu
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 25px rgba(168, 85, 247, 0.8)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 15px rgba(168, 85, 247, 0.5)"}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
