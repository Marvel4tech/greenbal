import Link from "next/link"
import Navbar from "@/components/Navbar"
import { ArrowLeft, CalendarDays, User2, Tag } from "lucide-react"

const post = {
  id: 1,
  title: "Premier League Weekend Preview: Key Matches That Could Shake Up the Table",
  slug: "premier-league-weekend-preview-key-matches",
  excerpt:
    "A big weekend awaits in the Premier League with title contenders, top-four rivals, and relegation fighters all facing crucial fixtures.",
  category: "Match Preview",
  date: "April 3, 2026",
  author: "GreenBall360",
  image:
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80",
  body: [
    "The Premier League returns with another high-stakes weekend, and the pressure is building at both ends of the table. Title challengers are fighting for every point, while clubs chasing European qualification know there is little room for error.",
    "This round of fixtures brings several headline clashes that could reshape the standings. Managers will be watching fitness reports closely, especially with a number of key players facing late checks before kickoff.",
    "One of the major talking points this weekend is whether the league leaders can handle the pressure. Momentum matters at this stage of the season, but so does squad depth, tactical discipline, and the ability to manage difficult away matches.",
    "Further down the table, the battle for survival is becoming just as intense. Teams in the relegation zone are entering must-win territory, and even a single result could change the mood around an entire club.",
    "Supporters should also expect tactical battles in midfield, where several of the biggest matches may be decided. Control of possession, transitions, and set-piece execution could all prove decisive across the weekend.",
    "For fans and prediction players alike, this is the kind of football weekend that can define a season. Every match carries weight, every goal matters, and the margins between success and disappointment are becoming increasingly small.",
  ],
}

const relatedPosts = [
  {
    id: 2,
    title: "Top 5 Players to Watch This Weekend Across Europe",
    slug: "top-5-players-to-watch-this-weekend",
    category: "Player Spotlight",
    date: "April 2, 2026",
    image:
      "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    title: "Transfer Rumour Roundup: Summer Targets Already Taking Shape",
    slug: "transfer-rumour-roundup-summer-targets",
    category: "Transfer News",
    date: "April 2, 2026",
    image:
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    title: "Champions League Race Heats Up as Clubs Battle for Top Spots",
    slug: "champions-league-race-heats-up",
    category: "League Update",
    date: "April 1, 2026",
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=900&q=80",
  },
]

export default function SingleNewsPage() {
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

        {/* Hero */}
        <section className="pb-10">
          <div className="max-w-7xl mx-auto px-4 lg:px-0">
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-black">
                    {post.category}
                  </span>

                  <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                    <CalendarDays className="w-4 h-4" />
                    {post.date}
                  </span>

                  <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                    <User2 className="w-4 h-4" />
                    {post.author}
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
                    src={post.image}
                    alt={post.title}
                    className="h-[280px] md:h-[380px] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article + Sidebar */}
        <section className="border-t border-gray-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 lg:px-0 py-12">
            <div className="grid lg:grid-cols-12 gap-10">
              {/* Article */}
              <article className="lg:col-span-8">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-10 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="max-w-none">
                    {post.body.map((paragraph, index) => (
                      <p
                        key={index}
                        className="mb-6 leading-8 text-gray-700 dark:text-white/80"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <div className="mt-10 border-t border-gray-200 pt-6 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white/80">
                        <Tag className="w-4 h-4 text-primary" />
                        Tags:
                      </span>

                      {["Football", "Premier League", "Match Preview", "Weekend Fixtures"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 dark:border-white/10 dark:bg-black/40 dark:text-white/75"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              {/* Sidebar */}
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
                            src={item.image}
                            alt={item.title}
                            className="h-24 w-24 rounded-2xl object-cover border border-gray-200 dark:border-white/10"
                          />
                          <div className="flex-1">
                            <span className="mb-2 inline-block text-xs font-semibold text-primary">
                              {item.category}
                            </span>
                            <h4 className="font-bold leading-6 text-gray-900 transition group-hover:text-primary dark:text-white">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
                              {item.date}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 to-gray-100 p-6 shadow-sm dark:to-white/5">
                  <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                    Stay Updated
                  </h3>
                  <p className="mb-5 leading-7 text-gray-700 dark:text-white/75">
                    Get the latest football news, previews, and transfer updates from GreenBall360.
                  </p>

                  <div className="flex flex-col gap-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary dark:border-white/10 dark:bg-black/50 dark:text-white"
                    />
                    <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-black transition hover:opacity-90">
                      Subscribe
                    </button>
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