"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
// Import data dummy
import { dummyAdmins } from "../lib/placeholder-data";

export default function SereneSailTopbar() {
  const router = useRouter();
  const path = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Simulasi mengambil data admin yang sedang login (misal: Louisa)
  const currentAdmin = dummyAdmins[0]; 

  // Update time setiap detik untuk real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Menu FLEET & LOGISTICS telah dihapus dari sini
  const navs = [
    { label: "CARGO MANAGEMENT", href: "/admin" },
    { label: "USER MANAGEMENT", href: "/admin/user-management" },
    { label: "SECURITY & ACCOUNTS", href: "/admin/security-accounts" },
  ];

  const handleLogout = () => {
    setShowLogoutModal(false);
    // Pastikan logout benar-benar redirect. Gunakan router replace agar tidak bisa back.
    router.replace("/login");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <header style={{
      width: "100%",
      background: "rgba(10, 10, 20, 0.95)",
      borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      backdropFilter: "blur(10px)",
    }}>
      <style>{`
        .nav-btn:hover { color: #fff !important; }
        .nav-btn::after {
          content: ''; position: absolute; bottom: 0; left: 50%; width: 0; 
          height: 2px; background: #a855f7; transition: all 0.3s ease; transform: translateX(-50%);
          box-shadow: 0 0 8px #a855f7;
        }
        .nav-btn.active::after { width: 100%; }
        .logo-text:hover { text-shadow: 0 0 12px #a855f7; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Inner Wrapper: Mengunci komponen agar satu frame (max-width 1400px) dengan konten halaman */}
      <div style={{
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        height: 48, 
        maxWidth: "1400px",
        width: "100%",
        margin: "0 auto",
        padding: "0 24px",
      }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
          {/* Logo Section */}
          <div 
            className="logo-text"
            onClick={() => router.push("/admin")}
            style={{
              fontFamily: "'Orbitron', sans-serif", 
              fontSize: 16, fontWeight: 900,
              color: "#a855f7", letterSpacing: "0.1em", cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            SERENE<span style={{ color: "#fff", marginLeft: 4 }}>SAIL</span>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: "flex", height: 48 }}>
            {navs.map(n => (
              <button 
                key={n.label} 
                className={`nav-btn ${path === n.href ? "active" : ""}`}
                onClick={() => router.push(n.href)} 
                style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                  letterSpacing: "0.15em", color: path === n.href ? "#fff" : "#6b7280",
                  padding: "0 20px", cursor: "pointer", position: "relative",
                  textTransform: "uppercase", border: "none", background: "none",
                  height: "100%", display: "flex", alignItems: "center",
                  transition: "color 0.3s ease",
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Action Icons Section */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          
          {/* Info Badge */}
          <div style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
            color: "#a855f7", background: "rgba(168, 85, 247, 0.1)",
            padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(168, 85, 247, 0.3)"
          }}>
            {currentAdmin.role}
          </div>

          {/* Logout Button */}
          <div 
            onClick={() => setShowLogoutModal(true)}
            title="Logout"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              width: 32, 
              height: 32, 
              cursor: "pointer", 
              color: "#f43f5e", 
              borderRadius: "50%", 
              border: "1px solid rgba(244, 63, 94, 0.2)",
              background: "rgba(244, 63, 94, 0.05)", 
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(244, 63, 94, 0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(244, 63, 94, 0.05)"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>

          {/* User Profile Avatar - Now Clickable */}
          <div style={{ position: "relative" }}>
            <div
              onClick={() => router.push("/profile")}
              title={`Profile: ${currentAdmin.name}`}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)",
                boxShadow: "0 0 10px rgba(168, 85, 247, 0.4)",
                fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: "bold", color: "#fff",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {currentAdmin.avatar}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: 360, background: '#0f0f1a',
            border: '1px solid rgba(168, 85, 247, 0.6)', borderRadius: 8,
            padding: 30, textAlign: 'center', 
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.25), inset 0 0 20px rgba(168, 85, 247, 0.05)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <h2 style={{ 
              fontFamily: "'Orbitron', sans-serif", 
              color: '#fff', 
              fontSize: 18, 
              marginBottom: 10, 
              letterSpacing: '0.15em',
              textShadow: "0 0 10px rgba(168, 85, 247, 0.8)"
            }}>
              TERMINATE SESSION
            </h2>
            <p style={{ 
              fontFamily: "'Share Tech Mono', monospace", 
              color: '#9ca3af', 
              fontSize: 12, 
              marginBottom: 30 
            }}>
              Are you sure you want to log out from the dashboard?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: "center" }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '10px 20px', borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent', color: '#fff', fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >CANCEL</button>
              <button 
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '10px 20px', borderRadius: 4, border: 'none',
                  background: 'linear-gradient(90deg, #9333ea, #a855f7)', color: '#fff', 
                  fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', letterSpacing: '0.1em',
                  fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)',
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 25px rgba(168, 85, 247, 0.8)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 15px rgba(168, 85, 247, 0.5)"}
              >CONFIRM</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
