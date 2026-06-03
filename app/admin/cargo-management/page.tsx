import type { Metadata } from "next";
import CargoManagementWorkspace from "./cargo-management-workspace";
// PENTING: Impor fungsi pengambil data bawaan dari proyek kamu
import {
  fetchAdminCargoRecords,
  fetchAdminCargoSummary,
} from "@/app/lib/admin-cargo";

export const metadata: Metadata = {
  title: "Cargo Management | Serena Sail",
  description: "Halaman manajemen cargo untuk mencari dan mengelola data muatan.",
};

export const dynamic = "force-dynamic";

// 1. Definisikan tipe searchParams untuk membaca keyword pencarian dari URL (Next.js 15 Style)
type PageProps = {
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

// 2. Ubah komponen menjadi 'async' agar bisa mengambil data langsung dari database
export default async function CargoManagementPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const query = readParam(params.query).trim();

  // 3. Ambil data manifest dan summary dari database proyek kamu
  const [records, summary] = await Promise.all([
    fetchAdminCargoRecords(query),
    fetchAdminCargoSummary(),
  ]);

  // 4. Kirimkan data hasil fetch tersebut ke dalam Workspace sebagai props
  return (
    <CargoManagementWorkspace 
      initialRecords={records} 
      initialSummary={summary} 
      currentQuery={query}
    />
  );
}
