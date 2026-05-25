import SereneSailTopbar from "@/app/ui/SereneSailTopbar";
import SecurityAccountsWorkspace from "./security-accounts-workspace";
import { fetchSecurityLogs, fetchSecurityUsers } from "@/app/lib/admin-panels";

export const dynamic = "force-dynamic";

export default async function SecurityAccountsPage() {
  const [users, logs] = await Promise.all([
    fetchSecurityUsers(),
    fetchSecurityLogs(),
  ]);

  return (
    <div style={{ backgroundColor: "#0a0a10", minHeight: "100vh", color: "white" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&family=Orbitron:wght@700&display=swap');
        .layout-sec{display:grid;grid-template-columns:1fr 450px;gap:24px;padding:24px}
        .panel{background:#0f0f1a;border:1px solid rgba(255,255,255,0.07);padding:20px;position:relative}
        .log-row{display:flex;gap:15px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:12px;animation: fadeIn 0.5s ease-out}
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .inp-cyber{width:100%;background:#050508;border:1px solid #333;color:white;padding:12px;margin-bottom:15px;font-family:'Share Tech Mono'}
        .btn-override{width:100%;padding:15px;background:linear-gradient(90deg,#22d3ee,#a855f7);border:none;color:white;font-weight:bold;cursor:pointer;letter-spacing:2px}
      `}</style>

      <SereneSailTopbar />

      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "10px",
              color: "#4b5563",
              fontFamily: "Share Tech Mono",
            }}
          >
            SYSTEM PROTOCOL 9.4
          </p>
          <h1
            style={{ fontSize: "28px", fontWeight: "700", fontFamily: "Rajdhani" }}
          >
            Security & Control
          </h1>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ background: "#111", padding: "10px 20px", border: "1px solid #22c55e" }}>
            <p style={{ fontSize: "8px", color: "#6b7280" }}>GLOBAL STATUS</p>
            <p style={{ color: "#22c55e", fontSize: "12px", fontWeight: "bold" }}>
              ENCRYPTED
            </p>
          </div>
          <div style={{ background: "#111", padding: "10px 20px", border: "1px solid #333" }}>
            <p style={{ fontSize: "8px", color: "#6b7280" }}>ACTIVE LINKS</p>
            <p style={{ fontSize: "12px", fontWeight: "bold" }}>{users.length} ACCOUNTS</p>
          </div>
        </div>
      </div>

      <SecurityAccountsWorkspace logs={logs} users={users} />

      <div
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          padding: "10px 24px",
          background: "#050508",
          borderTop: "1px solid #222",
          fontSize: "10px",
          display: "flex",
          justifyContent: "space-between",
          color: "#4b5563",
          fontFamily: "Share Tech Mono",
        }}
      >
        <span>SYSTEM HEALTH: NOMINAL</span>
        <span>TELEMETRY: SYNCHRONIZED | LAT: 24.1200 N LONG: 80.1234 W</span>
      </div>
    </div>
  );
}
