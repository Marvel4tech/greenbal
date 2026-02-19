import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

// GET: user details + totals + recent predictions + WEEKLY rank
export async function GET(request, context) {
  try {
    const params = await context.params
    const id = params.id

    const url = new URL(request.url)
    const recent = Math.min(Number(url.searchParams.get("recent") || 10), 50)

    // 1) Profile (include is_banned)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, email, country, role, is_banned, created_at")
      .eq("id", id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr?.message || "User not found" }, { status: 404 })
    }

    // 2) All-time totals (leaderboard table)
    const { data: lb } = await supabaseAdmin
      .from("leaderboard")
      .select("points_total, correct_total, predictions_total")
      .eq("user_id", id)
      .maybeSingle()

    // 3) All-time rank (optional, kept from your code)
    let rank = null
    const { data: allLb, error: rankErr } = await supabaseAdmin
      .from("leaderboard")
      .select("user_id, points_total")
      .order("points_total", { ascending: false })
      .limit(5000)

    if (!rankErr && Array.isArray(allLb)) {
      const idx = allLb.findIndex((r) => r.user_id === id)
      rank = idx >= 0 ? idx + 1 : null
    }

    // ✅ 4) Weekly rank (THIS is what you want)
    // Get current week_start (Tue → Mon) using your RPC
    const { data: weekStart, error: weekErr } = await supabaseAdmin.rpc("week_start_tuesday", {
      ts: new Date().toISOString(),
    })

    if (weekErr) {
      return NextResponse.json({ error: weekErr.message }, { status: 500 })
    }

    let weekly_rank = null

    // Pull a reasonable chunk and find index
    const { data: weeklyRows, error: weeklyErr } = await supabaseAdmin
      .from("leaderboard_weekly")
      .select("user_id, points_total, correct_total, predictions_total")
      .eq("week_start", weekStart)
      .order("points_total", { ascending: false })
      .order("correct_total", { ascending: false })
      .order("predictions_total", { ascending: false })
      .limit(5000)

    if (!weeklyErr && Array.isArray(weeklyRows)) {
      const idx = weeklyRows.findIndex((r) => r.user_id === id)
      weekly_rank = idx >= 0 ? idx + 1 : null
    }

    // 5) Recent predictions
    const { data: preds, error: predsErr } = await supabaseAdmin
      .from("predictions")
      .select(
        `
        id,
        prediction,
        points,
        created_at,
        games:game_id (
          id,
          home_team,
          away_team,
          match_time,
          status,
          result
        )
      `
      )
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(recent)

    if (predsErr) {
      return NextResponse.json({ error: predsErr.message }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        ...profile,
        joined: profile.created_at,
        totalPoints: Number(lb?.points_total ?? 0),
        totalCorrect: Number(lb?.correct_total ?? 0),
        totalPredictions: Number(lb?.predictions_total ?? 0),
        rank, // all-time rank (optional)
      },
      weekly_rank, // ✅ weekly leaderboard position
      week_start: weekStart, // optional but nice for debugging/UI
      recentPredictions: preds || [],
    })
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Failed to load user" },
      { status: 500 }
    )
  }
}

// PATCH: ban/unban (set profiles.is_banned)
export async function PATCH(request, context) {
  try {
    const params = await context.params
    const id = params.id

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const is_banned = body?.is_banned
    if (typeof is_banned !== "boolean") {
      return NextResponse.json(
        { error: "is_banned must be a boolean" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ is_banned })
      .eq("id", id)
      .select("id, is_banned")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Failed to update ban status" },
      { status: 500 }
    )
  }
}

// DELETE: delete profile row (cascade handles related tables if FK ON DELETE CASCADE)
export async function DELETE(request, context) {
  try {
    const params = await context.params
    const id = params.id

    const { error } = await supabaseAdmin.from("profiles").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Failed to delete user" },
      { status: 500 }
    )
  }
}
