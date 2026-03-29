import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

export async function GET() {
  try {
    const supabase = await createServerClientWrapper()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (adminError || adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const onlineThresholdIso = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const [
      totalUsersRes,
      onlineUsersRes,
      onlineAdminsRes,
      totalLogsRes,
      recentLogsRes,
      recentUsersRes,
      recentAdminsRes,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("profiles")
        .select(
          "id, username, email, role, is_banned, is_deleted, last_seen_at, last_sign_in_at, last_activity_at, last_path"
        )
        .gte("last_seen_at", onlineThresholdIso)
        .order("last_seen_at", { ascending: false })
        .limit(25),

      supabaseAdmin
        .from("profiles")
        .select(
          "id, username, email, role, is_banned, is_deleted, last_seen_at, last_sign_in_at, last_activity_at, last_path"
        )
        .eq("role", "admin")
        .gte("last_seen_at", onlineThresholdIso)
        .order("last_seen_at", { ascending: false })
        .limit(25),

      supabaseAdmin.from("system_logs").select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from("system_logs")
        .select("id, user_id, email, username, role, action, message, path, created_at")
        .order("created_at", { ascending: false })
        .limit(50),

      supabaseAdmin
        .from("profiles")
        .select(
          "id, username, email, role, is_banned, is_deleted, last_seen_at, last_sign_in_at, last_activity_at, last_path"
        )
        .order("last_seen_at", { ascending: false, nullsFirst: false })
        .limit(20),

      supabaseAdmin
        .from("profiles")
        .select(
          "id, username, email, role, is_banned, is_deleted, last_seen_at, last_sign_in_at, last_activity_at, last_path"
        )
        .eq("role", "admin")
        .order("last_seen_at", { ascending: false, nullsFirst: false })
        .limit(20),
    ])

    return NextResponse.json({
      status: {
        database: "Connected",
        lastBackup: null,
        logsStored: totalLogsRes.count || 0,
      },
      counts: {
        totalUsers: totalUsersRes.count || 0,
        onlineUsers: onlineUsersRes.data?.length || 0,
        onlineAdmins: onlineAdminsRes.data?.length || 0,
      },
      onlineUsers: onlineUsersRes.data || [],
      onlineAdmins: onlineAdminsRes.data || [],
      recentUsers: recentUsersRes.data || [],
      recentAdmins: recentAdminsRes.data || [],
      logs: recentLogsRes.data || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to load system tools data" },
      { status: 500 }
    )
  }
}