"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function ProfileNewsSlider() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await fetch("/api/news?limit=10", {
          cache: "no-store",
        })

        const text = await res.text()

        if (!res.ok) {
          console.error("News API error:", text)
          return
        }

        const data = text ? JSON.parse(text) : []
        setPosts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("News error:", error)
      }
    }

    loadNews()
  }, [])

  if (!posts.length) return null

  return (
    <div className="mb-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-xs md:text-sm font-semibold text-gray-800 dark:text-white">
          Match Analysis
        </h2>

        <Link
          href="/news"
          className="text-[11px] font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-1 pb-2 snap-x snap-mandatory">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.slug}`}
              className="snap-start shrink-0 w-[30vw] max-w-[115px] md:w-[130px]"
            >
              <article className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-black/60 shadow-sm h-full">
                <div className="h-16 md:h-20 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <p className="text-[10px] md:text-[11px] leading-snug text-gray-800 dark:text-white line-clamp-4">
                    {post.title}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}