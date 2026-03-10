import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { createServerClientWrapper } from "@/lib/supabase/server"

export default async function ReceiptPage({ params }) {
  const { id } = await params
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: tx, error } = await supabase
    .from("wallet_transactions")
    .select("id, user_id, receipt_path, status, amount_gbp, week_start, week_end, paid_at")
    .eq("id", id)
    .single()

  if (error || !tx) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-red-600">Receipt not found</h1>
      </div>
    )
  }

  if (tx.user_id !== user.id) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-red-600">Not allowed</h1>
      </div>
    )
  }

  if (tx.status !== "paid" || !tx.receipt_path) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-red-600">Receipt not available</h1>
      </div>
    )
  }

  const { data: signed } = await supabase.storage
    .from("receipts")
    .createSignedUrl(tx.receipt_path, 300)

  const url = signed?.signedUrl
  const ext = tx.receipt_path.split(".").pop()?.toLowerCase()

  const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext)
  const isPdf = ext === "pdf"

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Back */}
      <div className="mb-6">
        <Link
          href="/profile/wallet"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wallet
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Payment Receipt
        </h1>
      </div>

      {/* Receipt details */}
      <div className="mb-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-5 text-sm">
        <div className="grid grid-cols-2 gap-4">

          <div>
            <p className="text-gray-500 dark:text-white/50">Transaction</p>
            <p className="font-medium text-gray-900 dark:text-white">{tx.id}</p>
          </div>

          <div>
            <p className="text-gray-500 dark:text-white/50">Amount</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              £{Number(tx.amount_gbp).toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-gray-500 dark:text-white/50">Week</p>
            <p className="text-gray-900 dark:text-white">
              {tx.week_start} → {tx.week_end}
            </p>
          </div>

          <div>
            <p className="text-gray-500 dark:text-white/50">Paid at</p>
            <p className="text-gray-900 dark:text-white">
              {tx.paid_at
                ? new Date(tx.paid_at).toLocaleString()
                : "-"}
            </p>
          </div>

        </div>
      </div>

      {/* Receipt viewer */}
      <div className="flex justify-center">
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-4 shadow-sm max-w-3xl w-full">

          {isImage && (
            <img
              src={url}
              alt="Receipt"
              className="w-full h-auto rounded-lg"
            />
          )}

          {isPdf && (
            <iframe
              src={url}
              className="w-full h-[80vh] rounded-lg"
              title="Receipt Viewer"
            />
          )}

        </div>
      </div>

      {/* Download */}
      <div className="mt-6 flex justify-center">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition"
        >
          <Download className="w-4 h-4" />
          Download Receipt
        </a>
      </div>

    </div>
  )
}