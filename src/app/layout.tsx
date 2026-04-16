import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Blog',
  description: 'A modern blog built with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                我的博客
              </Link>
              <div className="flex gap-6">
                <Link href="/" className="hover:text-primary-600 transition">
                  首页
                </Link>
                <Link href="/blog" className="hover:text-primary-600 transition">
                  博客
                </Link>
                <Link href="/about" className="hover:text-primary-600 transition">
                  关于
                </Link>
                <Link href="/admin" className="hover:text-primary-600 transition">
                  管理
                </Link>
              </div>
            </div>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} 我的博客. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
