import Link from "next/link"
import Navbar from "@/components/Navbar"
import { createServerClientWrapper } from "@/lib/supabase/server"
import DeleteNewsButton from "@/components/dashboard/DeleteNewsButton"
import { ArrowLeft } from "lucide-react"

function formatDate(date) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

async function getDashboardPosts() {
  const supabase = await createServerClientWrapper()

  const { data } = await supabase
    .from("news_posts")
    .select(`
      id,
      title,
      slug,
      status,
      featured,
      published_at,
      created_at,
      cover_image_url,
      news_categories (
        name
      )
    `)
    .order("created_at", { ascending: false })

  return data || []
}

export default async function DashboardNewsPage() {
  const posts = await getDashboardPosts()

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Manage News</h1>
              <p className="mt-2 text-gray-600 dark:text-white/70">
                Create and manage GreenBall360 blog posts.
              </p>
            </div>

            <Link
              href="/dashboard/news/new"
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-black transition hover:opacity-90"
            >
              New Post
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left">Title</th>
                    <th className="px-6 py-4 text-left">Category</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Featured</th>
                    <th className="px-6 py-4 text-left">Published</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{post.title}</div>
                        <div className="text-xs text-gray-500 dark:text-white/50">
                          /news/{post.slug}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {post.news_categories?.name || "—"}
                      </td>

                      <td className="px-6 py-4 capitalize">{post.status}</td>

                      <td className="px-6 py-4">
                        {post.featured ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            No
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {formatDate(post.published_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/dashboard/news/${post.id}/edit`}
                            className="font-semibold text-primary hover:underline"
                          >
                            Edit
                          </Link>

                          <Link
                            href={`/news/${post.slug}`}
                            className="text-gray-600 hover:underline dark:text-white/70"
                            target="_blank"
                          >
                            View
                          </Link>

                          <DeleteNewsButton
                            postId={post.id}
                            postTitle={post.title}
                            coverImageUrl={post.cover_image_url}
                            hardDelete={true}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}

                  {posts.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-gray-500 dark:text-white/50"
                      >
                        No news posts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}