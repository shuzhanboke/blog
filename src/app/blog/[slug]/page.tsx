'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { supabase } from '@/lib/supabase'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
}

interface Post {
  id: string
  title: string
  content: string
  cover_image: string | null
  created_at: string
}

export default function BlogPost() {
  const params = useParams()
  const slug = params?.slug as string

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [likesCount, setLikesCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [loading, setLoading] = useState(true)

  const [authorName, setAuthorName] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchData()
    }
  }, [slug])

  const fetchData = async () => {
    try {
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (postData) {
        setPost(postData)

        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postData.id)
          .order('created_at', { ascending: true })

        setComments(commentsData || [])

        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postData.id)

        setLikesCount(count || 0)

        const visitorId = localStorage.getItem('visitor_id') || generateVisitorId()
        localStorage.setItem('visitor_id', visitorId)

        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postData.id)
          .eq('visitor_id', visitorId)
          .single()

        setHasLiked(!!userLike)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateVisitorId = () => {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  const handleLike = async () => {
    if (!post) return

    const visitorId = localStorage.getItem('visitor_id') || generateVisitorId()

    if (hasLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('visitor_id', visitorId)

      setLikesCount((prev) => prev - 1)
      setHasLiked(false)
    } else {
      await supabase.from('likes').insert({
        post_id: post.id,
        visitor_id: visitorId,
      })

      setLikesCount((prev) => prev + 1)
      setHasLiked(true)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post || !authorName.trim() || !commentContent.trim()) return

    setSubmitting(true)

    try {
      const { data } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          author_name: authorName.trim(),
          content: commentContent.trim(),
        })
        .select()
        .single()

      if (data) {
        setComments([...comments, data])
        setAuthorName('')
        setCommentContent('')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  if (!post) {
    return <div className="text-center py-12">文章不存在</div>
  }

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="text-gray-500">
          {format(new Date(post.created_at), 'PPP', { locale: zhCN })}
        </div>
      </header>

      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full h-64 object-cover rounded-lg mb-8"
        />
      )}

      <div className="prose prose-lg mb-12">
        <ReactMarkdown
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const inline = !match
              return !inline ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <div className="flex items-center gap-6 py-6 border-t border-b border-gray-200 mb-12">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
            hasLiked
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Heart className={hasLiked ? 'fill-current' : ''} />
          <span>{likesCount} 点赞</span>
        </button>
        <div className="flex items-center gap-2 text-gray-600">
          <MessageCircle />
          <span>{comments.length} 评论</span>
        </div>
      </div>

      <section className="mb-12">
        <h3 className="text-2xl font-bold mb-6">评论</h3>

        <form onSubmit={handleComment} className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="你的名字"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
          <textarea
            placeholder="写下你的评论..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Send size={16} />
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </form>

        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{comment.author_name}</span>
                <span className="text-sm text-gray-500">
                  {format(new Date(comment.created_at), 'PP', { locale: zhCN })}
                </span>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-8">暂无评论，来发表第一条评论吧！</p>
        )}
      </section>
    </article>
  )
}
