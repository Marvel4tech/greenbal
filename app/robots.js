export default function robots() {
    return {
      rules: [
        {
          userAgent: '*',
          allow: ['/', '/about', '/contact', '/news', '/leaderboard'],
          disallow: ['/signup', '/signin', '/admin', '/dashboard', '/profile'],
        },
      ],
      sitemap: 'https://greenball360.com/sitemap.xml',
    };
}