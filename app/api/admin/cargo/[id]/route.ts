import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  deleteAdminCargoRecord,
  fetchAdminCargoRecordById,
  updateAdminCargoRecord,
} from "@/app/lib/admin-cargo";

export const dynamic = "force-dynamic";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json({ error: "ID cargo tidak valid." }, { status: 400 });
    }

    const record = await fetchAdminCargoRecordById(id);

    if (!record) {
      return NextResponse.json(
        { error: "Data cargo tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("GET /api/admin/cargo/[id] error", error);
    return NextResponse.json(
      { error: "Gagal mengambil detail cargo." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json({ error: "ID cargo tidak valid." }, { status: 400 });
    }

    // Ambil payload mentah dari frontend
    const payload = await request.json();
    
    // Teruskan ke admin-cargo.ts yang sudah kita lengkapi pelindungnya
    const record = await updateAdminCargoRecord(id, payload);

    if (!record) {
      return NextResponse.json(
        { error: "Data cargo tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json(record);

  } catch (error: any) {
    console.error("PUT /api/admin/cargo/[id] error", error);

    // 1. Tangkap jika error masih berupa bawaan murni ZodError
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Validasi form gagal.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    // 2. Tangkap custom error dari throw new Error(...) yang kita buat di admin-cargo.ts
    // Ini memastikan pesan spesifik (seperti "Berat barang harus lebih dari 0") sampai ke frontend
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Fallback jika database putus
    return NextResponse.json(
      { error: "Gagal memperbarui data cargo." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json({ error: "ID cargo tidak valid." }, { status: 400 });
    }

    const deleted = await deleteAdminCargoRecord(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Data cargo tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Data cargo berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/admin/cargo/[id] error", error);
    return NextResponse.json(
      { error: "Gagal menghapus data cargo." },
      { status: 500 },
    );
  }
}
