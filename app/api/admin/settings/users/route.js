import { NextResponse } from "next/server";
import { createServerClientWrapper } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

async function requireAdmin() {
  const supabase = await createServerClientWrapper();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, username, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Forbidden");
  }

  return profile;
}

export async function GET(request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const role = String(url.searchParams.get("role") || "user").trim();
    const q = String(url.searchParams.get("q") || "").trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);

    let countQuery = supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });

    let dataQuery = supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, email, role, created_at, is_banned, is_deleted")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (role === "admin") {
      countQuery = countQuery.eq("role", "admin");
      dataQuery = dataQuery.eq("role", "admin");
    } else if (role === "user") {
      countQuery = countQuery.neq("role", "admin");
      dataQuery = dataQuery.neq("role", "admin");
    }

    if (q) {
      const safeQ = q.replace(/[%_,]/g, "");
      const searchClause = `full_name.ilike.%${safeQ}%,username.ilike.%${safeQ}%,email.ilike.%${safeQ}%`;
      countQuery = countQuery.or(searchClause);
      dataQuery = dataQuery.or(searchClause);
    }

    const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (dataError) {
      return NextResponse.json({ error: dataError.message }, { status: 500 });
    }

    return NextResponse.json({
      users: data || [],
      total: count || 0,
      limit,
    });
  } catch (error) {
    const status =
      error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;

    return NextResponse.json({ error: error.message }, { status });
  }
}