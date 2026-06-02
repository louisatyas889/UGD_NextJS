import { ReactNode } from "react";
import { requireSession } from "@/app/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Amankan rute dashboard dengan validasi sesi pengguna
  await requireSession();

  return (
    <div className="flex min-h-screen bg-[#0a0a10]">
      {/* Jika Anda memiliki komponen Sidebar bawaan proyeks (misal: <SideNav />), 
        Anda bisa mengimpor dan meletakkannya di sini agar muncul di sisi kiri dashboard.
      */}
      
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
