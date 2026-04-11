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
        content,
        cover_image_url,
        published_at,
        featured,
        author_name,
        news_categories (
          id,
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
          id,
          name,
          slug
        )
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(9),

    supabase
      .from("news_categories")
      .select("id, name, slug, description")
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

  // Split posts for different sections
  const secondaryPosts = latestPosts.slice(0, 2)
  const gridPosts = latestPosts.slice(2)

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
        {/* Hero Section with Categories */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                Football News
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Breaking stories, transfer updates, and match insights
              </p>
            </div>

            {categories.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/news/category/${category.slug}`}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-primary hover:text-black dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-primary dark:hover:text-black"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FEATURED POST - Hero Layout */}
        {featuredPost && (
          <section className="max-w-7xl mx-auto px-4 py-10">
            <Link href={`/news/${featuredPost.slug}`} className="group block">
              <div className="relative overflow-hidden rounded-2xl bg-gray-900">
                <div className="grid md:grid-cols-2">
                  {/* Image Side */}
                  <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden">
                    {featuredPost.cover_image_url ? (
                      <img
                        src={featuredPost.cover_image_url}
                        alt={featuredPost.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-500">
                        No image
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-black">
                        FEATURED
                      </span>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="p-6 md:p-8 lg:p-10 bg-gradient-to-br from-gray-900 to-gray-800">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-300">
                      <span className="font-semibold text-primary">
                        {featuredPost.news_categories?.name || "Top Story"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(featuredPost.published_at)}</span>
                      <span>•</span>
                      <span>By {featuredPost.author_name || "Editor"}</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-white mb-4 group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>

                    <p className="text-gray-300 leading-relaxed mb-6 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>

                    <div className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                      Read full story
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Secondary Featured Posts - 2 Column Layout */}
        {secondaryPosts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 pb-10">
            <div className="grid gap-6 md:grid-cols-2">
              {secondaryPosts.map((post) => (
                <Link key={post.id} href={`/news/${post.slug}`} className="group">
                  <article className="relative overflow-hidden rounded-xl bg-gray-900 h-full">
                    <div className="relative h-56 overflow-hidden">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-500">
                          No image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <span className="inline-block rounded-full bg-primary/90 px-2.5 py-1 text-xs font-bold text-black mb-2">
                        {post.news_categories?.name || "News"}
                      </span>
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                        <span>{formatDate(post.published_at)}</span>
                        <span>•</span>
                        <span>By {post.author_name || "Editor"}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More News Grid */}
        {gridPosts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 pb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Latest News</h2>
              <Link href="/news/archive" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <Link key={post.id} href={`/news/${post.slug}`} className="group">
                  <article className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all hover:-translate-y-1 bg-white dark:bg-gray-900">
                    <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-primary font-semibold">
                          {post.news_categories?.name || "News"}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDate(post.published_at)}
                        </span>
                      </div>

                      <h3 className="mb-2 font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {post.excerpt}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <span>By {post.author_name || "Editor"}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!featuredPost && latestPosts.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Check back soon for the latest news.</p>
          </div>
        )}
      </main>
    </>
  )
}