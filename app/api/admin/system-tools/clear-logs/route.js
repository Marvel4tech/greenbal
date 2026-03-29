import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

export async function POST() {
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
      .select("role, email, username")
      .eq("id", user.id)
      .single()

    if (adminError || adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error: clearError } = await supabaseAdmin
      .from("system_logs")
      .delete()
      .neq("id", 0)

    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 })
    }

    // Recreate a log entry showing who cleared the logs
    await supabaseAdmin.from("system_logs").insert({
      user_id: user.id,
      email: adminProfile.email || null,
      username: adminProfile.username || null,
      role: adminProfile.role || null,
      action: "logs_cleared",
      message: `${adminProfile.username || adminProfile.email || user.id} cleared system logs`,
      path: "/dashboard/tools",
      metadata: {},
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to clear logs" },
      { status: 500 }
    )
  }
}