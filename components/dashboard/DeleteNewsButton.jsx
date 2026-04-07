"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"

function getStoragePathFromUrl(url) {
  if (!url) return null
  const marker = "/storage/v1/object/public/news-images/"
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

export default function DeleteNewsButton({
  postId,
  postTitle,
  coverImageUrl,
  hardDelete = true,
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      hardDelete
        ? `Delete "${postTitle}" permanently? This cannot be undone.`
        : `Archive "${postTitle}"?`
    )

    if (!confirmed) return

    setLoading(true)

    try {
      if (hardDelete) {
        const { error: deleteError } = await supabase
          .from("news_posts")
          .delete()
          .eq("id", postId)

        if (deleteError) throw deleteError

        const storagePath = getStoragePathFromUrl(coverImageUrl)
        if (storagePath) {
          await supabase.storage.from("news-images").remove([storagePath])
        }
      } else {
        const { error: archiveError } = await supabase
          .from("news_posts")
          .update({
            status: "archived",
            featured: false,
          })
          .eq("id", postId)

        if (archiveError) throw archiveError
      }

      router.refresh()
    } catch (err) {
      alert(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-2 text-red-600 hover:underline disabled:opacity-60 dark:text-red-400"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? (hardDelete ? "Deleting..." : "Archiving...") : hardDelete ? "Delete" : "Archive"}
    </button>
  )
}