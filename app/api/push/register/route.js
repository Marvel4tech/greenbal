import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function POST(req) {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const body = await req.json().catch(() => ({}))
  const token = body?.token?.trim()

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user?.id ?? null,
        fcm_token: token,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fcm_token" }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}