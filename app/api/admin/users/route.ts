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
            SELECT id, name, role, status, avatar, "key", job_title, assigned_vessel, work_shift, start_hour, end_hour
            FROM app_users
            ORDER BY role ASC, name ASC
          `
        : await sql`
            SELECT id, name, role, status, avatar, "key", job_title, assigned_vessel, work_shift, start_hour, end_hour
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
        key: String(row.key || ''),
        jobTitle: String(row.job_title || ''),
        assignedVessel: String(row.assigned_vessel || ''),
        workShift: String(row.work_shift || ''),
        startHour: row.start_hour || '',
        endHour: row.end_hour || '',
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

export async function POST(request: Request) {
  try {
    const session = await fetchCurrentSession();

    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json(
        { message: "Akses admin diperlukan." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id, name, key, role, status, avatar, jobTitle, assignedVessel, workShift, startHour, endHour } = body;

    if (!id || !name || !key) {
      return NextResponse.json(
        { message: "ID, name, dan access key harus diisi." },
        { status: 400 },
      );
    }

    await ensureUserSchema();
    const sql = getSql();

    // Check if user already exists
    const existing = await sql`SELECT id FROM app_users WHERE id = ${id}`;
    if (existing.length > 0) {
      return NextResponse.json(
        { message: `User dengan ID ${id} sudah ada.` },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO app_users (
        id, name, "key", role, status, avatar, 
        job_title, assigned_vessel, work_shift, start_hour, end_hour
      )
      VALUES (
        ${id}, ${name}, ${key}, ${role || 'STANDARD'}, ${status || 'Active'}, 
        ${avatar || name.charAt(0).toUpperCase()}, ${jobTitle}, ${assignedVessel}, 
        ${workShift || 'MORNING'}, ${startHour ? parseInt(startHour) : null}, 
        ${endHour ? parseInt(endHour) : null}
      )
    `;

    return NextResponse.json({
      message: "User berhasil ditambahkan.",
      user: { id, name, role: role || 'STANDARD', status: status || 'Active' }
    });
  } catch (error) {
    console.error("POST /api/admin/users error", error);
    return NextResponse.json(
      { message: "Gagal menambahkan user." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await fetchCurrentSession();

    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json(
        { message: "Akses admin diperlukan." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id, name, key, role, status, avatar, jobTitle, assignedVessel, workShift, startHour, endHour } = body;

    if (!id || !name) {
      return NextResponse.json(
        { message: "ID dan name harus diisi." },
        { status: 400 },
      );
    }

    await ensureUserSchema();
    const sql = getSql();

    // Update with or without key
    if (key) {
      await sql`
        UPDATE app_users 
        SET name = ${name}, "key" = ${key}, role = ${role}, status = ${status}, avatar = ${avatar}, 
            job_title = ${jobTitle}, assigned_vessel = ${assignedVessel}, work_shift = ${workShift}, 
            start_hour = ${startHour ? parseInt(startHour) : null}, end_hour = ${endHour ? parseInt(endHour) : null}, 
            updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE app_users 
        SET name = ${name}, role = ${role || 'STANDARD'}, status = ${status || 'Active'}, avatar = ${avatar || 'U'},
            assigned_vessel = ${assignedVessel}, work_shift = ${workShift}, 
            start_hour = ${startHour ? parseInt(startHour) : null}, 
            updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({
      message: "User berhasil diupdate.",
      user: { id, name, role, status }
    });
  } catch (error) {
    console.error("PUT /api/admin/users error", error);
    return NextResponse.json(
      { message: "Gagal mengupdate user." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await fetchCurrentSession();

    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json(
        { message: "Akses admin diperlukan." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID user harus diisi." },
        { status: 400 },
      );
    }

    await ensureUserSchema();
    const sql = getSql();

    await sql`DELETE FROM app_users WHERE id = ${id}`;

    return NextResponse.json({
      message: "User berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/users error", error);
    return NextResponse.json(
      { message: "Gagal menghapus user." },
      { status: 500 },
    );
  }
}
