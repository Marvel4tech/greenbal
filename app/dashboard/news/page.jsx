'use client'

import { Newspaper, PlusCircle, Trash } from 'lucide-react'
import Image from 'next/image'
import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const page = () => {
    const [news, setNews] = useState({
        title: "",
        category: "",
        coverImage: "",
        content: "",
    })
    const [preview, setPreview] = useState(null)
    const [newsList, setNewsList] = useState([])

    // functions
    const handleChange = (e) => {
        setNews({
            ...news,
            [e.target.name]: [e.target.value]
        })
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPreview(URL.createObjectURL(file));
            setNews({...news, coverImage: file})
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!news.title || !news.category || !news.content) return;

        const newPost = {
            id: Date.now(),
            ...news,
            coverPreview: preview,
            date: new Date().toLocaleString(),
        }

        setNewsList([newPost, ...newsList]);
        setNews({ title: "", category: "", coverImage: "", content: "" });
        setPreview(null);
    }

    const handleDelete = (id) => {
        setNewsList(newsList.filter((n) => n.id !== id))
    }

  return (
    <div className="p-6 max-w-5xl mx-auto">
        {/* Back button - visible on all devices */}
        <div className="mb-4">
            <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
            </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Newspaper className="text-primary"/> Admin News Management
        </h1>

        {/* form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-black/60 p-6 rounded-xl shadow-lg flex flex-col gap-6 mb-10">
            {/* title */}
            <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input 
                    type="text" 
                    name='title'
                    value={news.title}
                    onChange={handleChange}
                    placeholder="Enter post title"
                    className="w-full border rounded-md p-3 bg-transparent"
                    required
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select value={news.category} onChange={handleChange} name='category' className="w-full border 
                rounded-md p-3 bg-transparent" required>
                    <option value="">Select category</option>
                    <option value="club">fifa</option>
                    <option value="player">uefa</option>
                    <option value="transfer">Transfer</option>
                    <option value="afcon">afcon</option>
                    <option value="championsLeague">champions league</option>
                    <option value="greenball360">greenball360</option>
                    <option value="epl">epl</option>
                    <option value="laliga">la liga</option>
                    <option value="seria A">seria A</option>
                </select>
            </div>

            {/* Cover Image */}
            <div>
                <label className="block text-sm font-medium mb-2">Cover Image</label>
                <input 
                    type="file"
                    accept='image/*'
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 border rounded-md cursor-pointer bg-transparent p-3"
                />
                {/* {preview && (
                    <Image 
                        src={preview}
                        alt='preview'
                        className="mt-3 w-full h-56 object-cover rounded-lg shadow-md"
                    />
                )} */}
            </div>

            {/* Content */}
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea 
                name="content" 
                rows="8" 
                value={news.content}
                onChange={handleChange}
                placeholder="Write your news post here..." 
                className="w-full border rounded-md p-3 resize-none bg-transparent"
                required
            />

            {/* Submit */}
            <button type='submit' className="bg-primary text-white px-6 py-3 rounded-md font-semibold flex items-center 
            justify-center gap-2 hover:opacity-90">
                <PlusCircle size={18} /> Publish Post
            </button>
        </form>

        {/* Recent Posts Section */}
        <div className="bg-white dark:bg-black/60 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">🕒 Recent News Posts</h2>

            {newsList.length === 0 ? (
                <p className="text-gray-500 text-center">
                    No news posts yet. Create your first one above.
                </p>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {newsList.map((post) => (
                        <div key={post.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                            {post.coverPreview ? (
                                <div className=' relative w-full h-40'>
                                    <Image 
                                        src={post.coverPreview}
                                        alt={post.title}
                                        fill
                                        className=" object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm">
                                    No Image
                                </div>
                            )}
                            <div className="p-4 flex flex-col gap-2">
                                <h3 className="font-bold">{post.title}</h3>
                                <span className="text-xs text-gray-500 capitalize">
                                    {post.category} • {post.date}
                                </span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                    {post.content}
                                </p>
                                <button onClick={handleDelete} className="mt-3 text-red-500 text-sm flex items-center gap-1 
                                hover:text-red-700 self-end">
                                    <Trash size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  )
}

export default page