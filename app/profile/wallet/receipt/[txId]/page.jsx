import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { createServerClientWrapper } from "@/lib/supabase/server"
import {
  ArrowLeft,
  Download,
  FileText,
  BadgePoundSterling,
  CalendarDays,
  ShieldCheck,
  Eye,
} from "lucide-react"

function transactionTitle(type) {
  if (type === "weekly_top5_reward") return "Weekly Top 5 Reward"
  if (type === "referral_bonus") return "Referral Bonus"
  return "Wallet Reward"
}

function getFileTypeFromPath(path) {
  const ext = path?.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return "pdf"
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image"
  return "unknown"
}

export default async function ReceiptPage({ params }) {
  const { txId } = await params

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
    .select(`
      id,
      user_id,
      type,
      amount_gbp,
      status,
      paid_at,
      week_start,
      week_end,
      receipt_path,
      payout_batch_id
    `)
    .eq("id", txId)
    .eq("user_id", user.id)
    .single()

  if (txError || !tx) {
    redirect("/profile/wallet")
  }

  if (tx.status !== "paid") {
    redirect("/profile/wallet")
  }

  let batch = null
  let batchItems = [tx]
  let receiptPath = tx.receipt_path
  let paidAt = tx.paid_at

  if (tx.payout_batch_id) {
    const { data: batchData } = await supabase
      .from("payout_batches")
      .select("id, user_id, total_amount_gbp, receipt_path, paid_at, created_at")
      .eq("id", tx.payout_batch_id)
      .eq("user_id", user.id)
      .single()

    if (batchData) {
      batch = batchData
      receiptPath = batchData.receipt_path || tx.receipt_path
      paidAt = batchData.paid_at || tx.paid_at

      const { data: batchTxs } = await supabase
        .from("wallet_transactions")
        .select(`
          id,
          type,
          amount_gbp,
          week_start,
          week_end,
          paid_at,
          payout_batch_id
        `)
        .eq("user_id", user.id)
        .eq("payout_batch_id", tx.payout_batch_id)
        .order("created_at", { ascending: true })

      if (batchTxs?.length) {
        batchItems = batchTxs
      }
    }
  }

  if (!receiptPath) {
    redirect("/profile/wallet")
  }

  const totalAmount = batchItems.reduce(
    (sum, item) => sum + Number(item.amount_gbp || 0),
    0
  )

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

  const { data: signedData, error: signedError } = await adminDb.storage
    .from("receipts")
    .createSignedUrl(receiptPath, 300)

  if (signedError || !signedData?.signedUrl) {
    redirect("/profile/wallet")
  }

  const receiptUrl = signedData.signedUrl
  const fileType = getFileTypeFromPath(receiptPath)

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-0 py-10">
      <div className="mb-6">
        <Link
          href="/profile/wallet"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to wallet</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden shadow-xl">
        <div className="relative px-6 md:px-8 py-8 border-b border-gray-200 dark:border-white/10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Payment Confirmed
              </div>

              <h1 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                GreenBall360 Payment Receipt
              </h1>

              <p className="mt-2 text-sm text-gray-600 dark:text-white/70">
                This confirms that a reward payment was processed by{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  GreenBall360
                </span>.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-5 py-4 min-w-[220px]">
              <p className="text-xs text-gray-500 dark:text-white/50">Amount Paid</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                £{Number(totalAmount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-8 py-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Payment Type
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {batchItems.length > 1
                    ? `Combined Wallet Payout (${batchItems.length} items)`
                    : transactionTitle(batchItems[0]?.type)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-300">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-white/50">Paid On</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {paidAt ? new Date(paidAt).toLocaleString() : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-300">
                <BadgePoundSterling className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Processed By
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  GreenBall360
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
            <p className="text-xs text-gray-500 dark:text-white/50">
              Receipt Reference
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-gray-900 dark:text-white">
              {batch?.id || tx.id}
            </p>
          </div>
        </div>

        <div className="px-6 md:px-8 pb-2">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Payment Breakdown
            </h2>

            <div className="mt-4 space-y-3">
              {batchItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 dark:border-white/10 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {transactionTitle(item.type)}
                    </p>

                    {item.week_start && item.week_end ? (
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {item.week_start} → {item.week_end}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    £{Number(item.amount_gbp || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-white/10 px-6 md:px-8 py-8 mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Proof
              </h2>
            </div>

            <div className="flex gap-2">
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <FileText className="h-3 w-3" />
                Open in new tab
              </a>

              <a
                href={receiptUrl}
                download
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 overflow-hidden">
            {fileType === "image" ? (
              <div className="p-4 flex justify-center items-center bg-white dark:bg-black/20">
                <img
                  src={receiptUrl}
                  alt="Payment receipt"
                  className="max-w-full h-auto rounded-lg shadow-md"
                  style={{ maxHeight: "600px", objectFit: "contain" }}
                />
              </div>
            ) : fileType === "pdf" ? (
              <div className="p-2">
                <iframe
                  src={`${receiptUrl}#view=fitH`}
                  className="w-full rounded-lg"
                  style={{ height: "600px", border: "none" }}
                  title="Payment receipt PDF"
                />
              </div>
            ) : (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Unable to preview this file type
                </p>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition"
                >
                  <Eye className="h-4 w-4" />
                  View Receipt
                </a>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-500">
            This receipt serves as official confirmation of payment from GreenBall360.
            {fileType === "pdf" && " Use the controls above to zoom or download the PDF."}
            {fileType === "image" && " You can open or download the image for your records."}
          </p>
        </div>

        <div className="px-6 md:px-8 pb-8 flex flex-col sm:flex-row gap-3 justify-end">
          <Link
            href="/profile/wallet"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition"
          >
            Back to Wallet
          </Link>
        </div>
      </div>
    </div>
  )
}