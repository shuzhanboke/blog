import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { staticPosts } from '@/lib/static-posts'

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
  const dbPosts = await getPosts()
  const posts = [...staticPosts, ...dbPosts]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 6)

  return (
    <div className="animate-fade-in">
      <section className="hero-shell hero-shell--minimal">
        <div className="hero-panel hero-panel--content">
          <div className="hero-badge">
            <span className="hero-badge__dot" />
            AI Code Desk
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold">
            <span className="gradient-text">代码改变世界</span>
          </h1>
          <p className="hero-description">
            一个围绕 AI 协作开发、博客沉淀和部署验证持续演进的个人工作台。
          </p>
          <div className="hero-actions">
            <Link href="/blog" className="glow-button">
              浏览文章
            </Link>
            <Link href="/about" className="secondary-button">
              了解更多
            </Link>
          </div>
        </div>

        <div className="hero-panel hero-panel--compact">
          <div className="terminal-card terminal-card--compact">
            <div className="terminal-card__topbar">
              <span className="terminal-card__title">workspace://blog-system</span>
              <span className="terminal-card__status">READY</span>
            </div>
            <div className="terminal-card__body">
              <div className="terminal-command">
                <span className="terminal-command__prompt">$</span>
                <span>status --today</span>
              </div>
              <div className="terminal-output">
                <p>· 主题：黑客风 / 文艺风</p>
                <p>· 能力：文章、评论、部署、AI 日报</p>
                <p>· 平台：Next.js · Supabase · Vercel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="section-heading">
          <h2 className="text-2xl font-bold">
            <span className="gradient-text">最新文章</span>
          </h2>
          <Link href="/blog" className="text-purple-400 hover:text-purple-300 transition">
            查看全部 →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
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
                {post.excerpt || `${post.content.slice(0, 100)}...`}
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
            <div className="text-6xl mb-4">📝</div>
            <p className="text-zinc-500">暂时还没有已发布文章，敬请期待。</p>
          </div>
        )}
      </section>
    </div>
  )
}
