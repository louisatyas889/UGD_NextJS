import { NextResponse } from "next/server";
import { buildClearedSessionCookie } from "@/app/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Sesi berhasil ditutup." });
  const sessionCookie = buildClearedSessionCookie();

  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options,
  );

  return response;
}

