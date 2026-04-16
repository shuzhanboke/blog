'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, LogOut } from 'lucide-react'
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
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">后台管理</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/new"
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <Plus size={20} />
            新建文章
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            <LogOut size={20} />
            退出
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">标题</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="px-6 py-4">
                  <Link href={`/blog/${post.slug}`} className="text-primary-600 hover:underline">
                    {post.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleTogglePublish(post.id, post.published)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      post.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {post.published ? '已发布' : '草稿'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(post.created_at), 'PPP', { locale: zhCN })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/edit/${post.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
          <div className="text-center py-12 text-gray-500">
            暂无文章，点击"新建文章"开始创作
          </div>
        )}
      </div>
    </div>
  )
}
