import { NextResponse } from "next/server";
import { ensureUserSchema, fetchCurrentSession, isAdminRole } from "@/app/lib/auth";
import { getSql } from "@/app/lib/db";

export async function GET(request: Request) {
  try {
    const session = await fetchCurrentSession();

    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json(
        { message: "Akses admin diperlukan." },
        { status: 401 },
      );
    }

    await ensureUserSchema();
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() ?? "";
    const keyword = `%${query}%`;

    const rows =
      query.length === 0
        ? await sql`
            SELECT id, name, role, status, avatar
            FROM app_users
            ORDER BY role ASC, name ASC
          `
        : await sql`
            SELECT id, name, role, status, avatar
            FROM app_users
            WHERE
              id ILIKE ${keyword} OR
              name ILIKE ${keyword} OR
              role ILIKE ${keyword} OR
              status ILIKE ${keyword}
            ORDER BY role ASC, name ASC
          `;

    const summaryRows = await sql`
      SELECT
        COUNT(*)::INT AS total_users,
        COUNT(*) FILTER (WHERE UPPER(role) = 'STANDARD')::INT AS standard_users,
        COUNT(*) FILTER (WHERE UPPER(role) <> 'STANDARD')::INT AS admin_users,
        COUNT(*) FILTER (WHERE LOWER(status) = 'active')::INT AS active_users
      FROM app_users
    `;

    return NextResponse.json({
      records: rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        role: String(row.role),
        status: String(row.status),
        avatar: String(row.avatar),
      })),
      summary: {
        totalUsers: Number(summaryRows[0]?.total_users ?? 0),
        standardUsers: Number(summaryRows[0]?.standard_users ?? 0),
        adminUsers: Number(summaryRows[0]?.admin_users ?? 0),
        activeUsers: Number(summaryRows[0]?.active_users ?? 0),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users error", error);
    return NextResponse.json(
      { message: "Gagal mengambil data user dari database." },
      { status: 500 },
    );
  }
}
