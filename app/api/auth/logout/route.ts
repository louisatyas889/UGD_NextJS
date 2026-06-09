import { NextResponse } from "next/server";
import { buildClearedSessionCookie, fetchCurrentSession, recordLogout } from "@/app/lib/auth";

export async function POST() {
  // Catat logout event SEBELUM hapus cookie, agar kita tahu user mana yang logout
  const session = await fetchCurrentSession();
  if (session?.id) {
    await recordLogout(session.id);
  }

  const response = NextResponse.json({ message: "Sesi berhasil ditutup." });
  const sessionCookie = buildClearedSessionCookie();

  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options,
  );

  return response;
}
