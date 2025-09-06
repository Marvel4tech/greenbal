import Link from 'next/link';
import { FaFutbol } from "react-icons/fa";
import React from 'react'
import { ThemeToggle } from './theme-toggle';

const Navbar = () => {
    const navlinks = [
        {href: "/", label: "Home"},
        {href: "/table", label: "Table"},
        {href: "/contact", label: "Contact Us"},
        {href: "/about", label: "About Us"},
    ];

  return (
    <header className='border-b border-primary bg-black/85 px-4 lg:px-0'>
        <div className=' h-20 max-w-7xl mx-auto flex justify-between items-center'>
            <Link href={"/"}>
                <FaFutbol className=' text-5xl text-primary' />
            </Link>
            <nav className=' hidden md:flex md:flex-row'>
                {navlinks.map((link) => (
                    <Link key={link.href} href={link.href} 
                    className=' text-primary font-bold hover:bg-primary hover:text-secondary px-4 py-1'>
                        {link.label}
                    </Link>
                ))}
            </nav>
            <ThemeToggle />
        </div>
    </header>
  )
}

export default Navbar