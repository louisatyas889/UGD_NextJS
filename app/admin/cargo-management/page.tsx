import type { Metadata } from "next";
import CargoManagementWorkspace from "./cargo-management-workspace";
import {
  fetchAdminCargoRecords,
  fetchAdminCargoSummary,
} from "@/app/lib/admin-cargo";
import { fetchFleetVessels } from "@/app/lib/data";

export const metadata: Metadata = {
  title: "Cargo Management | Serena Sail",
  description: "Halaman manajemen cargo untuk mencari dan mengelola data muatan.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0; // 

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

export default async function CargoManagementPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const query = readParam(params.query).trim();

  const [records, summary, vesselsFromDb] = await Promise.all([
    fetchAdminCargoRecords(query),
    fetchAdminCargoSummary(),
    fetchFleetVessels(),
  ]);
  
  console.log("VESSELS:", vesselsFromDb); // ← tambah in
  return (
    <CargoManagementWorkspace
      initialRecords={records}
      initialSummary={summary}  
      currentQuery={query}
      vesselsFromDb={vesselsFromDb || []}
    />
  );
}
