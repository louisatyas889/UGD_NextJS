import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cargo Management | Serena Sail",
  description: "Halaman manajemen cargo untuk mencari dan mengelola data muatan.",
};

export const dynamic = "force-dynamic";

export default function CargoManagementPage() {
  redirect("/admin");
}
