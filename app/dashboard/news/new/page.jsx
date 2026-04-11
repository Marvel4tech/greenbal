import Link from "next/link"
import Navbar from "@/components/Navbar"
import { createServerClientWrapper } from "@/lib/supabase/server"
import NewsPostForm from "@/components/dashboard/NewsPostForm"
import { ArrowLeft } from "lucide-react"

async function getCategories() {
  const supabase = await createServerClientWrapper()

  const { data, error } = await supabase
    .from("news_categories")
    .select("id, name, slug")
    .order("name", { ascending: true })

  if (error) {
    console.error("getCategories error:", error)
    return []
  }

  return data || []
}

export default async function NewNewsPostPage() {
  const categories = await getCategories()

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              href="/dashboard/news"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to News Dashboard
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Create News Post</h1>
            <p className="mt-2 text-gray-600 dark:text-white/70">
              Write, save as draft, or publish a new article.
            </p>
          </div>

          <NewsPostForm categories={categories} mode="create" />
        </div>
      </main>
    </>
  )
}