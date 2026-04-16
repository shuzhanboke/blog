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
    <div>
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">欢迎来到我的博客</h1>
        <p className="text-xl text-gray-600 mb-8">分享技术、记录生活、传递价值</p>
        <Link
          href="/blog"
          className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          浏览全部文章
        </Link>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">最新文章</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              {post.cover_image && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary-600">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt || post.content.slice(0, 150) + '...'}
                </p>
                <div className="text-sm text-gray-500">
                  {format(new Date(post.created_at), 'PPP', { locale: zhCN })}
                </div>
              </div>
            </article>
          ))}
        </div>
        {posts.length === 0 && (
          <p className="text-center text-gray-500 py-12">暂无文章，敬请期待！</p>
        )}
      </section>
    </div>
  )
}
