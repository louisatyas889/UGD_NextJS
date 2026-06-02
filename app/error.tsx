import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Error | Serena Sail",
  description: "Terjadi kesalahan sistem. Silakan muat ulang atau kembali ke beranda.",
};

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-10 text-center shadow-2xl shadow-black/40">
        <p className="text-sm uppercase tracking-[0.35em] text-rose-400">SYSTEM ERROR</p>
        <h1 className="mt-6 text-5xl font-black tracking-tight">Terjadi Kesalahan</h1>
        <p className="mt-5 text-base leading-relaxed text-slate-300">
          Maaf, sistem menemukan masalah saat memproses permintaan Anda. Pastikan data valid dan coba lagi.
        </p>
        <p className="mt-4 text-sm text-slate-500">{error?.message}</p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Muat Ulang
          </button>
          <a
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-400"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </main>
  );
}
