import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

async function ensureNotBanned(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", userId)
    .single()

  // If profile missing, treat as forbidden (your choice)
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

export async function GET() {
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

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, username, country, phone, gender, bank_name, bank_account, cover_url, avatar_url"
    )
    .eq("id", user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request) {
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
    if (allowed[k] === "") allowed[k] = null
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select(
      "id, email, full_name, username, country, phone, gender, bank_name, bank_account, cover_url, avatar_url"
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
