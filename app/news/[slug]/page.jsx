import Link from "next/link"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import { ArrowLeft, CalendarDays, User2, Tag, Share2, Bookmark, Gamepad2 } from "lucide-react"
import { createServerClientWrapper } from "@/lib/supabase/server"

function formatDate(date) {
  if (!date) return ""
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

async function getPostBySlug(slug) {
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
      seo_title,
      seo_description,
      published_at,
      author_name,
      news_categories (
        id,
        name,
        slug
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error) {
    console.error("getPostBySlug error:", error)
    return null
  }

  return data
}

async function getRelatedPosts(categoryId, currentSlug) {
  if (!categoryId) return []

  const supabase = await createServerClientWrapper()

  const { data, error } = await supabase
    .from("news_posts")
    .select(`
      id,
      title,
      slug,
      cover_image_url,
      published_at,
      news_categories (
        name
      )
    `)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(3)

  if (error) {
    console.error("getRelatedPosts error:", error)
    return []
  }

  return data || []
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Article Not Found | GreenBall360",
    }
  }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || "GreenBall360 sports news",
  }
}

export default async function SingleNewsPage({ params }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(post.news_categories?.id, post.slug)

  const cleanContent = (post.content || "")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<\/p><p>/g, "</p><p>")

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        <section className="relative">
          <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
            {post.cover_image_url ? (
              <>
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400">
                <div className="text-center">
                  <p className="text-lg">No image available</p>
                </div>
              </div>
            )}

            {/* Navigation Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Link
                  href="/news"
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm px-4 py-2 text-sm text-white hover:bg-black/70 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to News
                </Link>

                <Link
                  href="/profile/play"
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary/90 transition-all"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Back to Predict
                </Link>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 -mt-20 md:-mt-24 relative z-10">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {post.news_categories?.name || "News"}
                </span>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" />
                    {formatDate(post.published_at)}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <User2 className="w-4 h-4" />
                    {post.author_name || "GreenBall360"}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 dark:text-white mb-4">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary dark:text-gray-400 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary dark:text-gray-400 transition-colors">
                    <Bookmark className="w-4 h-4" />
                    Save
                  </button>
                </div>

                <Link
                  href="/profile/play"
                  className="hidden md:inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary/90 transition-colors"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Back to Predict
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <article className="lg:col-span-8 lg:col-start-1">
              <div
                className="prose prose-lg max-w-none
                  prose-p:mb-5
                  prose-p:leading-relaxed
                  prose-p:text-gray-700
                  prose-headings:font-bold
                  prose-headings:mt-8
                  prose-headings:mb-4
                  prose-h2:text-2xl
                  prose-h2:font-bold
                  prose-h3:text-xl
                  prose-h3:font-semibold
                  prose-ul:my-4
                  prose-ul:list-disc
                  prose-ul:pl-6
                  prose-ol:my-4
                  prose-ol:list-decimal
                  prose-ol:pl-6
                  prose-li:my-1
                  prose-img:my-8
                  prose-img:rounded-xl
                  prose-img:shadow-lg
                  prose-a:text-primary
                  prose-a:no-underline
                  prose-a:font-semibold
                  prose-a:hover:underline
                  prose-strong:text-gray-900
                  prose-strong:font-bold
                  prose-blockquote:border-l-4
                  prose-blockquote:border-primary
                  prose-blockquote:pl-4
                  prose-blockquote:italic
                  dark:prose-invert
                  dark:prose-p:text-gray-300
                  dark:prose-strong:text-white
                  dark:prose-headings:text-white"
                dangerouslySetInnerHTML={{
                  __html: cleanContent,
                }}
              />

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Tag className="w-4 h-4 text-primary" />
                    <span>Category:</span>
                    <Link
                      href={`/news/category/${post.news_categories?.slug}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {post.news_categories?.name || "News"}
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <aside className="lg:col-span-4">
              <div className="sticky top-24">
                <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Related Stories
                  </h3>

                  <div className="space-y-5">
                    {relatedPosts.map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.slug}`}
                        className="group flex gap-4"
                      >
                        {item.cover_image_url ? (
                          <div className="flex-shrink-0">
                            <img
                              src={item.cover_image_url}
                              alt={item.title}
                              className="h-24 w-24 rounded-xl object-cover group-hover:opacity-90 transition-opacity"
                            />
                          </div>
                        ) : (
                          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                            No image
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="mb-1.5 inline-block text-xs font-semibold text-primary">
                            {item.news_categories?.name || "News"}
                          </span>

                          <h4 className="font-semibold leading-6 text-gray-900 transition group-hover:text-primary dark:text-white line-clamp-2">
                            {item.title}
                          </h4>

                          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(item.published_at)}
                          </p>
                        </div>
                      </Link>
                    ))}

                    {relatedPosts.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No related stories yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 bg-primary/5 rounded-2xl p-6 border border-primary/10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Stay Updated
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Get the latest news delivered to your inbox
                  </p>
                  <button className="w-full bg-primary text-black font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  )
}