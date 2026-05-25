import { NextResponse } from "next/server";
import { fetchCurrentSession } from "@/app/lib/auth";

export async function GET() {
  try {
    const user = await fetchCurrentSession();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/auth/session error", error);
    return NextResponse.json(
      { message: "Gagal membaca sesi login." },
      { status: 500 },
    );
  }
}
