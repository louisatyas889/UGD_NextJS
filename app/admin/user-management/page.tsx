import SereneSailTopbar from "@/app/ui/SereneSailTopbar";
import UserManagementTable from "./user-management-table";
import { fetchPersonnelRecords } from "@/app/lib/admin-panels";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  const records = await fetchPersonnelRecords();
  const currentHour = new Date().getHours();
  const onDutyCount = records.filter((crew) => {
    if (crew.startHour < crew.endHour) {
      return currentHour >= crew.startHour && crew.endHour > currentHour;
    }
    return currentHour >= crew.startHour || crew.endHour > currentHour;
  }).length;

  return (
    <div className="min-h-screen text-white" style={{
      background: "radial-gradient(circle at top, #12314d 0%, #09090b 42%, #09090b 100%)",
    }}>
      <SereneSailTopbar />

      <main className="mx-auto max-w-[1360px] px-6 py-8 pb-28">
        <header className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.2em] text-slate-500">
            FLEET PERSONNEL COMMAND
          </p>
          <h1 className="mt-1 text-[30px] font-bold">User Management</h1>
        </header>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "TOTAL CREW", value: String(records.length) },
            { label: "ON DECK", value: String(onDutyCount), online: true },
            { label: "SHIFT TYPES", value: "3 SHIFT" },
            { label: "DB STATUS", value: "Synced", accent: true },
          ].map((stat, index) => (
            <div
              key={index}
              className="rounded-[22px] border border-white/5 p-6 shadow-[0_18px_36px_rgba(0,0,0,0.24)]"
              style={{ background: "linear-gradient(180deg, rgba(17,17,20,0.95), rgba(8,8,10,0.98))" }}
            >
              <p className="font-mono text-[9px] tracking-[0.18em] text-slate-500">
                {stat.label}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {stat.online && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]" />
                )}
                <span className={`${stat.accent ? "text-emerald-400" : "text-white"} text-2xl font-semibold`}>
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        <UserManagementTable currentHour={currentHour} records={records} />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-white/5 bg-[#050508] px-6 py-2 font-mono text-[9px] tracking-wide text-slate-500">
        <span>SYSTEM HEALTH: NOMINAL | CONNECTIVITY: ACTIVE</span>
        <span>LAT: 24.1200 N LONG: 80.1234 W</span>
      </footer>
    </div>
  );
}
