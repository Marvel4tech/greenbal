'use client'

import { Mail, Search, User } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react'

const page = () => {
    const [users] = useState([
        { id: "1", name: "Marvellous Ayomike", email: "marv@example.com", country: "Nigeria", role: "User" },
        { id: "2", name: "David John", email: "david@example.com", country: "Ghana", role: "User" },
        { id: "3", name: "Sophia West", email: "sophia@example.com", country: "Kenya", role: "User" },
        { id: "4", name: "Adebayo Femi", email: "femi@example.com", country: "Nigeria", role: "User" },
    ]);
    const [searchTerm, setSearchTerm] = useState("")

    const filteredUsers = users.filter((user) => {
        if (!searchTerm.trim()) return true; // show all when empty

        return(
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })

    const handleChange = (e) => {
        setSearchTerm(e.target.value)
    }

    
  return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">All Users</h1>

            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 border rounded-lg w-full bg-white dark:bg-gray-900 dark:border-gray-700 
                    outline-none focus:ring-2 focus:ring-primary transition"
                    value={searchTerm}
                    onChange={handleChange}
                />
            </div>
        </div>

        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full text-sm md:text-base">
                <thead className="bg-primary text-white">
                    <tr>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Country</th>
                        <th className="p-3 text-left">Role</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 
                        dark:hover:bg-gray-800 transition">
                            <td className="p-3">
                                <Link href={`/dashboard/users/${user.id}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                                    <User className="w-5 h-5 text-gray-500" />
                                    <span className="font-medium">{user.name}</span>
                                </Link>
                            </td>
                            <td className="p-3 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {user.email}
                            </td>
                            <td className="p-3">{user.country}</td>
                            <td className="p-3">
                                <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                                    {user.role}
                                </span>
                            </td>
                        </tr>
                    ))}

                    {filteredUsers.length === 0 && (
                        <tr>
                            <td colSpan="4" className="text-center py-6 text-gray-500">
                                No users found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default page