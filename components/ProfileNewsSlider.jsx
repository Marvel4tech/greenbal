"use client"

import Link from "next/link"
import Image from "next/image"
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
    <div className="mb-3 w-full min-w-0">
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

      <div className="relative">
        <div
          className="w-full min-w-0 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex w-max gap-2 px-1 pb-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/news/${post.slug}`}
                className="group snap-start shrink-0 w-[110px] md:w-[130px]"
              >
                <article className="flex h-[110px] md:h-[130px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-black/60">
                  <div className="relative h-16 overflow-hidden bg-gray-200 md:h-20 dark:bg-gray-800">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 110px, 130px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden p-2">
                    <p className="line-clamp-3 text-[10px] leading-snug text-gray-800 md:text-[11px] dark:text-white">
                      {post.title}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-gray-100 dark:from-gray-800 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-gray-100 dark:from-gray-800 to-transparent" />
      </div>
    </div>
  )
}