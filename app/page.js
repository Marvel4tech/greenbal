"use client"

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react"

const images = [
  "/images/greenbul1.jpg",
  "/images/greenbul2.jpg",
  "/images/greenbul3.jpg",
  "/images/greenbul4.jpg",
  "/images/greenbul5.jpg",
  "/images/greenbul6.jpg",
]

const Page = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000); // The homepage bg images to change every 5 secs
    return () => clearInterval(interval)
  }, []);

  return (
    <section className=" relative h-full overflow-hidden">
      {/* Background images */}
      {images.map((image, index) => (
        <div key={index} className= {`absolute inset-0 transition-opacity duration-1000 ${index === current ? "opacity-100" : "opacity-0"
        }`}>
          <Image 
            src={image}
            alt={`Background ${index + 1}`}
            fill
            priority={index === 0} // loads first img faster
            className="object-cover"
          />
        </div>
      ))}

      {/* Black 0verlay */}
      <div className=" absolute inset-0 bg-black/70 z-0" />

      {/* Content */}
      <div className=" relative z-10 h-full flex flex-col items-center justify-center px-4 lg:px-0">
        <div className=" md:w-1/2 bg-primary p-10">
          <p className=" text-center text-sm md:text-base'">
            Imagine watching your favorite sports — football, basketball, cricket, and more — while predicting scores with 
            accuracy and winning cash at the end of each week. There’s always a winner every week. Super Sunday isn’t just 
            super for your team’s victory, it’s also super for your bank account. And the best part? It’s completely free! If you’re 
            good at predictions, then this game is made for you.
          </p>
        </div>
        <div className=" flex gap-4 mt-5">
          <Button variant="default">
            <Link href={"/login"}>
              Login
            </Link>
          </Button>
          <Button variant="outline">
            <Link href={"/register"}>
              Register
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default Page