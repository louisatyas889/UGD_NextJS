'use client';

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deleteCargoAction } from "@/app/admin/actions";
import { type CargoRecord } from "@/app/lib/cargo-types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

function statusConfig(status: string) {
  const s = status.toLowerCase();
  if (s.includes("selesai") || s.includes("sampai")) return { label: status, color: "#4ade80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.20)" };
  if (s.includes("pengiriman") || s.includes("proses")) return { label: status, color: "#22d3ee", bg: "rgba(34,211,238,0.10)", border: "rgba(34,211,238,0.20)" };
  if (s.includes("pending") || s.includes("diproses")) return { label: status, color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.20)" };
  return { label: status, color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.20)" };
}

function deliveryConfig(type: string) {
  const t = type?.toLowerCase() || "";
  if (t.includes("vvip")) return { color: "#f472b6", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.20)" };
  if (t.includes("cepat")) return { color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.20)" };
  return { color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.20)" };
}

export default function CargoTable({ records, activeEditId }: { records: CargoRecord[]; activeEditId: number | null }) {
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
    if (params.get("edit") !== String(id)) return;
    params.delete("edit");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  async function handleDelete(id: number, trackingNumber: string) {
    if (!window.confirm(`Hapus data cargo ${trackingNumber}?`)) return;
    setPendingId(id);
    setFeedback("");
    startTransition(async () => {
      const result = await deleteCargoAction(id);
      setFeedback(result.message);
      if (result.success) { removeEditIfNeeded(id); router.refresh(); }
      setPendingId(null);
    });
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-12 text-center font-mono text-xs tracking-widest text-slate-500">
        Tidak ada data cargo yang cocok dengan pencarian saat ini.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Cargo Directory</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Tabel Data Cargo</h2>
          <p className="mt-2 text-sm text-slate-400">{records.length} data cargo dibaca langsung dari Neon.</p>
        </div>
        <a className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white" href={baseUrl}>Refresh</a>
      </div>

      {feedback ? <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{feedback}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" style={{ maxHeight: "620px", overflow: "auto", paddingRight: 4 }}>
        {records.map((record) => {
          const rowPending = pendingId === record.id;
          const isActive = activeEditId === record.id;
          const status = statusConfig(record.shipmentStatus);
          const delivery = deliveryConfig(record.deliveryType);

          return (
            <div key={record.id} className={`rounded-2xl border bg-gradient-to-b from-slate-800/50 to-slate-900/60 p-4 transition-all hover:border-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.06)] ${isActive ? "border-violet-400/30 shadow-[0_0_20px_rgba(139,92,246,0.10)]" : "border-white/8"}`}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold tracking-wider text-cyan-300">{record.trackingNumber}</p>
                  <p className="mt-1 font-mono text-[10px] tracking-wider text-slate-500">{formatDate(record.shippingDate)}</p>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 9, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.06em", background: status.bg, border: `1px solid ${status.border}`, color: status.color }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: status.color, boxShadow: `0 0 5px ${status.color}` }} />{status.label}
                </span>
              </div>

              <div className="mb-3 rounded-xl border border-white/5 bg-slate-950/40 p-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[10px]">
                  <div>
                    <span className="font-mono uppercase tracking-wider text-slate-500">Pengirim</span>
                    <p className="mt-0.5 text-xs font-medium text-white">{record.senderName}</p>
                  </div>
                  <div>
                    <span className="font-mono uppercase tracking-wider text-slate-500">Penerima</span>
                    <p className="mt-0.5 text-xs text-slate-300">{record.recipientName}</p>
                  </div>
                  <div>
                    <span className="font-mono uppercase tracking-wider text-slate-500">Barang</span>
                    <p className="mt-0.5 text-xs text-slate-300">{record.itemName} <span className="text-slate-500">({record.itemType})</span></p>
                    <p className="mt-0.5 font-mono text-[9px] text-slate-500">{record.itemWeightKg} Kg</p>
                  </div>
                  <div>
                    <span className="font-mono uppercase tracking-wider text-slate-500">Rute</span>
                    <p className="mt-0.5 text-xs text-slate-300">{record.originCity} → {record.destinationCity}</p>
                    <span style={{ display: "inline-block", marginTop: 4, padding: "1px 7px", borderRadius: 10, fontSize: 8, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.06em", background: delivery.bg, border: `1px solid ${delivery.border}`, color: delivery.color }}>{record.deliveryType}</span>
                  </div>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Harga</span>
                <span className="font-mono text-sm font-semibold tracking-wider text-cyan-300">{formatCurrency(record.shippingPrice)}</span>
              </div>

              {record.description && (
                <p className="mb-3 line-clamp-2 rounded-lg border border-white/5 bg-slate-950/30 px-3 py-2 text-[10px] leading-relaxed text-slate-500 font-mono">{record.description}</p>
              )}

              <div className="flex gap-2">
                <button className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${isActive ? "border-violet-400/30 bg-violet-400/10 text-violet-200" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"}`} onClick={() => openEdit(record.id)} type="button">{isActive ? "Editing..." : "Edit"}</button>
                <button className="flex-1 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-60" disabled={rowPending || isPending} onClick={() => handleDelete(record.id, record.trackingNumber)} type="button">{rowPending ? "Deleting..." : "Hapus"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
