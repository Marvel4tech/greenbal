import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

function buildArchivedEmail(userId) {
  const cleanId = String(userId).replace(/-/g, "")
  return `deleted_${cleanId}@deleted.local`
}

// GET: user details + totals + recent predictions + WEEKLY rank
export async function GET(request, context) {
  try {
    const params = await context.params
    const id = params.id

    const url = new URL(request.url)
    const recent = Math.min(Number(url.searchParams.get("recent") || 10), 50)

    // 1) Profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        full_name,
        username,
        email,
        archived_email,
        country,
        role,
        bank_name,
        bank_account,
        is_banned,
        is_deleted,
        deleted_at,
        created_at
        `
      )
      .eq("id", id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: profileErr?.message || "User not found" },
        { status: 404 }
      )
    }

    // 2) All-time totals
    const { data: lb } = await supabaseAdmin
      .from("leaderboard")
      .select("points_total, correct_total, predictions_total")
      .eq("user_id", id)
      .maybeSingle()

    // 3) All-time rank
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

    // 4) Weekly rank
    const { data: weekStart, error: weekErr } = await supabaseAdmin.rpc(
      "week_start_tuesday",
      {
        ts: new Date().toISOString(),
      }
    )

    if (weekErr) {
      return NextResponse.json({ error: weekErr.message }, { status: 500 })
    }

    let weekly_rank = null

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
        rank,
      },
      weekly_rank,
      week_start: weekStart,
      recentPredictions: preds || [],
    })
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Failed to load user" },
      { status: 500 }
    )
  }
}

// PATCH: ban/unban
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

    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_deleted")
      .eq("id", id)
      .single()

    if (existingUserError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (existingUser.is_deleted) {
      return NextResponse.json(
        { error: "Deleted users cannot be unbanned or modified here" },
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

// DELETE: archive profile + replace auth email so original email can be reused
export async function DELETE(request, context) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 })
    }

    const url = new URL(request.url)
    const reason = (url.searchParams.get("reason") || "Deleted by admin").trim()

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, username, is_deleted")
      .eq("id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (profile.is_deleted) {
      return NextResponse.json(
        { error: "User already deleted" },
        { status: 400 }
      )
    }

    const archivedEmail = buildArchivedEmail(id)

    // 1) Archive profile row
    const { data: archivedProfile, error: archiveError } =
      await supabaseAdmin.rpc("archive_profile", {
        p_user_id: id,
        p_deleted_by: null,
        p_reason: reason,
      })

    if (archiveError) {
      return NextResponse.json(
        { error: archiveError.message },
        { status: 500 }
      )
    }

    // 2) Change auth email so original email becomes reusable
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(id, {
        email: archivedEmail,
        email_confirm: true,
        user_metadata: {
          archived: true,
          archived_at: new Date().toISOString(),
          original_email: profile.email || null,
        },
      })

    if (authUpdateError) {
      return NextResponse.json(
        {
          error: `Profile archived, but auth email update failed: ${authUpdateError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: archivedProfile,
      archivedEmail,
      message: "User deleted successfully",
    })
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Failed to delete user" },
      { status: 500 }
    )
  }
}