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

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>
        </div>

        <section className="max-w-6xl mx-auto px-4 pb-8">
          <div className="relative overflow-hidden rounded-xl min-h-[320px] md:min-h-[420px] lg:min-h-[460px]">
            <img
              src={post.cover_image_url || "/placeholder.jpg"}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

            <div className="relative z-10 flex h-full items-end">
              <div className="w-full p-6 md:p-10 lg:p-12">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-black">
                    {post.news_categories?.name || "News"}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {formatDate(post.published_at)}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <User2 className="w-4 h-4" />
                    {post.author_name || "GreenBall360"}
                  </span>
                </div>

                <h1 className="max-w-4xl text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-white">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p className="mt-4 max-w-3xl text-base md:text-lg lg:text-xl leading-8 text-white/85">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-12 gap-8">
            <article className="lg:col-span-8">
              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary prose-strong:text-gray-900 prose-img:rounded-xl prose-img:w-full prose-img:my-6 dark:prose-invert dark:prose-p:text-white/80"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="mt-8 border-t border-gray-200 pt-5 dark:border-white/10">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
                  <Tag className="w-4 h-4 text-primary" />
                  {post.news_categories?.name || "News"}
                </span>
              </div>
            </article>

            <aside className="lg:col-span-4">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Related Stories
                </h3>

                {relatedPosts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group flex gap-3"
                  >
                    <img
                      src={item.cover_image_url || "/placeholder.jpg"}
                      alt={item.title}
                      className="h-20 w-20 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <span className="mb-1 inline-block text-xs font-semibold text-primary">
                        {item.news_categories?.name || "News"}
                      </span>

                      <h4 className="font-semibold leading-6 text-gray-900 transition group-hover:text-primary dark:text-white">
                        {item.title}
                      </h4>

                      <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                        {formatDate(item.published_at)}
                      </p>
                    </div>
                  </Link>
                ))}

                {relatedPosts.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    No related stories yet.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  )
}