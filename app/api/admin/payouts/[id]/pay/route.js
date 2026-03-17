import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/requireAdmin"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

export async function PATCH(req, context) {
  const { id } = await context.params

  const admin = await requireAdmin()

  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status }
    )
  }

  const { user } = admin

  const formData = await req.formData()
  const receipt = formData.get("receipt")
  const note = String(formData.get("note") || "").trim()

  if (!receipt || typeof receipt === "string") {
    return NextResponse.json(
      { error: "Receipt file is required" },
      { status: 400 }
    )
  }

  const { data: existingTx, error: findError } = await supabaseAdmin
    .from("wallet_transactions")
    .select("id, user_id, status, week_start, week_end, type")
    .eq("id", id)
    .eq("type", "weekly_top5_reward")
    .single()

  if (findError || !existingTx) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    )
  }

  if (existingTx.status !== "available") {
    return NextResponse.json(
      { error: "Only available rewards can be marked as paid" },
      { status: 400 }
    )
  }

  const originalName = receipt.name || "receipt"
  const ext = originalName.includes(".")
    ? originalName.split(".").pop().toLowerCase()
    : "bin"

  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "bin"
  const uploadPath = `${existingTx.user_id}/${existingTx.id}-${Date.now()}.${safeExt}`

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from("receipts")
    .upload(uploadPath, receipt, {
      upsert: false,
      contentType: receipt.type || undefined,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    )
  }

  const storedPath = uploadData?.path || uploadPath

  const { data: tx, error: updateError } = await supabaseAdmin
    .from("wallet_transactions")
    .update({
      status: "paid",
      receipt_path: storedPath,
      paid_at: new Date().toISOString(),
      paid_by: user.id,
      note: note || `Marked paid by admin ${user.id}`,
    })
    .eq("id", id)
    .eq("status", "available")
    .select()
    .single()

  if (updateError || !tx) {
    return NextResponse.json(
      {
        error: "Failed to mark reward as paid",
        details: updateError?.message || null,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Reward marked as paid successfully",
    tx,
    uploadPath: storedPath,
  })
}