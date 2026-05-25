import { ReactNode } from "react";
import { requireSession } from "@/app/lib/auth";

export default async function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireSession();
  return children;
}
