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
  const note = body?.note?.trim() || null

  const { data: tx, error } = await supabase
    .from("wallet_transactions")
    .update({
      status: "available",
      note: note ? note : `Approved by admin ${user.id}`,
    })
    .eq("id", id)
    .eq("type", "weekly_top5_reward")
    .eq("status", "pending")
    .select()
    .single()

  if (error || !tx) {
    return NextResponse.json(
      { error: "Transaction not found or not pending" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Reward approved successfully",
    tx,
  })
}