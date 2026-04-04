import Link from "next/link"
import Navbar from "@/components/Navbar"

const featuredPost = {
  id: 1,
  title: "Premier League Weekend Preview: Key Matches That Could Shake Up the Table",
  slug: "premier-league-weekend-preview-key-matches",
  excerpt:
    "A big weekend awaits in the Premier League with title contenders, top-four rivals, and relegation fighters all facing crucial fixtures.",
  category: "Match Preview",
  date: "April 3, 2026",
  author: "GreenBall360",
  image:
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
}

const latestPosts = [
  {
    id: 2,
    title: "Top 5 Players to Watch This Weekend Across Europe",
    slug: "top-5-players-to-watch-this-weekend",
    excerpt:
      "From prolific strikers to creative midfielders, here are five players who could make the biggest impact this weekend.",
    category: "Player Spotlight",
    date: "April 2, 2026",
    image:
      "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Transfer Rumour Roundup: Summer Targets Already Taking Shape",
    slug: "transfer-rumour-roundup-summer-targets",
    excerpt:
      "Clubs are already planning ahead, with several major names linked to big-money moves ahead of the summer window.",
    category: "Transfer News",
    date: "April 2, 2026",
    image:
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "Champions League Race Heats Up as Clubs Battle for Top Spots",
    slug: "champions-league-race-heats-up",
    excerpt:
      "With the season nearing its final stretch, the fight for Champions League qualification is becoming more intense.",
    category: "League Update",
    date: "April 1, 2026",
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    title: "Why Defensive Discipline Could Decide This Season’s Biggest Games",
    slug: "why-defensive-discipline-could-decide-big-games",
    excerpt:
      "While attacking stars grab the headlines, defensive organization may be the true difference-maker in crunch matches.",
    category: "Analysis",
    date: "April 1, 2026",
    image:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    title: "GreenBall360 Prediction Corner: Best Fixtures for the Weekend",
    slug: "greenball360-prediction-corner-best-fixtures",
    excerpt:
      "A closer look at this weekend’s most exciting fixtures and where smart predictions could make all the difference.",
    category: "Predictions",
    date: "March 31, 2026",
    image:
      "https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 7,
    title: "Injury Watch: Major Team News Ahead of the Next Matchday",
    slug: "injury-watch-major-team-news-ahead-of-next-matchday",
    excerpt:
      "Several key players face late fitness tests, and managers may need to reshuffle ahead of must-win encounters.",
    category: "Team News",
    date: "March 31, 2026",
    image:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80",
  },
]

const categories = [
  "All",
  "Match Preview",
  "Transfer News",
  "League Update",
  "Player Spotlight",
  "Predictions",
  "Analysis",
  "Team News",
]

export default function NewsPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-gray-900 transition-colors duration-300 dark:bg-black dark:text-white">
        {/* Hero */}
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

        {/* Featured + Categories */}
        <section className="max-w-7xl mx-auto px-4 lg:px-0 py-12">
          <div className="flex flex-wrap gap-3 mb-10">
            {categories.map((category) => (
              <button
                key={category}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === "All"
                    ? "bg-primary text-black"
                    : "bg-gray-100 text-gray-700 hover:bg-primary hover:text-black dark:bg-white/5 dark:text-white/80 dark:hover:bg-primary dark:hover:text-black"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Featured post */}
            <div className="lg:col-span-2">
              <article className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/[0.07]">
                <div className="overflow-hidden">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="h-[280px] md:h-[420px] w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                    <span className="rounded-full bg-primary px-3 py-1 font-semibold text-black">
                      {featuredPost.category}
                    </span>
                    <span className="text-gray-500 dark:text-white/50">{featuredPost.date}</span>
                    <span className="text-gray-500 dark:text-white/50">By {featuredPost.author}</span>
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

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Trending Topics
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Premier League",
                    "Champions League",
                    "Transfers",
                    "Predictions",
                    "Team News",
                    "Top Scorers",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-black/40 dark:text-white/80"
                    >
                      {tag}
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
        </section>

        {/* Latest posts */}
        <section className="max-w-7xl mx-auto px-4 lg:px-0 pb-16">
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
                    src={post.image}
                    alt={post.title}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-black">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-white/50">{post.date}</span>
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

        {/* Newsletter block */}
        <section className="border-t border-gray-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 lg:px-0 py-16">
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/15 to-gray-100 p-8 md:p-12 dark:to-white/5">
              <div className="max-w-3xl">
                <span className="inline-block rounded-full border border-primary/30 px-4 py-1 text-sm text-primary mb-5">
                  Stay Updated
                </span>

                <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4 text-gray-900 dark:text-white">
                  Never Miss the Biggest Football Stories
                </h2>

                <p className="text-lg leading-8 mb-8 text-gray-700 dark:text-white/75">
                  Follow GreenBall360 for the latest sports news, previews,
                  transfer updates, and match insights.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full sm:max-w-md rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary dark:border-white/10 dark:bg-black/50 dark:text-white"
                  />
                  <button className="rounded-xl bg-primary px-6 py-3 font-semibold text-black transition hover:opacity-90">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}