import type { Metadata } from "next";
import CargoManagementWorkspace from "./cargo-management-workspace";

export const metadata: Metadata = {
  title: "Cargo Management | Serena Sail",
  description: "Halaman manajemen cargo untuk mencari dan mengelola data muatan.",
};

export const dynamic = "force-dynamic";

export default function CargoManagementPage() {
  return <CargoManagementWorkspace />;
}
