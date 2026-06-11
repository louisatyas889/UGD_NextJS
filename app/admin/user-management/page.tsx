import type { Metadata } from "next";
import SereneSailTopbar from "@/app/ui/SereneSailTopbar";
import UserManagementTable from "./user-management-table-new";
import { fetchSecurityUsers } from "@/app/lib/admin-panels"; // Mengambil data pengguna
import { fetchVesselData } from "@/app/lib/data"; // Mengambil data kapal

export const metadata: Metadata = {
  title: "User Management | Serena Sail",
  description: "Halaman direktori staf dan manajemen pengguna internal untuk sistem logistik.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserManagementPage() {
  const users = await fetchSecurityUsers(); // Ambil data pengguna dari tabel app_users
  const vesselsFromDb = await fetchVesselData(); // Ambil data kapal dari database

  // Petakan data kapal ke format yang diharapkan oleh UserManagementTable
  const dbVessels = (vesselsFromDb || []).map((v: any) => ({
    id: v.id,
    dest: v.destination || v.dest, // Sertakan 'dest' jika diperlukan untuk konteks, meskipun hanya 'id' yang digunakan untuk dropdown
  }));
  
  return (
    <div className="min-h-screen text-white" style={{
      background: "radial-gradient(circle at top, #12314d 0%, #09090b 42%, #09090b 100%)",
    }}>
      <SereneSailTopbar />

      <main className="mx-auto max-w-[1360px] px-6 py-8 pb-28">
        <header className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.2em] text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-block">
            🔐 USER MANAGEMENT PORTAL
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200 italic">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl font-medium">
            Kelola user sistem, atur role akses, assignment vessel, dan jam kerja crew secara real-time.
          </p>
        </header>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "TOTAL USERS", value: String(users.length), color: "from-cyan-500/10 to-slate-950/60", border: "border-cyan-500/20", glow: "text-cyan-400", icon: "👥" },
            { label: "ACTIVE USERS", value: String(users.filter(u => u.status === "Active").length), color: "from-emerald-500/10 to-slate-950/60", border: "border-emerald-500/20", glow: "text-emerald-400", icon: "✅", online: true },
            { label: "ADMINISTRATORS", value: String(users.filter(u => u.role === "SYS-ADMIN").length), color: "from-red-500/10 to-slate-950/60", border: "border-red-500/20", glow: "text-red-400", icon: "🔑" },
            { label: "FLEET MANAGERS", value: String(users.filter(u => u.role === "FLEET-MANAGER").length), color: "from-purple-500/10 to-slate-950/60", border: "border-purple-500/20", glow: "text-purple-400", icon: "🚢" },
          ].map((stat, index) => (
            <div
              key={index}
              className={`relative bg-gradient-to-br ${stat.color} border ${stat.border} p-5 rounded-2xl shadow-xl backdrop-blur-md hover:scale-[1.02] transition-transform duration-300 overflow-hidden group`}
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="text-base">{stat.icon}</span>
                {stat.label}
              </span>
              <div className="mt-2 flex items-center gap-2">
                {stat.online && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]" />
                )}
                <span className={`text-2xl sm:text-3xl font-black tracking-tighter ${stat.glow} drop-shadow-[0_0_10px_currentColor]`}>
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        <UserManagementTable users={users} dbVessels={dbVessels} />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-white/5 bg-[#050508] px-6 py-2 font-mono text-[9px] tracking-wide text-slate-500">
        <span>SYSTEM HEALTH: NOMINAL | CONNECTIVITY: ACTIVE</span>
        <span>LAT: 24.1200 N LONG: 80.1234 W</span>
      </footer>
    </div>
  );
}
