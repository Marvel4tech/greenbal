import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerClientWrapper()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, username, country, phone, gender, bank_name, bank_account, cover_url, avatar_url")
    .eq("id", user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request) {
  const supabase = await createServerClientWrapper()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  // Allow only these fields to be updated
  const allowed = (({
    full_name,
    username,
    country,
    phone,
    gender,
    bank_name,
    bank_account,
    cover_url,
    avatar_url,
  }) => ({
    full_name,
    username,
    country,
    phone,
    gender,
    bank_name,
    bank_account,
    cover_url,
    avatar_url,
  }))(body)

  // Optional: basic cleanup (trim strings)
  for (const k of Object.keys(allowed)) {
    if (typeof allowed[k] === "string") allowed[k] = allowed[k].trim()
    if (allowed[k] === "") allowed[k] = null // keep DB clean
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id, email, full_name, username, country, phone, gender, bank_name, bank_account, cover_url, avatar_url")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
