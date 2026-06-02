import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 Not Found | Serena Sail",
  description: "Halaman tidak ditemukan. Kembali ke beranda Serena Sail.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-10 text-center shadow-2xl shadow-black/40">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">404 ERROR</p>
        <h1 className="mt-6 text-6xl font-black tracking-tight">Halaman Tidak Ditemukan</h1>
        <p className="mt-5 text-base leading-relaxed text-slate-300">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan. Gunakan tombol di bawah untuk kembali ke beranda.
        </p>
        <Link
          href="/"
          className="inline-flex mt-8 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
