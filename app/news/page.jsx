import Link from "next/link"
import Navbar from "@/components/Navbar"
import { createServerClientWrapper } from "@/lib/supabase/server"

function formatDate(date) {
  if (!date) return ""
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

async function getNewsPageData() {
  const supabase = await createServerClientWrapper()

  const [
    { data: featuredPost },
    { data: latestPosts },
    { data: categories },
  ] = await Promise.all([
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
        author_name,
        news_categories (
          name,
          slug
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
        author_name,
        news_categories (
          name,
          slug
        )
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(8),

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

  const sidePosts = latestPosts.slice(0, 4)
  const gridPosts = latestPosts.slice(4)

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        <section className="max-w-7xl mx-auto px-4 lg:px-0 pt-8 pb-10">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Latest Football News
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-white/70">
                Breaking football stories, transfer rumours, previews and match insight.
              </p>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 6).map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-white/5 dark:text-white/75"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              {featuredPost ? (
                <article className="group relative overflow-hidden rounded-xl min-h-[320px] md:min-h-[420px] border border-gray-200/70 dark:border-white/10">
                  <img
                    src={featuredPost.cover_image_url || "/placeholder.jpg"}
                    alt={featuredPost.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

                  <div className="relative z-10 flex h-full items-end">
                    <div className="w-full p-5 md:p-7 lg:p-8">
                      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-black">
                          {featuredPost.news_categories?.name || "News"}
                        </span>
                        <span>{formatDate(featuredPost.published_at)}</span>
                        <span>By {featuredPost.author_name || "GreenBall360"}</span>
                      </div>

                      <h2 className="max-w-3xl text-2xl md:text-4xl font-bold leading-tight text-white">
                        {featuredPost.title}
                      </h2>

                      <p className="mt-4 max-w-2xl text-sm md:text-base lg:text-lg leading-7 text-white/85">
                        {featuredPost.excerpt}
                      </p>

                      <Link
                        href={`/news/${featuredPost.slug}`}
                        className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2.5 font-semibold text-black transition hover:opacity-90"
                      >
                        Read Full Story
                      </Link>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="rounded-xl border border-gray-200/70 p-6 dark:border-white/10">
                  No featured story yet.
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl border border-gray-200/70 p-4 dark:border-white/10">
                <h3 className="mb-4 text-lg font-bold">Latest Stories</h3>

                <div className="space-y-4">
                  {sidePosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/news/${post.slug}`}
                      className="group flex gap-3"
                    >
                      <img
                        src={post.cover_image_url || "/placeholder.jpg"}
                        alt={post.title}
                        className="h-20 w-20 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <span className="mb-1 inline-block text-xs font-semibold text-primary">
                          {post.news_categories?.name || "News"}
                        </span>

                        <h4 className="line-clamp-2 font-semibold leading-6 group-hover:text-primary">
                          {post.title}
                        </h4>

                        <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
                          {formatDate(post.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 lg:px-0 pb-14">
          <h2 className="mb-6 text-2xl md:text-3xl font-bold">
            More News
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {gridPosts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-xl border border-gray-200/70 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
              >
                <img
                  src={post.cover_image_url || "/placeholder.jpg"}
                  alt={post.title}
                  className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="rounded-full bg-primary/90 px-2.5 py-1 font-semibold text-black">
                      {post.news_categories?.name || "News"}
                    </span>
                    <span className="text-gray-500 dark:text-white/50">
                      {formatDate(post.published_at)}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-bold leading-6 group-hover:text-primary">
                    {post.title}
                  </h3>

                  <p className="line-clamp-2 text-sm text-gray-700 dark:text-white/70">
                    {post.excerpt}
                  </p>

                  <Link
                    href={`/news/${post.slug}`}
                    className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}