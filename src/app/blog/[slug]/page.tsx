'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Heart, MessageCircle, Send, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { getStaticPostBySlug } from '@/lib/static-posts'

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

const getLocalCommentsKey = (slug: string) => `blog_comments_${slug}`
const getLocalLikesKey = (slug: string) => `blog_likes_${slug}`
const getLocalLikeFlagKey = (slug: string) => `blog_liked_${slug}`

export default function BlogPost() {
  const params = useParams()
  const slug = params?.slug as string

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [likesCount, setLikesCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isStaticPost, setIsStaticPost] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchData()
    }
  }, [slug])

  const fetchStaticInteractions = (postSlug: string) => {
    const localComments = localStorage.getItem(getLocalCommentsKey(postSlug))
    const localLikes = localStorage.getItem(getLocalLikesKey(postSlug))
    const localLiked = localStorage.getItem(getLocalLikeFlagKey(postSlug))

    setComments(localComments ? JSON.parse(localComments) : [])
    setLikesCount(localLikes ? Number(localLikes) : 0)
    setHasLiked(localLiked === 'true')
  }

  const generateVisitorId = () => `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

  const fetchData = async () => {
    try {
      const staticPost = getStaticPostBySlug(slug)
      if (staticPost) {
        setPost(staticPost)
        setIsStaticPost(true)
        fetchStaticInteractions(slug)
        return
      }

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (postData) {
        setPost(postData)
        setIsStaticPost(false)

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

  const handleLike = async () => {
    if (!post) return

    if (isStaticPost) {
      const nextHasLiked = !hasLiked
      const nextLikes = nextHasLiked ? likesCount + 1 : Math.max(0, likesCount - 1)
      localStorage.setItem(getLocalLikesKey(slug), String(nextLikes))
      localStorage.setItem(getLocalLikeFlagKey(slug), String(nextHasLiked))
      setLikesCount(nextLikes)
      setHasLiked(nextHasLiked)
      return
    }

    const visitorId = localStorage.getItem('visitor_id') || generateVisitorId()

    if (hasLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('visitor_id', visitorId)
      setLikesCount((prev) => prev - 1)
      setHasLiked(false)
      return
    }

    await supabase.from('likes').insert({
      post_id: post.id,
      visitor_id: visitorId,
    })
    setLikesCount((prev) => prev + 1)
    setHasLiked(true)
  }

  const handleComment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!post || !authorName.trim() || !commentContent.trim()) return

    setSubmitting(true)

    try {
      if (isStaticPost) {
        const nextComment: Comment = {
          id: `local_${Date.now()}`,
          author_name: authorName.trim(),
          content: commentContent.trim(),
          created_at: new Date().toISOString(),
        }

        const nextComments = [...comments, nextComment]
        localStorage.setItem(getLocalCommentsKey(slug), JSON.stringify(nextComments))
        setComments(nextComments)
      } else {
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
          setComments((prev) => [...prev, data])
        }
      }

      setAuthorName('')
      setCommentContent('')
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-zinc-500 mt-4">加载中...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">404</div>
        <p className="text-zinc-500">文章不存在或尚未发布。</p>
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto animate-fade-in">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-purple-400 mb-8 transition"
      >
        <ArrowLeft size={16} />
        返回文章列表
      </Link>

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-text">{post.title}</h1>
        <div className="flex items-center gap-4 text-zinc-500 text-sm">
          <span className="flex items-center gap-2">
            <span>📅</span>
            {format(new Date(post.created_at), 'PPP', { locale: zhCN })}
          </span>
        </div>
      </header>

      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full h-64 object-cover rounded-xl mb-8"
        />
      )}

      <div className="prose prose-invert prose-lg mb-12">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const inline = !match

              if (!inline) {
                return (
                  <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                )
              }

              return (
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

      <div className="flex items-center gap-6 py-6 border-y border-zinc-800 mb-12">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
            hasLiked
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          <Heart className={hasLiked ? 'fill-current' : ''} size={18} />
          <span>{likesCount}</span>
        </button>
        <div className="flex items-center gap-2 text-zinc-400">
          <MessageCircle size={18} />
          <span>{comments.length} 条评论</span>
        </div>
      </div>

      <section className="mb-12">
        <h3 className="text-2xl font-bold mb-6">
          <span className="gradient-text">评论</span>
        </h3>

        {isStaticPost && (
          <div className="glass-card p-4 mb-8 text-zinc-300">
            这篇文章使用本地评论模式，你现在提交的评论会保存在当前浏览器中。
          </div>
        )}

        <form onSubmit={handleComment} className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="你的名字"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition"
            required
          />
          <textarea
            placeholder="写下你的评论..."
            value={commentContent}
            onChange={(event) => setCommentContent(event.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none min-h-[100px] transition"
            required
          />
          <button type="submit" disabled={submitting} className="glow-button flex items-center gap-2">
            <Send size={16} />
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </form>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purple-400">{comment.author_name}</span>
                <span className="text-sm text-zinc-500">
                  {format(new Date(comment.created_at), 'PP', { locale: zhCN })}
                </span>
              </div>
              <p className="text-zinc-300">{comment.content}</p>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <p className="text-center text-zinc-500 py-8">还没有评论，来发表第一条评论吧。</p>
        )}
      </section>
    </article>
  )
}
