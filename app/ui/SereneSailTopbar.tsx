"use client";
import { useRouter, usePathname } from "next/navigation";
// Import data dummy
import { dummyAdmins } from "../lib/placeholder-data";

export default function SereneSailTopbar() {
  const router = useRouter();
  const path = usePathname();

  // Simulasi mengambil data admin yang sedang login (misal: Louisa)
  const currentAdmin = dummyAdmins[0]; 

  const navs = [
    { label: "USER MANAGEMENT", href: "/admin/user-management" },
    { label: "FLEET & LOGISTICS", href: "/admin/fleet-logistics" },
    { label: "SECURITY & ACCOUNTS", href: "/admin/security-accounts" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 48, padding: "0 24px", background: "rgba(10, 10, 20, 0.95)",
      borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
      position: "sticky", top: 0, zIndex: 1000,
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
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
        {/* Logo Section */}
        <div 
          className="logo-text"
          onClick={() => router.push("/admin/fleet-logistics")}
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
        
        {/* Info Badge (Optional: Menunjukkan Role) */}
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
          color: "#a855f7", background: "rgba(168, 85, 247, 0.1)",
          padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(168, 85, 247, 0.3)"
        }}>
          {currentAdmin.role}
        </div>

        {/* Notification Bell */}
        <div style={{ 
          display: "flex", alignItems: "center", justifyContent: "center", 
          width: 32, height: 32, cursor: "pointer", color: "#6b7280", 
          borderRadius: "50%", transition: "all 0.2s",
          border: "1px solid rgba(255,255,255,0.05)"
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = "#22d3ee"}
        onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        {/* Logout Button */}
        <div 
          onClick={() => { if(confirm("TERMINATE ADMIN SESSION?")) router.push("/login"); }}
          title="Logout"
          style={{ 
            display: "flex", alignItems: "center", justifyContent: "center", 
            width: 32, height: 32, cursor: "pointer", color: "#f43f5e", 
            borderRadius: "50%", border: "1px solid rgba(244, 63, 94, 0.2)",
            background: "rgba(244, 63, 94, 0.05)", transition: "all 0.2s"
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

        {/* User Profile Avatar (Menggunakan Initial dari Dummy Data) */}
        <div
          title={`Logged in as ${currentAdmin.name}`}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #a855f7, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "default", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 10px rgba(168, 85, 247, 0.4)",
            fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: "bold", color: "#fff"
          }}
        >
          {currentAdmin.avatar}
        </div>
      </div>
    </div>
  );
}
