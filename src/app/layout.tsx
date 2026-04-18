import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: '技术博客 | 代码改变世界',
  description: '分享技术、记录生活、传递价值',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 glass-card !rounded-none !bg-opacity-80">
          <nav className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold gradient-text">
                {'<'}CodeBlog{' />'}
              </Link>
              <div className="flex gap-8 items-center">
                <Link href="/" className="nav-link">
                  首页
                </Link>
                <Link href="/blog" className="nav-link">
                  文章
                </Link>
                <Link href="/about" className="nav-link">
                  关于
                </Link>
                <Link href="/admin" className="px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/50 text-purple-400 hover:bg-purple-600/30 transition">
                  管理
                </Link>
              </div>
            </div>
          </nav>
        </header>
        <main className="flex-1 pt-24 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
        <footer className="py-8 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 text-center text-zinc-500">
            <p>
              <span className="gradient-text font-mono">© {new Date().getFullYear()} CodeBlog</span>
              {' '} · {' '}Built with <span className="text-purple-400">Next.js</span> + <span className="text-emerald-400">Supabase</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}