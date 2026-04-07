import Link from "next/link"
import Navbar from "@/components/Navbar"
import { createServerClientWrapper } from "@/lib/supabase/server"

function formatDate(date) {
  if (!date) return ""
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

async function getNewsPageData() {
  const supabase = await createServerClientWrapper()

  const [{ data: featuredPost }, { data: latestPosts }, { data: categories }] =
    await Promise.all([
      supabase
        .from("news_posts")
        .select(`
          id,
          title,
          slug,
          excerpt,
          cover_image_url,
          published_at,
          featured,
          news_categories (
            name,
            slug
          ),
          profiles!news_posts_author_id_fkey (
            full_name
          )
        `)
        .eq("status", "published")
        .eq("featured", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("news_posts")
        .select(`
          id,
          title,
          slug,
          excerpt,
          cover_image_url,
          published_at,
          news_categories (
            name,
            slug
          )
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6),

      supabase
        .from("news_categories")
        .select("id, name, slug")
        .order("name", { ascending: true }),
    ])

  return {
    featuredPost: featuredPost || null,
    latestPosts: latestPosts || [],
    categories: categories || [],
  }
}

export default async function NewsPage() {
  const { featuredPost, latestPosts, categories } = await getNewsPageData()

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 transition-colors duration-300 dark:bg-black dark:text-white">
        <section className="border-b border-gray-200 bg-gradient-to-b from-green-100/40 to-white dark:border-white/10 dark:from-green-950/40 dark:to-black">
          <div className="max-w-7xl mx-auto px-4 lg:px-0 py-16 md:py-24">
            <div className="max-w-3xl">
              <span className="inline-block rounded-full border border-primary/40 px-4 py-1 text-sm font-medium text-primary mb-5">
                GreenBall360 Blog
              </span>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-gray-900 dark:text-white">
                Latest Football News, Match Previews and Sports Updates
              </h1>

              <p className="text-lg md:text-xl leading-8 text-gray-700 dark:text-white/75">
                Stay ahead with breaking football stories, transfer rumours, team
                news, match previews, and expert sports insight from GreenBall360.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 lg:px-0 py-12">
          <div className="flex flex-wrap gap-3 mb-10">
            <span className="rounded-full px-4 py-2 text-sm font-medium bg-primary text-black">
              All
            </span>

            {categories.map((category) => (
              <span
                key={category.id}
                className="rounded-full px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80"
              >
                {category.name}
              </span>
            ))}
          </div>

          {featuredPost && (
            <div className="grid lg:grid-cols-3 gap-8 mb-14">
              <div className="lg:col-span-2">
                <article className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.07]">
                  <div className="overflow-hidden">
                    <img
                      src={featuredPost.cover_image_url || "/placeholder.jpg"}
                      alt={featuredPost.title}
                      className="h-[280px] md:h-[420px] w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                      <span className="rounded-full bg-primary px-3 py-1 font-semibold text-black">
                        {featuredPost.news_categories?.name || "News"}
                      </span>
                      <span className="text-gray-500 dark:text-white/50">
                        {formatDate(featuredPost.published_at)}
                      </span>
                      <span className="text-gray-500 dark:text-white/50">
                        By {featuredPost.profiles?.full_name || "GreenBall360"}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-4 text-gray-900 dark:text-white">
                      {featuredPost.title}
                    </h2>

                    <p className="text-base md:text-lg leading-8 mb-6 text-gray-700 dark:text-white/70">
                      {featuredPost.excerpt}
                    </p>

                    <Link
                      href={`/news/${featuredPost.slug}`}
                      className="inline-flex items-center rounded-xl bg-primary px-5 py-3 font-semibold text-black transition hover:opacity-90"
                    >
                      Read Full Story
                    </Link>
                  </div>
                </article>
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {categories.slice(0, 8).map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-black/40 dark:text-white/80"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Why Read GreenBall360?
                  </h3>
                  <div className="space-y-4 leading-7 text-gray-700 dark:text-white/70">
                    <p>
                      Get football news, expert previews, and prediction-focused
                      content in one place.
                    </p>
                    <p>
                      We cover key fixtures, club updates, player stories, and the
                      biggest talking points across the game.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          )}

          <section className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Latest News
                </h2>
                <p className="mt-2 text-gray-600 dark:text-white/65">
                  Fresh football updates, previews, rumours and insight.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <article
                  key={post.id}
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                >
                  <div className="overflow-hidden">
                    <img
                      src={post.cover_image_url || "/placeholder.jpg"}
                      alt={post.title}
                      className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-black">
                        {post.news_categories?.name || "News"}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-white/50">
                        {formatDate(post.published_at)}
                      </span>
                    </div>

                    <h3 className="mb-3 text-xl font-bold leading-8 text-gray-900 transition group-hover:text-primary dark:text-white">
                      {post.title}
                    </h3>

                    <p className="mb-5 leading-7 text-gray-700 dark:text-white/70">
                      {post.excerpt}
                    </p>

                    <Link
                      href={`/news/${post.slug}`}
                      className="inline-flex items-center font-semibold text-primary hover:underline"
                    >
                      Read More
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  )
}