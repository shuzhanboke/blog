import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

async function getPosts() {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(6)

  return data || []
}

export default async function Home() {
  const posts = await getPosts()

  return (
    <div className="animate-fade-in">
      <section className="text-center py-20">
        <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm mb-6">
          Welcome to my digital garden
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="gradient-text">代码改变世界</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          分享技术点滴，记录开发历程，探索代码的魅力
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/blog"
            className="glow-button"
          >
            浏览文章
          </Link>
          <Link
            href="/about"
            className="px-8 py-3 rounded-lg border border-zinc-700 hover:border-purple-500/50 transition"
          >
            了解更多
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">最新文章</span>
          </h2>
          <Link href="/blog" className="text-purple-400 hover:text-purple-300 transition">
            查看全部 →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="post-card"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                <span>📅</span>
                <time>{format(new Date(post.created_at), 'PPP', { locale: zhCN })}</time>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-purple-400 transition">
                  {post.title}
                </Link>
              </h3>
              <p className="text-zinc-400 text-sm line-clamp-3 mb-4">
                {post.excerpt || post.content.slice(0, 100) + '...'}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-sm text-purple-400 hover:text-purple-300 transition inline-flex items-center gap-1"
              >
                阅读全文 <span>→</span>
              </Link>
            </article>
          ))}
        </div>
        {posts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-zinc-500">暂无文章，敬请期待！</p>
          </div>
        )}
      </section>
    </div>
  )
}