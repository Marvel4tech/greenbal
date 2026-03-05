import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function POST(req) {
  const supabase = await createServerClientWrapper()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // verify admin
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const formData = await req.formData()
  const txId = formData.get("txId")
  const receipt = formData.get("receipt")

  if (!txId || !receipt) {
    return NextResponse.json(
      { error: "Missing transaction or receipt" },
      { status: 400 }
    )
  }

  // get transaction
  const { data: tx, error: txError } = await supabase
    .from("wallet_transactions")
    .select("id, user_id, week_end, status")
    .eq("id", txId)
    .single()

  if (txError || !tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  if (tx.status === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 })
  }

  // create file path
  const ext = receipt.name?.split(".").pop() || "pdf"
  const receiptPath = `${tx.week_end}/${tx.user_id}/${tx.id}.${ext}`

  // upload to storage
  const bytes = await receipt.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(receiptPath, bytes, {
      upsert: true,
      contentType: receipt.type || "application/octet-stream",
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // mark transaction as paid (NO join here)
  const { data: updated, error: updateError } = await supabase
    .from("wallet_transactions")
    .update({
      status: "paid",
      receipt_path: receiptPath,
      paid_at: new Date().toISOString(),
      paid_by: user.id,
    })
    .eq("id", tx.id)
    .select(
      "id, user_id, week_start, week_end, amount_gbp, status, receipt_path, paid_at, created_at, type"
    )
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Update failed" }, { status: 500 })
  }

  // fetch username separately (reliable)
  const { data: uProfile, error: uErr } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", updated.user_id)
    .single()

  if (uErr) {
    // still return tx if username lookup fails (don’t block payout)
    return NextResponse.json({
      tx: { ...updated, profiles: { username: null } },
      warning: uErr.message,
    })
  }

  return NextResponse.json({
    tx: { ...updated, profiles: { username: uProfile?.username || null } },
  })
}