'use client';

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { initialCargoActionState } from "@/app/admin/action-state";
import { createCargoAction } from "@/app/admin/actions";
import {
  deliveryTypeOptions,
  shipmentStatusOptions,
} from "@/app/lib/cargo-types";

type CargoAddFormValues = {
  shippingDate: string;
  senderName: string;
  recipientName: string;
  phone: string;
  originCity: string;
  destinationCity: string;
  itemName: string;
  itemType: string;
  itemWeightKg: string;
  shippingPrice: string;
  deliveryType: "Biasa" | "Cepat" | "Vvip";
  shipmentStatus: "Diproses" | "Pending" | "Dalam Pengiriman" | "Sampai Tujuan" | "Selesai";
  description: string;
};

const emptyCargoAddFormData: CargoAddFormValues = {
  shippingDate: "",
  senderName: "",
  recipientName: "",
  phone: "",
  originCity: "",
  destinationCity: "",
  itemName: "",
  itemType: "",
  itemWeightKg: "",
  shippingPrice: "",
  deliveryType: "Biasa",
  shipmentStatus: "Diproses",
  description: "",
};

const inputClassName =
  "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Menyimpan ke database..." : "Tambah Data Cargo"}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-rose-300">{message}</p>;
}

export default function CargoFormAdd() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createCargoAction,
    initialCargoActionState,
  );
  const [formValues, setFormValues] = useState<CargoAddFormValues>(
    emptyCargoAddFormData,
  );

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setFormValues(emptyCargoAddFormData);
    router.refresh();
  }, [router, state.success]);

  function handleFieldChange<K extends keyof CargoAddFormValues>(
    field: K,
    value: CargoAddFormValues[K],
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 shadow-2xl shadow-black/20"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Create
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Tambah Data Cargo
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Form ini menulis data baru langsung ke tabel `barang` dan `transaksi`
            di Neon. Halaman ini difokuskan untuk pengiriman laut saja.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-dashed border-cyan-400/20 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
        No Resi akan dibuat otomatis saat data berhasil disimpan.
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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-300">
          Tanggal Kirim
          <input
            className={inputClassName}
            name="shippingDate"
            onChange={(event) =>
              handleFieldChange("shippingDate", event.target.value)
            }
            required
            type="date"
            value={formValues.shippingDate}
          />
          <FieldError message={state.fieldErrors?.shippingDate?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          No Telepon
          <input
            className={inputClassName}
            name="phone"
            onChange={(event) => handleFieldChange("phone", event.target.value)}
            placeholder="08xxxxxxxxxx"
            required
            type="text"
            value={formValues.phone}
          />
          <FieldError message={state.fieldErrors?.phone?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Nama Pengirim
          <input
            className={inputClassName}
            name="senderName"
            onChange={(event) =>
              handleFieldChange("senderName", event.target.value)
            }
            required
            type="text"
            value={formValues.senderName}
          />
          <FieldError message={state.fieldErrors?.senderName?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Nama Penerima
          <input
            className={inputClassName}
            name="recipientName"
            onChange={(event) =>
              handleFieldChange("recipientName", event.target.value)
            }
            required
            type="text"
            value={formValues.recipientName}
          />
          <FieldError message={state.fieldErrors?.recipientName?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Kota Asal
          <input
            className={inputClassName}
            name="originCity"
            onChange={(event) =>
              handleFieldChange("originCity", event.target.value)
            }
            required
            type="text"
            value={formValues.originCity}
          />
          <FieldError message={state.fieldErrors?.originCity?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Kota Tujuan
          <input
            className={inputClassName}
            name="destinationCity"
            onChange={(event) =>
              handleFieldChange("destinationCity", event.target.value)
            }
            required
            type="text"
            value={formValues.destinationCity}
          />
          <FieldError message={state.fieldErrors?.destinationCity?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Nama Barang
          <input
            className={inputClassName}
            name="itemName"
            onChange={(event) => handleFieldChange("itemName", event.target.value)}
            required
            type="text"
            value={formValues.itemName}
          />
          <FieldError message={state.fieldErrors?.itemName?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Jenis Barang
          <input
            className={inputClassName}
            name="itemType"
            onChange={(event) => handleFieldChange("itemType", event.target.value)}
            required
            type="text"
            value={formValues.itemType}
          />
          <FieldError message={state.fieldErrors?.itemType?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Berat Barang (Kg)
          <input
            className={inputClassName}
            min="0.01"
            name="itemWeightKg"
            onChange={(event) =>
              handleFieldChange("itemWeightKg", event.target.value)
            }
            required
            step="0.01"
            type="number"
            value={formValues.itemWeightKg}
          />
          <FieldError message={state.fieldErrors?.itemWeightKg?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Harga / Tarif
          <input
            className={inputClassName}
            min="0"
            name="shippingPrice"
            onChange={(event) =>
              handleFieldChange("shippingPrice", event.target.value)
            }
            required
            step="1000"
            type="number"
            value={formValues.shippingPrice}
          />
          <FieldError message={state.fieldErrors?.shippingPrice?.[0]} />
        </label>

        <label className="block text-sm text-slate-300">
          Jenis Pengiriman
          <select
            className={inputClassName}
            name="deliveryType"
            onChange={(event) =>
              handleFieldChange(
                "deliveryType",
                event.target.value as CargoAddFormValues["deliveryType"],
              )
            }
            value={formValues.deliveryType}
          >
            {deliveryTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-slate-300">
          Status Pengiriman
          <select
            className={inputClassName}
            name="shipmentStatus"
            onChange={(event) =>
              handleFieldChange(
                "shipmentStatus",
                event.target.value as CargoAddFormValues["shipmentStatus"],
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
        </label>

        <label className="block text-sm text-slate-300 md:col-span-2">
          Deskripsi
          <textarea
            className={`${inputClassName} min-h-28 resize-y rounded-2xl`}
            name="description"
            onChange={(event) =>
              handleFieldChange("description", event.target.value)
            }
            value={formValues.description}
          />
          <FieldError message={state.fieldErrors?.description?.[0]} />
        </label>
      </div>

      <div className="mt-6">
        <SubmitButton />
      </div>
    </form>
  );
}
