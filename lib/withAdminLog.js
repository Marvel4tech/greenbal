import { createServerClientWrapper } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

export async function withAdminLog(request, handler, options = {}) {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, email, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    throw new Error("Forbidden")
  }

  const result = await handler({ supabase, admin: profile })

  try {
    await supabaseAdmin.from("system_logs").insert({
      user_id: profile.id,
      email: profile.email,
      username: profile.username,
      role: "admin",
      action: options.action || "admin_action",
      message:
        typeof options.message === "function"
          ? options.message(profile)
          : options.message || "Admin performed an action",
      path: options.path || request.nextUrl?.pathname || "",
      metadata: options.metadata || {},
    })
  } catch (e) {
    console.error("Logging failed:", e.message)
  }

  return result
}