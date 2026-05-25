'use client';

import { useActionState, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { initialCargoActionState } from "@/app/admin/action-state";
import { updateCargoAction } from "@/app/admin/actions";
import { shipmentStatusOptions, type CargoRecord } from "@/app/lib/cargo-types";

type EditFormValues = {
  id: string;
  shipmentStatus: string;
  shippingPrice: string;
  description: string;
};

const inputClassName =
  "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-violet-400/70";

function buildEditValues(record: CargoRecord): EditFormValues {
  return {
    id: String(record.id),
    shipmentStatus: record.shipmentStatus,
    shippingPrice: String(record.shippingPrice),
    description: record.description,
  };
}

function UpdateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Menyimpan perubahan..." : "Update Status dan Harga"}
    </button>
  );
}

function readOnlyCard(label: string, value: string) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-100">{value || "-"}</p>
    </div>
  );
}

export default function CargoFormEdit({
  record,
}: {
  record: CargoRecord | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState(
    updateCargoAction,
    initialCargoActionState,
  );
  const [formValues, setFormValues] = useState<EditFormValues | null>(
    record ? buildEditValues(record) : null,
  );

  useEffect(() => {
    setFormValues(record ? buildEditValues(record) : null);
  }, [record]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  const cancelHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const nextQuery = params.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
  }, [pathname, searchParams]);

  if (!record || !formValues) {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
        <p className="text-xs uppercase tracking-[0.25em] text-violet-300">
          Update
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Edit Data Cargo</h2>
        <p className="mt-3 text-sm text-slate-400">
          Klik tombol edit pada tabel agar status pengiriman dan harga lama
          otomatis muncul di form ini.
        </p>
      </section>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 shadow-2xl shadow-black/20"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-violet-300">
            Update
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Edit Cargo #{record.trackingNumber}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Data lama sudah ditarik dari database dan siap diperbarui.
          </p>
        </div>

        <button
          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
          onClick={() => router.replace(cancelHref)}
          type="button"
        >
          Tutup
        </button>
      </div>

      {state.message ? (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            state.success
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-rose-400/30 bg-rose-400/10 text-rose-200"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        {readOnlyCard("Pengirim", record.senderName)}
        {readOnlyCard("Penerima", record.recipientName)}
        {readOnlyCard("Barang", `${record.itemName} (${record.itemType})`)}
        {readOnlyCard("Rute", `${record.originCity} -> ${record.destinationCity}`)}
      </div>

      <input name="id" type="hidden" value={formValues.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-300">
          Status Pengiriman
          <select
            className={inputClassName}
            name="shipmentStatus"
            onChange={(event) =>
              setFormValues((current) =>
                current
                  ? { ...current, shipmentStatus: event.target.value }
                  : current,
              )
            }
            value={formValues.shipmentStatus}
          >
            {shipmentStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-rose-300">
            {state.fieldErrors?.shipmentStatus?.[0]}
          </p>
        </label>

        <label className="block text-sm text-slate-300">
          Harga Pengiriman
          <input
            className={inputClassName}
            min="0"
            name="shippingPrice"
            onChange={(event) =>
              setFormValues((current) =>
                current
                  ? { ...current, shippingPrice: event.target.value }
                  : current,
              )
            }
            step="1000"
            type="number"
            value={formValues.shippingPrice}
          />
          <p className="mt-1 text-xs text-rose-300">
            {state.fieldErrors?.shippingPrice?.[0]}
          </p>
        </label>

        <label className="block text-sm text-slate-300 md:col-span-2">
          Deskripsi
          <textarea
            className={`${inputClassName} min-h-28 resize-y rounded-2xl`}
            name="description"
            onChange={(event) =>
              setFormValues((current) =>
                current
                  ? { ...current, description: event.target.value }
                  : current,
              )
            }
            value={formValues.description}
          />
        </label>
      </div>

      <div className="mt-6">
        <UpdateButton />
      </div>
    </form>
  );
}
