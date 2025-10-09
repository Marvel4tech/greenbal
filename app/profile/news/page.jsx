import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const dummyNews = [
  {
    id: 1,
    title: "Arsenal Confirms New Signing from Ajax",
    image: "/images/greenbul1.jpg",
    date: "Oct 5, 2025",
    excerpt:
      "Arsenal has officially announced the signing of Dutch midfielder Johan de Vries from Ajax in a £45m deal.",
  },
  {
    id: 2,
    title: "Pep Guardiola Extends Contract with Manchester City",
    image: "/images/greenbul2.jpg",
    date: "Oct 4, 2025",
    excerpt:
      "Manchester City fans rejoice as Pep Guardiola commits his future to the club until 2028 after months of speculation.",
  },
  {
    id: 3,
    title: "Kylian Mbappé Sets New Ligue 1 Scoring Record",
    image: "/images/greenbul3.jpg",
    date: "Oct 3, 2025",
    excerpt:
      "PSG forward Kylian Mbappé continues to break records as he becomes the top scorer in Ligue 1 history with 202 goals.",
  },
  {
    id: 4,
    title: "Liverpool Eyes Young Brazilian Talent",
    image: "/images/greenbul4.jpg",
    date: "Oct 2, 2025",
    excerpt:
      "Liverpool scouts spotted at Copa Libertadores semi-final, with sources linking them to teenage sensation Paulo Henrique.",
  },
]

const page = () => {

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-100 dark:bg-gray-900 px-4 py-6 md:px-10 md:py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Football News & Updates
        </h1>

        {/* News Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyNews.map((news) => (
              <div key={news.id} className="bg-white dark:bg-black/70 rounded-lg shadow-lg overflow-hidden border 
              hover:scale-[1.02] transition-transform">
                <div className="relative w-full h-48">
                  <Image 
                    src={news.image}
                    alt={news.title}
                    fill
                    className=' object-cover'
                  />
                </div>
                <div className="p-4 flex flex-col justify-between h-[200px]">
                  <div>
                    <h2 className="text-lg font-semibold line-clamp-2">
                      {news.title}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {news.date}
                    </p>
                    <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 line-clamp-3">
                      {news.excerpt}
                    </p>
                  </div>
                  <Link href={`/profile/news/${news.id}`} className="mt-3 inline-block text-green-600 dark:text-green-400 text-sm 
                  font-medium hover:underline">
                    Read more →
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default page