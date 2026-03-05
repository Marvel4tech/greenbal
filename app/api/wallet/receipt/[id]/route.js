import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function GET(req, { params }) {
  const supabase = await createServerClientWrapper()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: tx, error } = await supabase
    .from("wallet_transactions")
    .select("id, user_id, receipt_path, status")
    .eq("id", params.id)
    .single()

  if (error || !tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  if (tx.user_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 })
  }

  if (tx.status !== "paid" || !tx.receipt_path) {
    return NextResponse.json({ error: "Receipt not available" }, { status: 400 })
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("receipts")
    .createSignedUrl(tx.receipt_path, 60)

  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}