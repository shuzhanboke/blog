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
    <div>
      <h1 className="text-4xl font-bold mb-8 text-center">博客文章</h1>
      <div className="space-y-6 max-w-3xl mx-auto">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
          >
            <h2 className="text-2xl font-semibold mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-primary-600">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {post.excerpt || post.content.slice(0, 200) + '...'}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{format(new Date(post.created_at), 'PPP', { locale: zhCN })}</span>
              <Link
                href={`/blog/${post.slug}`}
                className="text-primary-600 hover:underline"
              >
                阅读更多
              </Link>
            </div>
          </article>
        ))}
      </div>
      {posts.length === 0 && (
        <p className="text-center text-gray-500 py-12">暂无文章，敬请期待！</p>
      )}
    </div>
  )
}
