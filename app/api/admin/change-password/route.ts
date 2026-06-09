import { NextRequest, NextResponse } from "next/server";
import { changeUserPassword, requireAdminSession } from "@/app/lib/auth";

/**
 * Endpoint untuk admin mengganti password (key) user manapun.
 * Hanya bisa diakses oleh user dengan role ADMIN.
 * Body JSON: { targetUserId: string, newKey: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Pastikan yang request adalah admin
    const session = await requireAdminSession();

    const body = (await request.json()) as {
      targetUserId?: string;
      newKey?: string;
    };

    const targetUserId = body.targetUserId?.trim() ?? "";
    const newKey = body.newKey?.trim() ?? "";

    if (!targetUserId || !newKey) {
      return NextResponse.json(
        { success: false, error: "Target user dan key baru wajib diisi." },
        { status: 400 },
      );
    }

    if (newKey.length < 2) {
      return NextResponse.json(
        { success: false, error: "Password minimal 2 karakter." },
        { status: 400 },
      );
    }

    const result = await changeUserPassword(targetUserId, newKey);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 },
      );
    }

    console.log(`[change-password] Admin ${session.id} mengubah password user ${targetUserId}`);

    return NextResponse.json({
      success: true,
      message: `Password untuk ${result.name} (${targetUserId}) berhasil diubah.`,
    });
  } catch (error: any) {
    console.error("[/api/admin/change-password] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
