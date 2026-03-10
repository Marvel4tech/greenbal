import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/requireAdmin"

export async function PATCH(req, context) {
  const { id } = await context.params

  const admin = await requireAdmin()

  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status }
    )
  }

  const { supabase, user } = admin
  const body = await req.json().catch(() => ({}))
  const note = body?.note?.trim()

  if (!note) {
    return NextResponse.json(
      { error: "Void reason is required" },
      { status: 400 }
    )
  }

  const finalNote = `Voided by admin ${user.id}: ${note}`

  const { data: tx, error } = await supabase
    .from("wallet_transactions")
    .update({
      status: "voided",
      note: finalNote,
    })
    .eq("id", id)
    .eq("type", "weekly_top5_reward")
    .in("status", ["pending", "available"])
    .select()
    .single()

  if (error || !tx) {
    return NextResponse.json(
      { error: "Only pending or available rewards can be voided" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Reward voided successfully",
    tx,
  })
}