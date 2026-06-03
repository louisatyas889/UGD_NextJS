import type { Metadata } from "next";
import SereneSailTopbar from "@/app/ui/SereneSailTopbar";
import CargoManagementWorkspace from "@/app/admin/cargo-management/cargo-management-workspace";
// Impor fungsi pencarian database bawaan proyek kamu
import {
  fetchAdminCargoRecords,
  fetchAdminCargoSummary,
} from "@/app/lib/admin-cargo";

export const metadata: Metadata = {
  title: "Admin Cargo Dispatch | Serena Sail",
  description: "Panel kendali manifest pengiriman, alokasi armada kapal, sortir logistik, dan validasi manifes masuk.",
};

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams?: Promise<{
    query?: string | string[];
  }>;
};

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // 1. Membaca query pencarian dari URL secara aman (Next.js 15 Style)
  const params = (await searchParams) ?? {};
  const query = readParam(params.query).trim();

  // 2. Mengambil data langsung dari fungsi internal proyek kamu
  const [records, summary] = await Promise.all([
    fetchAdminCargoRecords(query),
    fetchAdminCargoSummary(),
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f2740_0%,#020617_38%,#020617_100%)] text-slate-100">
      {/* Navigasi Atas */}
      <SereneSailTopbar />

      {/* Memanggil Workspace dan mengirimkan data hasil query server di atas.
        Pencarian, dropdown armada, dan proteksi harga akan dikelola di sini.
      */}
      <CargoManagementWorkspace 
        initialRecords={records} 
        initialSummary={summary} 
        currentQuery={query}
      />
    </div>
  );
}