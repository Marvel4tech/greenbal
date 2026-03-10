import { createServerClientWrapper } from "@/lib/supabase/server"

export async function requireAdmin() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      error: "Not authenticated",
      supabase,
      user: null,
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, username")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
      supabase,
      user,
    }
  }

  return {
    ok: true,
    supabase,
    user,
    profile,
  }
}