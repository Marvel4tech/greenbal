import Link from "next/link"
import Navbar from "@/components/Navbar"
import { createServerClientWrapper } from "@/lib/supabase/server"
import DeleteNewsButton from "@/components/dashboard/DeleteNewsButton"

function formatDate(date) {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

function getStatusBadge(status) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300"
    case "draft":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300"
    case "archived":
      return "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70"
  }
}

async function getDashboardPosts() {
  const supabase = await createServerClientWrapper()

  const { data, error } = await supabase
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

  if (error) {
    console.error("getDashboardPosts error:", error)
    return []
  }

  return data || []
}

export default async function DashboardNewsPage({ searchParams }) {
  const posts = await getDashboardPosts()
  const params = await searchParams
  const activeFilter = params?.status || "all"

  const filteredPosts =
    activeFilter === "all"
      ? posts
      : posts.filter((post) => post.status === activeFilter)

  const filters = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Archived", value: "archived" },
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Manage News</h1>
              <p className="mt-2 text-gray-600 dark:text-white/70">
                Create and manage GreenBall360 blog posts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/news/new"
                className="rounded-xl bg-primary px-5 py-3 font-semibold text-black transition hover:opacity-90"
              >
                New Post
              </Link>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.value

              return (
                <Link
                  key={filter.value}
                  href={
                    filter.value === "all"
                      ? "/dashboard/news"
                      : `/dashboard/news?status=${filter.value}`
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-black"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                  }`}
                >
                  {filter.label}
                </Link>
              )
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
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
                  {filteredPosts.map((post) => (
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

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadge(
                            post.status
                          )}`}
                        >
                          {post.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {post.featured ? "Yes" : "No"}
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

                          {post.status === "published" ? (
                            <Link
                              href={`/news/${post.slug}`}
                              className="text-gray-600 hover:underline dark:text-white/70"
                            >
                              View
                            </Link>
                          ) : (
                            <span className="text-gray-400 dark:text-white/30">
                              Draft
                            </span>
                          )}

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

                  {filteredPosts.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-gray-500 dark:text-white/50"
                      >
                        No posts found for this filter.
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