import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import { createServerClientWrapper } from "@/lib/supabase/server"
import NewsPostForm from "@/components/dashboard/NewsPostForm"

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

async function getPostById(id) {
  const supabase = await createServerClientWrapper()

  const { data, error } = await supabase
    .from("news_posts")
    .select(`
      id,
      title,
      slug,
      excerpt,
      content,
      cover_image_url,
      category_id,
      status,
      featured,
      seo_title,
      seo_description,
      published_at
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("getPostById error:", error)
    return null
  }

  return data
}

export default async function EditNewsPostPage({ params }) {
  const { id } = await params

  const [categories, post] = await Promise.all([
    getCategories(),
    getPostById(id),
  ])

  if (!post) notFound()

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Edit News Post</h1>
            <p className="mt-2 text-gray-600 dark:text-white/70">
              Update and manage this article.
            </p>
          </div>

          <NewsPostForm
            categories={categories}
            initialData={post}
            mode="edit"
          />
        </div>
      </main>
    </>
  )
}