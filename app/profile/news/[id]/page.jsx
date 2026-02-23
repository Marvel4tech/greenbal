import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

const dummyNews = [
    {
        id: 1,
        title: "Arsenal Confirms New Signing from Ajax",
        image: "/images/greenbul1.jpg",
        date: "Oct 5, 2025",
        content: `
          Arsenal has officially announced the signing of Dutch midfielder Johan de Vries from Ajax in a £45m deal.
          The 22-year-old will join the Gunners on a five-year contract and is expected to bolster Mikel Arteta’s midfield depth.
          Fans are already excited as the young star is known for his versatility and technical brilliance.
          
          Speaking after the signing, Arteta said:
          "We are thrilled to bring in a player of Johan's quality and character. He perfectly fits our vision for the future."
        `,
    },
    {
        id: 2,
        title: "Pep Guardiola Extends Contract with Manchester City",
        image: "/images/greenbul2.jpg",
        date: "Oct 4, 2025",
        content: `
          Manchester City fans rejoice as Pep Guardiola commits his future to the club until 2028 after months of speculation.
          The Spaniard has already delivered six Premier League titles and two Champions League trophies since 2016.
          
          Guardiola said:
          "My love for this club and these players continues to grow. Together, we'll keep pushing boundaries."
        `,
    },
];

const page = async ({ params }) => {
    // Await the params Promise
    const unwrappedParams = await params
    const newsId = parseInt(unwrappedParams.id)
    const article = dummyNews.find((n) => n.id === newsId);

    if(!article) {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                <p>Article not found.</p>
            </div>
        );
    }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-100 dark:bg-gray-900 px-4 md:px-10 py-6 md:py-10">
        <div className="max-w-3xl mx-auto">
            {/* Desktop back button - only visible on desktop */}
            <div className="hidden md:block mb-4">
                <Link 
                    href="/profile/news" 
                    className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to News</span>
                </Link>
            </div>

            <div className="bg-white dark:bg-black/70 border rounded-lg shadow-lg overflow-hidden">
                {/* Image */}
                <div className="relative w-full h-64 md:h-96">
                    <Image 
                        src={article.image}
                        alt={article.title}
                        fill
                        className=' object-cover'
                    />
                </div>

                {/* Article Content */}
                <div className="p-6 md:p-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                        {article.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        {article.date}
                    </p>
                    <div className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                        {article.content}
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default page