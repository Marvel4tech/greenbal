import { redirect } from "next/navigation"
import { createServerClientWrapper } from "@/lib/supabase/server"

export default async function ReceiptPage({ params }) {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: tx, error: txError } = await supabase
    .from("wallet_transactions")
    .select("id, user_id, payout_batch_id, status")
    .eq("id", params.txId)
    .eq("user_id", user.id)
    .single()

  if (txError || !tx || tx.status !== "paid" || !tx.payout_batch_id) {
    redirect("/profile/wallet")
  }

  const { data: batch, error: batchError } = await supabase
    .from("payout_batches")
    .select("id, receipt_path")
    .eq("id", tx.payout_batch_id)
    .single()

  if (batchError || !batch?.receipt_path) {
    redirect("/profile/wallet")
  }

  const { data: publicUrlData } = supabase.storage
    .from("receipts")
    .getPublicUrl(batch.receipt_path)

  if (!publicUrlData?.publicUrl) {
    redirect("/profile/wallet")
  }

  redirect(publicUrlData.publicUrl)
}