'use server';

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { type CargoActionState } from "@/app/admin/action-state";
import {
  createAdminCargoRecord,
  deleteAdminCargoRecord,
  updateAdminCargoRecord,
} from "@/app/lib/admin-cargo";

const createFieldNames = [
  "shippingDate",
  "senderName",
  "recipientName",
  "phone",
  "originCity",
  "destinationCity",
  "itemName",
  "itemType",
  "itemWeightKg",
  "shippingPrice",
  "deliveryType",
  "shipmentStatus",
  "description",
] as const;

const updateFieldNames = [
  "id",
  "shipmentStatus",
  "shippingPrice",
  "description",
] as const;

function pickFormValues(
  formData: FormData,
  fields: readonly string[],
): Record<string, string> {
  const payload: Record<string, string> = {};

  for (const field of fields) {
    const value = formData.get(field);
    payload[field] = typeof value === "string" ? value : "";
  }

  return payload;
}

function revalidateAdminPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/cargo-management");
}

export async function createCargoAction(
  _prevState: CargoActionState,
  formData: FormData,
): Promise<CargoActionState> {
  try {
    const payload = pickFormValues(formData, createFieldNames);
    await createAdminCargoRecord(payload);
    revalidateAdminPages();

    return {
      success: true,
      message: "Data cargo berhasil ditambahkan ke database Neon.",
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const flattened = error.flatten();
      return {
        success: false,
        message: error.issues[0]?.message ?? "Validasi form cargo gagal.",
        fieldErrors: flattened.fieldErrors,
      };
    }

    console.error("createCargoAction error", error);
    return {
      success: false,
      message: "Gagal menambahkan data cargo. Silakan coba lagi.",
      fieldErrors: {},
    };
  }
}

export async function updateCargoAction(
  _prevState: CargoActionState,
  formData: FormData,
): Promise<CargoActionState> {
  try {
    const payload = pickFormValues(formData, updateFieldNames);
    const id = Number(payload.id);

    if (!Number.isInteger(id) || id <= 0) {
      return {
        success: false,
        message: "ID cargo tidak valid.",
        fieldErrors: {},
      };
    }

    const updated = await updateAdminCargoRecord(id, payload);

    if (!updated) {
      return {
        success: false,
        message: "Data cargo tidak ditemukan.",
        fieldErrors: {},
      };
    }

    revalidateAdminPages();
    return {
      success: true,
      message: "Status dan harga cargo berhasil diperbarui.",
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const flattened = error.flatten();
      return {
        success: false,
        message: error.issues[0]?.message ?? "Validasi update cargo gagal.",
        fieldErrors: flattened.fieldErrors,
      };
    }

    console.error("updateCargoAction error", error);
    return {
      success: false,
      message: "Gagal memperbarui data cargo. Silakan coba lagi.",
      fieldErrors: {},
    };
  }
}

export async function deleteCargoAction(id: number) {
  try {
    if (!Number.isInteger(id) || id <= 0) {
      return {
        success: false,
        message: "ID cargo tidak valid.",
      };
    }

    const deleted = await deleteAdminCargoRecord(id);

    if (!deleted) {
      return {
        success: false,
        message: "Data cargo tidak ditemukan.",
      };
    }

    revalidateAdminPages();
    return {
      success: true,
      message: "Data cargo berhasil dihapus dari database Neon.",
    };
  } catch (error) {
    console.error("deleteCargoAction error", error);
    return {
      success: false,
      message: "Gagal menghapus data cargo. Silakan coba lagi.",
    };
  }
}
