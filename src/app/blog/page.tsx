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

  return data || []
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="animate-fade-in">
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold mb-4">
          <span className="gradient-text">博客文章</span>
        </h1>
        <p className="text-zinc-400">共 {posts.length} 篇文章</p>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="post-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                  <span>📅</span>
                  <time>{format(new Date(post.created_at), 'PPP', { locale: zhCN })}</time>
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-purple-400 transition">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-zinc-400 text-sm line-clamp-2">
                  {post.excerpt || post.content.slice(0, 200) + '...'}
                </p>
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="shrink-0 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition"
              >
                阅读
              </Link>
            </div>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-zinc-500">暂无文章，敬请期待！</p>
        </div>
      )}
    </div>
  )
}