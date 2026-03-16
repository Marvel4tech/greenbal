import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ enabled: false })
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)

  if (error) {
    return NextResponse.json({ enabled: false }, { status: 500 })
  }

  return NextResponse.json({
    enabled: !!data?.length,
  })
}