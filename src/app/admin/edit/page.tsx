'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  cover_image: string | null
  published: boolean
}

function EditPostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams?.get('id')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [post, setPost] = useState<Post | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [published, setPublished] = useState(false)

  useEffect(() => {
    if (postId) {
      fetchPost()
    }
  }, [postId])

  const fetchPost = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }

    const { data } = await supabase.from('posts').select('*').eq('id', postId).single()

    if (data) {
      setPost(data)
      setTitle(data.title)
      setSlug(data.slug)
      setContent(data.content)
      setExcerpt(data.excerpt || '')
      setCoverImage(data.cover_image || '')
      setPublished(data.published)
    }
    setLoading(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          slug,
          content,
          excerpt,
          cover_image: coverImage || null,
          published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)

      if (error) throw error

      router.push('/admin')
    } catch (error) {
      console.error('Error updating post:', error)
      alert('更新失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  if (!post) {
    return <div className="text-center py-12">文章不存在。</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">编辑文章</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="glass-card rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                const value = e.target.value
                setTitle(value)
                if (!slug || slug === slugify(title)) {
                  setSlug(slugify(value))
                }
              }}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug（URL 标识）</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">封面图 URL</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">摘要</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">内容（Markdown）</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition min-h-[400px] font-mono"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium">已发布</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="glow-button disabled:opacity-50">
            {saving ? '保存中...' : '保存修改'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="px-6 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 transition"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditPost() {
  return (
    <Suspense fallback={<div className="text-center py-12">加载中...</div>}>
      <EditPostContent />
    </Suspense>
  )
}
