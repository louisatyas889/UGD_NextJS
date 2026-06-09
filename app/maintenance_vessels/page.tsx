import MaintenanceClient from "./maintenance-client";

export const metadata = {
  title: "MAINTENANCE PROTOCOL | Fleet System",
  description: "Sistem inisialisasi mode maintenance dan log kerusakan armada kapal.",
};

// Server Component: hanya me-render Client Component.
// Data kapal MAINTENANCE diambil di sisi client melalui MaintenanceContext 
// (polling API /api/maintenance-vessels setiap 5 detik), agar tetap realtime
// sinkron dengan perubahan di Fleet Page.
export default function MaintenanceVesselsPage() {
  return (
    <main>
      <MaintenanceClient />
    </main>
  );
}
