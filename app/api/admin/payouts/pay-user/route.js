/* import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function POST(req) {
  try {
    const supabase = await createServerClientWrapper()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const formData = await req.formData()
    const userId = formData.get("userId")
    const receipt = formData.get("receipt")

    if (!userId || !receipt) {
      return NextResponse.json(
        { error: "Missing user or receipt" },
        { status: 400 }
      )
    }

    if (typeof receipt === "string") {
      return NextResponse.json(
        { error: "Invalid receipt upload" },
        { status: 400 }
      )
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: txs, error: txsError } = await adminDb
      .from("wallet_transactions")
      .select("id, user_id, amount_gbp")
      .eq("user_id", userId)
      .eq("status", "available")
      .is("payout_batch_id", null)

    if (txsError) {
      return NextResponse.json({ error: txsError.message }, { status: 500 })
    }

    if (!txs?.length) {
      return NextResponse.json(
        { error: "No available transactions to pay" },
        { status: 400 }
      )
    }

    const totalAmount = txs.reduce(
      (sum, tx) => sum + Number(tx.amount_gbp || 0),
      0
    )

    const ext = receipt.name?.split(".").pop()?.toLowerCase() || "pdf"
    const safeExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext) ? ext : "pdf"
    const filePath = `wallet-payouts/${userId}/batch-${Date.now()}.${safeExt}`

    const bytes = await receipt.arrayBuffer()

    const { error: uploadError } = await adminDb.storage
      .from("receipts")
      .upload(filePath, bytes, {
        upsert: true,
        contentType: receipt.type || "application/octet-stream",
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const now = new Date().toISOString()

    const { data: batch, error: batchError } = await adminDb
      .from("payout_batches")
      .insert({
        user_id: userId,
        total_amount_gbp: totalAmount,
        receipt_path: filePath,
        paid_at: now,
        paid_by: user.id,
        status: "paid",
      })
      .select()
      .single()

    if (batchError) {
      return NextResponse.json({ error: batchError.message }, { status: 500 })
    }

    const txIds = txs.map((tx) => tx.id)

    const { error: txUpdateError } = await adminDb
      .from("wallet_transactions")
      .update({
        status: "paid",
        paid_at: now,
        paid_by: user.id,
        payout_batch_id: batch.id,
      })
      .in("id", txIds)

    if (txUpdateError) {
      return NextResponse.json({ error: txUpdateError.message }, { status: 500 })
    }

    const { data: wallet, error: walletError } = await adminDb
      .from("wallets")
      .select("user_id, available_balance_gbp")
      .eq("user_id", userId)
      .single()

    if (walletError) {
      return NextResponse.json({ error: walletError.message }, { status: 500 })
    }

    const newAvailable = Math.max(
      0,
      Number(wallet.available_balance_gbp || 0) - Number(totalAmount || 0)
    )

    const { error: walletUpdateError } = await adminDb
      .from("wallets")
      .update({
        available_balance_gbp: newAvailable,
      })
      .eq("user_id", userId)

    if (walletUpdateError) {
      return NextResponse.json({ error: walletUpdateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      paidTransactionIds: txIds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    )
  }
} */

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/requireAdmin"
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin"

export async function POST(req) {
  try {
    const admin = await requireAdmin()

    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      )
    }

    const adminUser = admin.user

    const formData = await req.formData()
    const userId = formData.get("userId")
    const receipt = formData.get("receipt")

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      )
    }

    if (!receipt || typeof receipt === "string") {
      return NextResponse.json(
        { error: "Receipt file is required" },
        { status: 400 }
      )
    }

    const { data: txs, error: txErr } = await supabaseAdmin
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "available")

    if (txErr) {
      return NextResponse.json(
        { error: txErr.message },
        { status: 500 }
      )
    }

    if (!txs?.length) {
      return NextResponse.json(
        { error: "No available transactions for this user" },
        { status: 400 }
      )
    }

    const originalName = receipt.name || "receipt"
    const ext = originalName.includes(".")
      ? originalName.split(".").pop().toLowerCase()
      : "bin"

    const safeExt = ext.replace(/[^a-z0-9]/g, "") || "bin"
    const filePath = `${userId}/${Date.now()}.${safeExt}`

    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from("receipts")
      .upload(filePath, receipt, {
        upsert: true,
        contentType: receipt.type || undefined,
      })

    if (uploadErr) {
      return NextResponse.json(
        { error: uploadErr.message },
        { status: 500 }
      )
    }

    const storedPath = uploadData?.path || filePath
    const txIds = txs.map((t) => t.id)

    const { error: updateErr } = await supabaseAdmin
      .from("wallet_transactions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_by: adminUser.id,
        receipt_path: storedPath,
      })
      .in("id", txIds)

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      paidTransactionIds: txIds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    )
  }
}