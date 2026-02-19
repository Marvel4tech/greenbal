import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

async function ensureNotBanned(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", userId)
    .single()

  if (error) {
    const err = new Error(error.message || "Profile not found")
    err.status = 403
    throw err
  }

  if (data?.is_banned) {
    const err = new Error("You are banned. Contact support.")
    err.status = 403
    throw err
  }
}

// GET: return current user's predictions (optionally filtered by game ids)
export async function GET(request) {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ✅ Ban enforcement
  try {
    await ensureNotBanned(supabase, user.id)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  const url = new URL(request.url)
  const gameIdsParam = url.searchParams.get("game_ids")
  const gameIds = gameIdsParam ? gameIdsParam.split(",").filter(Boolean) : null

  let query = supabase
    .from("predictions")
    .select("id, game_id, prediction, created_at, points")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (gameIds && gameIds.length > 0) {
    query = query.in("game_id", gameIds)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

// POST: create a prediction for a game
export async function POST(request) {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ✅ Ban enforcement
  try {
    await ensureNotBanned(supabase, user.id)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { game_id, prediction } = body
  const allowed = new Set(["homeWin", "draw", "awayWin"])

  if (!game_id || !prediction || !allowed.has(prediction)) {
    return NextResponse.json(
      { error: "game_id and valid prediction are required (homeWin/draw/awayWin)" },
      { status: 400 }
    )
  }

  // 1) Check game exists and is still open
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, match_time, status")
    .eq("id", game_id)
    .single()

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  const matchTime = new Date(game.match_time)
  const now = new Date()

  if (game.status === "finished") {
    return NextResponse.json({ error: "Game already finished" }, { status: 400 })
  }
  if (now >= matchTime) {
    return NextResponse.json({ error: "Predictions are closed for this game" }, { status: 400 })
  }

  // 2) Insert prediction
  const { data: inserted, error: insertError } = await supabase
    .from("predictions")
    .insert([{ user_id: user.id, game_id, prediction }])
    .select("id, game_id, prediction, created_at")
    .single()

  if (insertError) {
    const msg = insertError.message?.toLowerCase?.() || ""
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json({ error: "You already predicted this game" }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Weekly bucket
  const { data: weekStart, error: weekErr } = await supabaseAdmin.rpc("week_start_tuesday", {
    ts: game.match_time,
  })
  if (weekErr) return NextResponse.json({ error: weekErr.message }, { status: 500 })

  // Weekly leaderboard: increment predictions count
  const { error: weeklyErr } = await supabaseAdmin.rpc("leaderboard_weekly_apply_delta", {
    p_user_id: user.id,
    p_week_start: weekStart,
    p_delta_points: 0,
    p_delta_correct: 0,
    p_delta_predictions: 1,
  })
  if (weeklyErr) return NextResponse.json({ error: weeklyErr.message }, { status: 500 })

  // Ensure leaderboard row exists
  const { error: lbUpsertErr } = await supabaseAdmin
    .from("leaderboard")
    .upsert([{ user_id: user.id }], { onConflict: "user_id" })

  if (lbUpsertErr) {
    return NextResponse.json({ error: lbUpsertErr.message }, { status: 500 })
  }

  // Increment predictions_total (all-time)
  const { data: lbRow, error: lbFetchErr } = await supabaseAdmin
    .from("leaderboard")
    .select("predictions_total")
    .eq("user_id", user.id)
    .single()

  if (lbFetchErr) {
    return NextResponse.json({ error: lbFetchErr.message }, { status: 500 })
  }

  const { error: lbUpdateErr } = await supabaseAdmin
    .from("leaderboard")
    .update({
      predictions_total: Number(lbRow?.predictions_total ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  if (lbUpdateErr) {
    return NextResponse.json({ error: lbUpdateErr.message }, { status: 500 })
  }

  return NextResponse.json(inserted, { status: 201 })
}
