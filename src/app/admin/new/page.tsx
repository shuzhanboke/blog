'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'

export default function NewPost() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [published, setPublished] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
    }
  }

  const generateSlug = (text: string) => slugify(text)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('posts').insert({
        title,
        slug,
        content,
        excerpt,
        cover_image: coverImage || null,
        published,
      })

      if (error) throw error

      router.push('/admin')
    } catch (error) {
      console.error('Error creating post:', error)
      alert('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">新建文章</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="glass-card rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition"
              placeholder="输入文章标题"
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
              placeholder="article-slug"
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
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">摘要</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition min-h-[80px]"
              placeholder="文章摘要（可选）"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">内容（Markdown）</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition min-h-[400px] font-mono"
              placeholder="使用 Markdown 编写文章内容..."
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
              <span className="text-sm font-medium">立即发布</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="glow-button disabled:opacity-50">
            {loading ? '保存中...' : '保存文章'}
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
