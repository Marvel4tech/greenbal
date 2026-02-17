import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const url = new URL(request.url)

    const userId = url.searchParams.get("user_id") || null
    let weekStart = url.searchParams.get("week_start") || null

    // Default: current week (Tue -> Mon) in UTC
    if (!weekStart) {
      const { data, error: weekErr } = await supabaseAdmin.rpc("week_start_tuesday", {
        ts: new Date().toISOString(),
      })
      if (weekErr) return NextResponse.json({ error: weekErr.message }, { status: 500 })
      weekStart = data
    }

    // 1) Top 50
    const { data: top, error: topErr } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select(
        `
          user_id,
          week_start,
          points_total,
          updated_at,
          profiles:profiles ( username )
        `
      )
      .eq("week_start", weekStart)
      .order("points_total", { ascending: false })
      .order("updated_at", { ascending: true }) // tie-breaker
      .limit(50)

    if (topErr) return NextResponse.json({ error: topErr.message }, { status: 500 })

    const rows = (top || []).map((r, i) => ({
      rank: i + 1,
      id: r.user_id,
      week_start: r.week_start,
      name: r.profiles?.username || "Unknown",
      points: r.points_total ?? 0,
      duration: "—",
    }))

    // If no userId provided, just return rows
    if (!userId) {
      return NextResponse.json({ week_start: weekStart, rows, me: null })
    }

    // 2) Fetch my weekly row
    const { data: myRow, error: myErr } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select(
        `
        user_id,
        points_total,
        updated_at,
        profiles:profiles ( username )
      `
      )
      .eq("week_start", weekStart)
      .eq("user_id", userId)
      .maybeSingle()

    if (myErr) return NextResponse.json({ error: myErr.message }, { status: 500 })
    if (!myRow) return NextResponse.json({ week_start: weekStart, rows, me: null })

    const myPoints = myRow.points_total ?? 0

    // 3) Compute "my rank" even if not in top 50
    const { count: higherCount, error: countErr } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select("user_id", { count: "exact", head: true })
      .eq("week_start", weekStart)
      .gt("points_total", myPoints)

    if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 })

    const me = {
      id: myRow.user_id,
      name: myRow.profiles?.username || "You",
      points: myPoints,
      rank: (higherCount ?? 0) + 1,
    }

    return NextResponse.json({ week_start: weekStart, rows, me })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

