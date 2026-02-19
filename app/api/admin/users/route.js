import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

export async function GET(request) {
  try {
    const url = new URL(request.url)

    const q = (url.searchParams.get("q") || "").trim()
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200)
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0)

    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, email, country, role, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%`
      )
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      users: data || [],
      count: count ?? 0,
      limit,
      offset,
      q,
      hasMore: offset + (data?.length || 0) < (count ?? 0),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Failed to load users" },
      { status: 500 }
    )
  }
}
