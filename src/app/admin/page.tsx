'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, LogOut, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Post {
  id: string
  title: string
  slug: string
  published: boolean
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/admin/login')
      return
    }

    setUser(user)
    fetchPosts()
  }

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    setPosts(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return

    await supabase.from('posts').delete().eq('id', id)
    fetchPosts()
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('posts')
      .update({ published: !currentStatus })
      .eq('id', id)

    fetchPosts()
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">后台管理</span>
        </h1>
        <div className="flex gap-4">
          <Link
            href="/admin/new"
            className="flex items-center gap-2 glow-button"
          >
            <Plus size={20} />
            新建文章
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-400 transition"
          >
            <LogOut size={20} />
            退出
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">标题</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">状态</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">创建时间</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-zinc-800/30 transition">
                <td className="px-6 py-4">
                  <Link href={`/blog/${post.slug}`} className="text-purple-400 hover:text-purple-300">
                    {post.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleTogglePublish(post.id, post.published)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      post.published
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {post.published ? '已发布' : '草稿'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500">
                  {format(new Date(post.created_at), 'PPP', { locale: zhCN })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="p-2 text-zinc-400 hover:text-purple-400 rounded-lg hover:bg-zinc-800 transition"
                    >
                      <Eye size={18} />
                    </Link>
                    <Link
                      href={`/admin/edit?id=${post.id}`}
                      className="p-2 text-zinc-400 hover:text-blue-400 rounded-lg hover:bg-zinc-800 transition"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            暂无文章，点击"新建文章"开始创作
          </div>
        )}
      </div>
    </div>
  )
}