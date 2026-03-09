/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "dgpybourtosyfaevnlds.supabase.co",
        },
      ],
    },
  }
  
  export default nextConfig