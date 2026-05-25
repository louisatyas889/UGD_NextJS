'use client';

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deleteCargoAction } from "@/app/admin/actions";
import { type CargoRecord } from "@/app/lib/cargo-types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function statusTone(status: string) {
  if (status === "Selesai" || status === "Sampai Tujuan") {
    return "bg-emerald-400/10 text-emerald-200 border-emerald-400/20";
  }

  if (status === "Dalam Pengiriman") {
    return "bg-cyan-400/10 text-cyan-200 border-cyan-400/20";
  }

  if (status === "Pending") {
    return "bg-amber-400/10 text-amber-200 border-amber-400/20";
  }

  return "bg-violet-400/10 text-violet-200 border-violet-400/20";
}

export default function CargoTable({
  records,
  activeEditId,
}: {
  records: CargoRecord[];
  activeEditId: number | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const baseUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  function openEdit(id: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", String(id));
    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  function removeEditIfNeeded(id: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (params.get("edit") !== String(id)) {
      return;
    }

    params.delete("edit");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  async function handleDelete(id: number, trackingNumber: string) {
    const confirmed = window.confirm(
      `Hapus data cargo dengan resi ${trackingNumber} dari database Neon?`,
    );

    if (!confirmed) {
      return;
    }

    setPendingId(id);
    setFeedback("");

    startTransition(async () => {
      const result = await deleteCargoAction(id);
      setFeedback(result.message);

      if (result.success) {
        removeEditIfNeeded(id);
        router.refresh();
      }

      setPendingId(null);
    });
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-10 text-center text-sm text-slate-400">
        Tidak ada data cargo yang cocok dengan pencarian saat ini.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Read + Delete
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Tabel Data Cargo
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Data ini langsung dibaca dari Neon lewat Server Component. Klik edit
            untuk memuat data lama ke form update.
          </p>
        </div>

        <a
          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
          href={baseUrl}
        >
          Refresh Halaman
        </a>
      </div>

      {feedback ? (
        <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          {feedback}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/5 bg-slate-950/40">
        <div className="max-h-[620px] overflow-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 text-xs uppercase tracking-[0.2em] text-slate-500 backdrop-blur">
            <tr>
              <th className="px-3 py-4">No Resi</th>
              <th className="px-3 py-4">Pengirim / Penerima</th>
              <th className="px-3 py-4">Rute</th>
              <th className="px-3 py-4">Barang</th>
              <th className="px-3 py-4">Status</th>
              <th className="px-3 py-4">Harga</th>
              <th className="px-3 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const rowPending = pendingId === record.id;
              const isActive = activeEditId === record.id;

              return (
                <tr
                  className={`border-b border-white/5 align-top ${
                    isActive ? "bg-violet-500/5" : ""
                  }`}
                  key={record.id}
                >
                  <td className="px-3 py-4">
                    <div className="font-medium text-cyan-300">
                      {record.trackingNumber}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {formatDate(record.shippingDate)}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Laut / {record.deliveryType}
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <div className="font-medium text-white">{record.senderName}</div>
                    <div className="mt-2 text-slate-300">{record.recipientName}</div>
                    <div className="mt-2 text-xs text-slate-500">{record.phone}</div>
                  </td>

                  <td className="px-3 py-4">
                    <div>{record.originCity}</div>
                    <div className="my-2 text-xs text-slate-500">menuju</div>
                    <div>{record.destinationCity}</div>
                  </td>

                  <td className="px-3 py-4">
                    <div className="font-medium text-white">{record.itemName}</div>
                    <div className="mt-2 text-slate-300">{record.itemType}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {record.itemWeightKg} Kg
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <div
                      className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone(record.shipmentStatus)}`}
                    >
                      {record.shipmentStatus}
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <div className="font-medium text-white">
                      {formatCurrency(record.shippingPrice)}
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs text-slate-500">
                      {record.description || "Tanpa catatan tambahan"}
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex min-w-36 flex-col gap-2">
                      <button
                        className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
                        onClick={() => openEdit(record.id)}
                        type="button"
                      >
                        {isActive ? "Sedang Diedit" : "Edit"}
                      </button>

                      <button
                        className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={rowPending || isPending}
                        onClick={() =>
                          handleDelete(record.id, record.trackingNumber)
                        }
                        type="button"
                      >
                        {rowPending ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  );
}
