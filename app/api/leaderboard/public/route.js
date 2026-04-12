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

      if (weekErr) {
        return NextResponse.json({ error: weekErr.message }, { status: 500 })
      }

      weekStart = data
    }

    // 1) Top 50 excluding deleted users
    const { data: top, error: topErr } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select(
        `
        user_id,
        week_start,
        points_total,
        correct_total,
        predictions_total,
        updated_at,
        profiles!inner (
          username,
          is_deleted
        )
        `
      )
      .eq("week_start", weekStart)
      .eq("profiles.is_deleted", false)
      .order("points_total", { ascending: false })
      .order("correct_total", { ascending: false })
      .order("predictions_total", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(50)

    if (topErr) {
      return NextResponse.json({ error: topErr.message }, { status: 500 })
    }

    const rows = (top || []).map((r, i) => ({
      rank: i + 1,
      id: r.user_id,
      week_start: r.week_start,
      name: r.profiles?.username || "Unknown",
      points: Number(r.points_total ?? 0),
      gamesPlayed: Number(r.predictions_total ?? 0),
      correct_total: Number(r.correct_total ?? 0),
      predictions_total: Number(r.predictions_total ?? 0),
      duration: "—",
    }))

    // If no userId provided, just return rows
    if (!userId) {
      return NextResponse.json({
        week_start: weekStart,
        rows,
        me: null,
      })
    }

    // 2) Fetch current user's weekly row only if user is not deleted
    const { data: myRow, error: myErr } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select(
        `
        user_id,
        week_start,
        points_total,
        correct_total,
        predictions_total,
        updated_at,
        profiles!inner (
          username,
          is_deleted
        )
        `
      )
      .eq("week_start", weekStart)
      .eq("user_id", userId)
      .eq("profiles.is_deleted", false)
      .maybeSingle()

    if (myErr) {
      return NextResponse.json({ error: myErr.message }, { status: 500 })
    }

    if (!myRow) {
      return NextResponse.json({
        week_start: weekStart,
        rows,
        me: null,
      })
    }

    // 3) Compute user's rank excluding deleted users
    const { data: allRanks, error: rankErr } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select(
        `
        user_id,
        points_total,
        correct_total,
        predictions_total,
        updated_at,
        profiles!inner (
          is_deleted
        )
        `
      )
      .eq("week_start", weekStart)
      .eq("profiles.is_deleted", false)
      .order("points_total", { ascending: false })
      .order("correct_total", { ascending: false })
      .order("predictions_total", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(5000)

    if (rankErr) {
      return NextResponse.json({ error: rankErr.message }, { status: 500 })
    }

    const myIndex = (allRanks || []).findIndex((r) => r.user_id === userId)

    const me = {
      id: myRow.user_id,
      name: myRow.profiles?.username || "You",
      points: Number(myRow.points_total ?? 0),
      gamesPlayed: Number(myRow.predictions_total ?? 0),
      correct_total: Number(myRow.correct_total ?? 0),
      predictions_total: Number(myRow.predictions_total ?? 0),
      rank: myIndex >= 0 ? myIndex + 1 : null,
    }

    return NextResponse.json({
      week_start: weekStart,
      rows,
      me,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}