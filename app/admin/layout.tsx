import { ReactNode } from "react";
import { requireAdminSession } from "@/app/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSession();
  return children;
}

