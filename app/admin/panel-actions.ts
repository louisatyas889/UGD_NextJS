'use server';

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { type PanelActionState } from "@/app/admin/panel-action-state";
import {
  createSecurityLog,
  deleteFleetVessel,
  deletePersonnel,
  deleteSecurityLog,
  deleteSecurityUser,
  deleteTrackingPackage,
  upsertFleetVessel,
  upsertPersonnel,
  upsertSecurityUser,
  upsertTrackingPackage,
} from "@/app/lib/admin-panels";

function revalidateAdminPanels() {
  revalidatePath("/admin/user-management");
  revalidatePath("/admin/fleet-logistics");
  revalidatePath("/admin/security-accounts");
}

function formDataToObject(formData: FormData) {
  const payload: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    payload[key] = typeof value === "string" ? value : "";
  }
  return payload;
}

function zodErrorState(error: ZodError, fallbackMessage: string): PanelActionState {
  const flattened = error.flatten();
  return {
    success: false,
    message: error.issues[0]?.message ?? fallbackMessage,
    fieldErrors: flattened.fieldErrors,
  };
}

export async function savePersonnelAction(
  _prevState: PanelActionState,
  formData: FormData,
): Promise<PanelActionState> {
  try {
    await upsertPersonnel(formDataToObject(formData));
    revalidateAdminPanels();
    return {
      success: true,
      message: "Data crew berhasil disimpan ke database.",
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorState(error, "Validasi data crew gagal.");
    }
    console.error("savePersonnelAction error", error);
    return {
      success: false,
      message: "Gagal menyimpan data crew.",
      fieldErrors: {},
    };
  }
}

export async function saveFleetVesselAction(
  _prevState: PanelActionState,
  formData: FormData,
): Promise<PanelActionState> {
  try {
    await upsertFleetVessel(formDataToObject(formData));
    revalidateAdminPanels();
    return {
      success: true,
      message: "Data vessel berhasil disimpan ke database.",
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorState(error, "Validasi data vessel gagal.");
    }
    console.error("saveFleetVesselAction error", error);
    return {
      success: false,
      message: "Gagal menyimpan data vessel.",
      fieldErrors: {},
    };
  }
}

export async function saveTrackingPackageAction(
  _prevState: PanelActionState,
  formData: FormData,
): Promise<PanelActionState> {
  try {
    await upsertTrackingPackage(formDataToObject(formData));
    revalidateAdminPanels();
    return {
      success: true,
      message: "Data package berhasil disimpan ke database.",
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorState(error, "Validasi data package gagal.");
    }
    console.error("saveTrackingPackageAction error", error);
    return {
      success: false,
      message: "Gagal menyimpan data package.",
      fieldErrors: {},
    };
  }
}

export async function saveSecurityUserAction(
  _prevState: PanelActionState,
  formData: FormData,
): Promise<PanelActionState> {
  try {
    await upsertSecurityUser(formDataToObject(formData));
    revalidateAdminPanels();
    return {
      success: true,
      message: "Data account berhasil disimpan ke database.",
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorState(error, "Validasi account gagal.");
    }
    console.error("saveSecurityUserAction error", error);
    return {
      success: false,
      message: "Gagal menyimpan account.",
      fieldErrors: {},
    };
  }
}

export async function createSecurityLogAction(
  _prevState: PanelActionState,
  formData: FormData,
): Promise<PanelActionState> {
  try {
    await createSecurityLog(formDataToObject(formData));
    revalidateAdminPanels();
    return {
      success: true,
      message: "Security log berhasil ditambahkan.",
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorState(error, "Validasi security log gagal.");
    }
    console.error("createSecurityLogAction error", error);
    return {
      success: false,
      message: "Gagal menambahkan security log.",
      fieldErrors: {},
    };
  }
}

export async function deletePersonnelAction(id: string) {
  try {
    const deleted = await deletePersonnel(id);
    if (!deleted) {
      return { success: false, message: "Data crew tidak ditemukan." };
    }
    revalidateAdminPanels();
    return { success: true, message: "Data crew berhasil dihapus." };
  } catch (error) {
    console.error("deletePersonnelAction error", error);
    return { success: false, message: "Gagal menghapus data crew." };
  }
}

export async function deleteFleetVesselAction(id: string) {
  try {
    const deleted = await deleteFleetVessel(id);
    if (!deleted) {
      return { success: false, message: "Data vessel tidak ditemukan." };
    }
    revalidateAdminPanels();
    return { success: true, message: "Data vessel berhasil dihapus." };
  } catch (error) {
    console.error("deleteFleetVesselAction error", error);
    return { success: false, message: "Gagal menghapus data vessel." };
  }
}

export async function deleteTrackingPackageAction(id: string) {
  try {
    const deleted = await deleteTrackingPackage(id);
    if (!deleted) {
      return { success: false, message: "Data package tidak ditemukan." };
    }
    revalidateAdminPanels();
    return { success: true, message: "Data package berhasil dihapus." };
  } catch (error) {
    console.error("deleteTrackingPackageAction error", error);
    return { success: false, message: "Gagal menghapus data package." };
  }
}

export async function deleteSecurityUserAction(id: string) {
  try {
    const deleted = await deleteSecurityUser(id);
    if (!deleted) {
      return { success: false, message: "Data account tidak ditemukan." };
    }
    revalidateAdminPanels();
    return { success: true, message: "Data account berhasil dihapus." };
  } catch (error) {
    console.error("deleteSecurityUserAction error", error);
    return { success: false, message: "Gagal menghapus account." };
  }
}

export async function deleteSecurityLogAction(id: number) {
  try {
    const deleted = await deleteSecurityLog(id);
    if (!deleted) {
      return { success: false, message: "Security log tidak ditemukan." };
    }
    revalidateAdminPanels();
    return { success: true, message: "Security log berhasil dihapus." };
  } catch (error) {
    console.error("deleteSecurityLogAction error", error);
    return { success: false, message: "Gagal menghapus security log." };
  }
}
