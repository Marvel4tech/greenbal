import Navbar from "@/components/Navbar"
import { createServerClientWrapper } from "@/lib/supabase/server"
import NewsPostForm from "@/components/dashboard/NewsPostForm"

async function getCategories() {
  const supabase = await createServerClientWrapper()

  const { data } = await supabase
    .from("news_categories")
    .select("id, name, slug")
    .order("name", { ascending: true })

  return data || []
}

export default async function NewNewsPostPage() {
  const categories = await getCategories()

  return (
    <>
      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Create News Post</h1>
            <p className="mt-2 text-gray-600 dark:text-white/70">
              Write, save as draft, or publish a new article.
            </p>
          </div>

          <NewsPostForm categories={categories} />
        </div>
      </main>
    </>
  )
}