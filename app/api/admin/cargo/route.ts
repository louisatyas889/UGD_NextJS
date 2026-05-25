import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createAdminCargoRecord,
  fetchAdminCargoRecords,
  fetchAdminCargoSummary,
} from "@/app/lib/admin-cargo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? "";

    const [records, summary] = await Promise.all([
      fetchAdminCargoRecords(query),
      fetchAdminCargoSummary(),
    ]);

    return NextResponse.json({ records, summary });
  } catch (error) {
    console.error("GET /api/admin/cargo error", error);
    return NextResponse.json(
      { message: "Gagal mengambil data cargo dari database." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const record = await createAdminCargoRecord(payload);

    return NextResponse.json(
      {
        message: "Data cargo berhasil ditambahkan ke database.",
        record,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/cargo error", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: error.issues[0]?.message ?? "Validasi form gagal.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Gagal menyimpan data cargo." },
      { status: 500 },
    );
  }
}
