import Link from "next/link";
import SereneSailTopbar from "@/app/ui/SereneSailTopbar";
import CargoFormAdd from "@/app/admin/components/CargoFormAdd";
import CargoFormEdit from "@/app/admin/components/CargoFormEdit";
import CargoTable from "@/app/admin/components/CargoTable";
import {
  fetchAdminCargoRecordById,
  fetchAdminCargoRecords,
  fetchAdminCargoSummary,
} from "@/app/lib/admin-cargo";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams?: Promise<{
    query?: string | string[];
    edit?: string | string[];
  }>;
};

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parsePositiveInt(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = (await searchParams) ?? {};
  const query = readParam(params.query).trim();
  const editId = parsePositiveInt(readParam(params.edit));

  const [records, summary, editingRecord] = await Promise.all([
    fetchAdminCargoRecords(query),
    fetchAdminCargoSummary(),
    editId ? fetchAdminCargoRecordById(editId) : Promise.resolve(null),
  ]);

  const cards = [
    { label: "Total Pengiriman Laut", value: summary.totalShipments, tone: "text-cyan-300" },
    { label: "Dalam Proses", value: summary.totalShipments - summary.completedShipments, tone: "text-amber-300" },
    { label: "Sampai / Selesai", value: summary.completedShipments, tone: "text-emerald-300" },
    { label: "Total Tarif", value: formatCurrency(summary.totalRevenue), tone: "text-pink-300" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f2740_0%,#020617_38%,#020617_100%)] text-slate-100">
      <SereneSailTopbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-[28px] border border-cyan-400/15 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/10 backdrop-blur">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
              Admin Cargo Control
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Halaman Admin Cargo
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
              READ dan SEARCH dijalankan langsung dari Server Component ke Neon,
              sedangkan CREATE, UPDATE, dan DELETE diproses aman lewat Server
              Actions dengan validasi dan try-catch agar tidak mudah crash.
              Halaman ini sekarang khusus untuk cargo laut.
            </p>
          </div>

          <div className="min-w-[280px] rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-slate-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              Status Sistem
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Sinkronisasi database aktif. Semua data pada tabel di bawah dibaca
              langsung dari Neon tanpa dummy data.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.85)]" />
              Connected to Neon
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-5 shadow-xl shadow-black/20"
              key={card.label}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {card.label}
              </p>
              <p className={`mt-3 text-2xl font-semibold ${card.tone}`}>
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-6 rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                Search
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Cari Data Cargo
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Pencarian mendukung no resi, nama pengirim, nama penerima, dan
                nama barang.
              </p>
            </div>

            <form action="/admin" className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70"
                defaultValue={query}
                name="query"
                placeholder="Cari no resi, pengirim, penerima, atau barang..."
                type="text"
              />
              <button
                className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                type="submit"
              >
                Cari
              </button>
              <Link
                className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
                href="/admin"
              >
                Reset
              </Link>
            </form>
          </div>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-2">
          <CargoFormAdd />
          <CargoFormEdit record={editingRecord} />
        </section>

        <CargoTable activeEditId={editId} records={records} />
      </main>
    </div>
  );
}
