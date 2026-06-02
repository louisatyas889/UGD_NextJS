import { NextResponse } from "next/server";
import { authenticateUser, buildSessionCookie } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      id?: string;
      key?: string;
    };

    const operatorId = payload.id?.trim() ?? "";
    const accessKey = payload.key?.trim() ?? "";

    if (!operatorId || !accessKey) {
      return NextResponse.json(
        {
          message:
            "Form login tidak lengkap. User ID dan access key wajib diisi.",
        },
        { status: 400 },
      );
    }

    const session = await authenticateUser(operatorId, accessKey);

    if (!session) {
      return NextResponse.json(
        {
          message:
            "User ID atau access key tidak valid. Periksa kembali akun Admin/User Anda.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      message: "Autentikasi berhasil.",
      user: session,
    });
    const sessionCookie = buildSessionCookie(session);

    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options,
    );

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error", error);
    return NextResponse.json(
      { message: "Gagal memproses login." },
      { status: 500 },
    );
  }
}

