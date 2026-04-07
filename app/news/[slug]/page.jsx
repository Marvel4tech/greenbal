import Link from "next/link"
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import { ArrowLeft, CalendarDays, User2, Tag } from "lucide-react"
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

  const { data } = await supabase
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
      news_categories (
        id,
        name,
        slug
      ),
      profiles!news_posts_author_id_fkey (
        full_name
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  return data
}

async function getRelatedPosts(categoryId, currentSlug) {
  if (!categoryId) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from("news_posts")
    .select(`
      id,
      title,
      slug,
      cover_image_url,
      published_at,
      news_categories (
        name,
        slug
      )
    `)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(3)

  return data || []
}

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug)

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
  const post = await getPostBySlug(params.slug)

  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(post.news_categories?.id, post.slug)

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 transition-colors duration-300 dark:bg-black dark:text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-0 py-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-primary dark:text-gray-400 dark:hover:text-primary group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Blog</span>
          </Link>
        </div>

        <section className="pb-10">
          <div className="max-w-7xl mx-auto px-4 lg:px-0">
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-black">
                    {post.news_categories?.name || "News"}
                  </span>

                  <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                    <CalendarDays className="w-4 h-4" />
                    {formatDate(post.published_at)}
                  </span>

                  <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                    <User2 className="w-4 h-4" />
                    {post.profiles?.full_name || "GreenBall360"}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
                  {post.title}
                </h1>

                <p className="mt-6 max-w-3xl text-lg md:text-xl leading-8 text-gray-700 dark:text-white/75">
                  {post.excerpt}
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                  <img
                    src={post.cover_image_url || "/placeholder.jpg"}
                    alt={post.title}
                    className="h-[280px] md:h-[380px] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 lg:px-0 py-12">
            <div className="grid lg:grid-cols-12 gap-10">
              <article className="lg:col-span-8">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-10 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary prose-strong:text-gray-900 prose-img:rounded-2xl prose-img:w-full prose-img:my-6 dark:prose-invert dark:prose-p:text-white/80"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                  <div className="mt-10 border-t border-gray-200 pt-6 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white/80">
                        <Tag className="w-4 h-4 text-primary" />
                        Category:
                      </span>

                      <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 dark:border-white/10 dark:bg-black/40 dark:text-white/75">
                        {post.news_categories?.name || "News"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>

              <aside className="lg:col-span-4 space-y-6">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                    About this story
                  </h3>
                  <p className="leading-7 text-gray-700 dark:text-white/75">
                    GreenBall360 brings you football updates, previews, transfer
                    stories, and match insight designed for fans who want more than
                    just headlines.
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <h3 className="mb-5 text-xl font-bold text-gray-900 dark:text-white">
                    Related Stories
                  </h3>

                  <div className="space-y-5">
                    {relatedPosts.map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.slug}`}
                        className="group block"
                      >
                        <div className="flex gap-4">
                          <img
                            src={item.cover_image_url || "/placeholder.jpg"}
                            alt={item.title}
                            className="h-24 w-24 rounded-2xl object-cover border border-gray-200 dark:border-white/10"
                          />
                          <div className="flex-1">
                            <span className="mb-2 inline-block text-xs font-semibold text-primary">
                              {item.news_categories?.name || "News"}
                            </span>
                            <h4 className="font-bold leading-6 text-gray-900 transition group-hover:text-primary dark:text-white">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
                              {formatDate(item.published_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}