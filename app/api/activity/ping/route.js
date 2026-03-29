import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  )
}

export async function POST(request) {
  try {
    const supabase = await createServerClientWrapper()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const action = String(body?.action || "heartbeat").trim()
    const path = String(body?.path || "").trim() || null
    const nowIso = new Date().toISOString()
    const ip = getClientIp(request)
    const userAgent = request.headers.get("user-agent") || null

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, username, role, last_seen_at")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at).getTime() : null
    const nowMs = Date.now()

    // Treat as a new session if last seen was more than 30 minutes ago
    const isNewSession =
      !lastSeen || Number.isNaN(lastSeen) || nowMs - lastSeen > 30 * 60 * 1000

    const updatePayload = {
      last_seen_at: nowIso,
      last_activity_at: nowIso,
      last_path: path,
      last_ip: ip,
      last_user_agent: userAgent,
    }

    if (isNewSession) {
      updatePayload.last_sign_in_at = nowIso
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const logsToInsert = []

    if (isNewSession) {
      logsToInsert.push({
        user_id: user.id,
        email: profile.email || null,
        username: profile.username || null,
        role: profile.role || null,
        action: "signed_in",
        message: `${profile.username || profile.email || user.id} came online`,
        path,
        metadata: {
          ip,
          userAgent,
        },
      })
    }

    if (action === "route_open" && path) {
      logsToInsert.push({
        user_id: user.id,
        email: profile.email || null,
        username: profile.username || null,
        role: profile.role || null,
        action: "route_open",
        message: `${profile.username || profile.email || user.id} opened ${path}`,
        path,
        metadata: {
          ip,
          userAgent,
        },
      })
    }

    if (action === "manual_task" && body?.message) {
      logsToInsert.push({
        user_id: user.id,
        email: profile.email || null,
        username: profile.username || null,
        role: profile.role || null,
        action: "manual_task",
        message: String(body.message),
        path,
        metadata: {
          ip,
          userAgent,
          extra: body?.metadata || {},
        },
      })
    }

    if (logsToInsert.length) {
      const { error: logError } = await supabaseAdmin
        .from("system_logs")
        .insert(logsToInsert)

      if (logError) {
        return NextResponse.json({ error: logError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    )
  }
}