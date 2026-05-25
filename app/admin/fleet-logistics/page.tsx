import { Orbitron, Rajdhani, Share_Tech_Mono } from "next/font/google";
import SereneSailTopbar from "@/app/ui/SereneSailTopbar";
import FleetLogisticsBoard from "./fleet-logistics-board";
import { fetchFleetVessels, fetchTrackingPackagesRecords } from "@/app/lib/admin-panels";

export const dynamic = "force-dynamic";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "600", "700", "900"] });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const shareTechMono = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

export default async function FleetLogisticsPage() {
  const [vessels, packages] = await Promise.all([
    fetchFleetVessels(),
    fetchTrackingPackagesRecords(),
  ]);

  const delayedVessels = vessels.filter((vessel) =>
    /delay|storm/i.test(vessel.status),
  ).length;
  const activePackages = packages.length;

  return (
    <div className={`min-h-screen bg-[#0a0a10] text-[#e5e7eb] ${rajdhani.className} overflow-x-hidden`}>
      <SereneSailTopbar />

      <div className="border-b border-white/5 px-6 py-4">
        <div className="mb-1 flex items-center gap-3.5">
          <h1 className={`${orbitron.className} text-lg font-bold tracking-[0.04em] text-white`}>
            OPERATIONS HUB
          </h1>
          <span
            className={`${shareTechMono.className} inline-flex items-center gap-1.5 rounded-sm border border-cyan-500/30 bg-cyan-500/5 px-2.5 py-1 text-[8px] tracking-[0.16em] text-cyan-400`}
          >
            LIVE TELEMETRY
          </span>
        </div>
        <p className="text-[13px] text-slate-500">
          Real-time oversight of global maritime assets and high-priority logistics segments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Vessels", value: vessels.length, note: "Semua vessel di database." },
          { label: "Tracked Packages", value: activePackages, note: "Paket aktif tracking." },
          { label: "Delay / Storm", value: delayedVessels, note: "Kapal perlu perhatian." },
          { label: "DB Sync", value: "LIVE", note: "Revalidasi langsung.", live: true },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[18px] border border-white/8 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
            style={{ background: "linear-gradient(180deg, rgba(18,18,28,0.96), rgba(9,9,15,0.96))" }}
          >
            <p className={`${shareTechMono.className} text-[9px] uppercase tracking-[0.18em] text-slate-500`}>
              {card.label}
            </p>
            <p className={`${orbitron.className} mt-2.5 text-2xl ${card.live ? "text-emerald-400" : "text-white"}`}>
              {card.value}
            </p>
            <p className="mt-2 text-xs text-slate-400">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.03] px-5 py-3.5">
        <span className={`${shareTechMono.className} text-[10px] tracking-[0.22em] text-violet-400`}>
          FLEET OVERVIEW
        </span>
        <span className={`${shareTechMono.className} text-[8px] tracking-[0.14em] text-slate-500`}>
          ACTIVE VESSELS: {vessels.length}
        </span>
      </div>

      <main className="pb-16">
        <FleetLogisticsBoard packages={packages} vessels={vessels} />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-7 items-center gap-5 border-t border-violet-400/20 bg-[#05050a] px-6">
        <span className={`${shareTechMono.className} text-[8px] tracking-[0.14em] text-slate-500`}>
          SYSTEM HEALTH: <span className="text-violet-400">NOMINAL</span>
        </span>
        <span className={`${shareTechMono.className} text-[8px] tracking-[0.14em] text-slate-500`}>
          CONNECTIVITY: <span className="text-violet-400">ACTIVE</span>
        </span>
        <span className={`${shareTechMono.className} text-[8px] tracking-[0.14em] text-slate-500`}>
          TELEMETRY: <span className="text-violet-400">SYNCHRONIZED</span>
        </span>
      </footer>
    </div>
  );
}
