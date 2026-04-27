'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Plus,
  Edit,
  Trash2,
  LogOut,
  Eye,
  MessageSquare,
  Database,
  Rocket,
  RefreshCw,
  ExternalLink,
  Copy,
  FileText,
  Heart,
  CalendarDays,
  Clock3,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Post {
  id: string
  title: string
  slug: string
  published: boolean
  created_at: string
}

interface CommentRecord {
  id: string
  author_name: string
  content: string
  created_at: string
  post_id: string | null
  posts?: {
    title: string
    slug: string
  } | Array<{
    title: string
    slug: string
  }> | null
}

interface LikeRecord {
  id: string
  post_id: string | null
  created_at: string
}

interface PageRecord {
  id: string
  title: string
  slug: string
  published: boolean
  created_at: string
}

interface DigestRun {
  id: string
  run_date: string
  status: 'running' | 'success' | 'error'
  mode: 'publish' | 'draft'
  trigger_type: 'cron' | 'manual'
  triggered_by: string | null
  item_count: number
  post_slug: string | null
  error_message: string | null
  source_results:
    | Array<{
        source: string
        status: 'success' | 'error'
        itemCount: number
        error?: string
      }>
    | null
  started_at: string
  finished_at: string | null
  created_at: string
}

interface DashboardWarnings {
  posts?: string
  comments?: string
  likes?: string
  pages?: string
  runs?: string
}

type AdminTab = 'posts' | 'comments' | 'database' | 'deploy'

const tabs: Array<{ id: AdminTab; label: string; icon: typeof FileText }> = [
  { id: 'posts', label: '文章', icon: FileText },
  { id: 'comments', label: '评论', icon: MessageSquare },
  { id: 'database', label: '数据库', icon: Database },
  { id: 'deploy', label: '部署器', icon: Rocket },
]

const productionUrl = 'https://blog-system-rose.vercel.app'
const vercelProjectUrl = 'https://vercel.com/shuzhans-projects-3d12bc82/blog-system'

function getSupabaseDashboardUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return ''

  try {
    const hostname = new URL(supabaseUrl).hostname
    const projectRef = hostname.split('.')[0]
    return `https://supabase.com/dashboard/project/${projectRef}`
  } catch {
    return ''
  }
}

function isMissingRelationError(message: string) {
  const text = message.toLowerCase()
  return text.includes('does not exist') || text.includes('could not find') || text.includes('relation')
}

function todayDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [likes, setLikes] = useState<LikeRecord[]>([])
  const [pages, setPages] = useState<PageRecord[]>([])
  const [digestRuns, setDigestRuns] = useState<DigestRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState<DashboardWarnings>({})
  const [busyAction, setBusyAction] = useState('')
  const [commentKeyword, setCommentKeyword] = useState('')
  const [commentDeleteError, setCommentDeleteError] = useState('')
  const [copiedText, setCopiedText] = useState('')
  const [digestStatus, setDigestStatus] = useState('')
  const [digestDate, setDigestDate] = useState(todayDateString())
  const [digestMode, setDigestMode] = useState<'publish' | 'draft'>('publish')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/admin/login')
      return
    }

    await fetchDashboardData()
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    setWarnings({})

    try {
      const [postsResult, commentsResult, likesResult, pagesResult, digestRunsResult] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase
          .from('comments')
          .select('id, author_name, content, created_at, post_id, posts(title, slug)')
          .order('created_at', { ascending: false }),
        supabase.from('likes').select('id, post_id, created_at').order('created_at', { ascending: false }),
        supabase.from('pages').select('id, title, slug, published, created_at').order('created_at', { ascending: false }),
        supabase.from('ai_digest_runs').select('*').order('created_at', { ascending: false }).limit(20),
      ])

      const nextWarnings: DashboardWarnings = {}

      if (postsResult.error) {
        const fallbackPosts = await supabase
          .from('posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })

        if (fallbackPosts.error) {
          nextWarnings.posts = '文章表读取受限，请为 posts 补充 authenticated select policy。'
          setPosts([])
        } else {
          nextWarnings.posts = '当前只加载到已发布文章；如需管理草稿，请补充 posts 的 authenticated select policy。'
          setPosts((fallbackPosts.data || []) as Post[])
        }
      } else {
        setPosts((postsResult.data || []) as Post[])
      }

      if (commentsResult.error) {
        const fallbackComments = await supabase
          .from('comments')
          .select('id, author_name, content, created_at, post_id')
          .order('created_at', { ascending: false })

        if (fallbackComments.error) {
          nextWarnings.comments = '评论表读取失败，请检查 comments 表策略。'
          setComments([])
        } else {
          nextWarnings.comments = '评论已加载，但当前无法关联文章标题。'
          setComments((fallbackComments.data || []) as CommentRecord[])
        }
      } else {
        setComments((commentsResult.data || []) as CommentRecord[])
      }

      if (likesResult.error) {
        nextWarnings.likes = '点赞表读取受限，数据库概览中已跳过 likes。'
        setLikes([])
      } else {
        setLikes((likesResult.data || []) as LikeRecord[])
      }

      if (pagesResult.error) {
        if (!isMissingRelationError(pagesResult.error.message)) {
          nextWarnings.pages = '页面表读取受限，数据库概览中已跳过 pages。'
        }
        setPages([])
      } else {
        setPages((pagesResult.data || []) as PageRecord[])
      }

      if (digestRunsResult.error) {
        if (!isMissingRelationError(digestRunsResult.error.message)) {
          nextWarnings.runs = 'AI 日报运行记录读取失败，请先同步 `ai_digest_runs` 表结构与策略。'
        }
        setDigestRuns([])
      } else {
        setDigestRuns((digestRunsResult.data || []) as DigestRun[])
      }

      setWarnings(nextWarnings)
    } catch (fetchError) {
      console.error('Error fetching admin dashboard data:', fetchError)
      setError('后台数据加载失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return
    setBusyAction(`delete-post-${id}`)
    try {
      const { error: deleteError } = await supabase.from('posts').delete().eq('id', id)
      if (deleteError) throw deleteError
      await fetchDashboardData()
    } catch (deletePostError) {
      console.error('Error deleting post:', deletePostError)
      alert('删除文章失败，请检查数据库策略。')
    } finally {
      setBusyAction('')
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setBusyAction(`toggle-post-${id}`)
    try {
      const { error: updateError } = await supabase.from('posts').update({ published: !currentStatus }).eq('id', id)
      if (updateError) throw updateError
      await fetchDashboardData()
    } catch (toggleError) {
      console.error('Error toggling post status:', toggleError)
      alert('切换文章状态失败，请检查数据库策略。')
    } finally {
      setBusyAction('')
    }
  }

  const handleDeleteComment = async (id: string) => {
    if (!confirm('确定要删除这条评论吗？')) return
    setBusyAction(`delete-comment-${id}`)
    setCommentDeleteError('')
    try {
      const { error: deleteError } = await supabase.from('comments').delete().eq('id', id)
      if (deleteError) throw deleteError
      await fetchDashboardData()
    } catch (deleteCommentError) {
      console.error('Error deleting comment:', deleteCommentError)
      setCommentDeleteError('删除评论失败。请先为 `comments` 表补充 authenticated delete policy。')
    } finally {
      setBusyAction('')
    }
  }

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedText(label)
      window.setTimeout(() => setCopiedText(''), 1800)
    } catch (copyError) {
      console.error('Copy failed:', copyError)
      alert('复制失败，请手动复制。')
    }
  }

  const handlePublishDailyDigest = async () => {
    setBusyAction('publish-digest')
    setDigestStatus('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('当前管理员会话失效，请重新登录后再试。')
      }

      const response = await fetch('/api/cron/ai-daily', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: digestDate,
          mode: digestMode,
        }),
      })

      const result = (await response.json()) as {
        success: boolean
        slug?: string
        mode?: 'publish' | 'draft'
        itemCount?: number
        error?: string
      }

      if (!response.ok || !result.success || !result.slug) {
        throw new Error(result.error || '触发 AI 日报失败。')
      }

      setDigestStatus(
        `已生成：${result.slug} · 模式：${result.mode === 'draft' ? '草稿' : '发布'} · 收录 ${result.itemCount || 0} 条`
      )
      await fetchDashboardData()
    } catch (publishError) {
      console.error('Error publishing daily digest:', publishError)
      setDigestStatus(String(publishError))
    } finally {
      setBusyAction('')
    }
  }

  const getCommentPostMeta = (comment: CommentRecord) => {
    if (!comment.posts) return null
    return Array.isArray(comment.posts) ? comment.posts[0] || null : comment.posts
  }

  const filteredComments = useMemo(() => {
    const keyword = commentKeyword.trim().toLowerCase()
    if (!keyword) return comments

    return comments.filter((comment) => {
      const target = [comment.author_name, comment.content, getCommentPostMeta(comment)?.title || '']
        .join(' ')
        .toLowerCase()
      return target.includes(keyword)
    })
  }, [commentKeyword, comments])

  const publishedPostsCount = posts.filter((post) => post.published).length
  const draftPostsCount = posts.length - publishedPostsCount
  const supabaseDashboardUrl = getSupabaseDashboardUrl()
  const digestPosts = posts.filter((post) => post.slug.startsWith('daily-ai-')).slice(0, 5)
  const latestDigest = digestPosts[0] || null
  const latestRun = digestRuns[0] || null
  const latestCronRun = digestRuns.find((run) => run.trigger_type === 'cron') || null

  const deployCommands = [
    { label: '生产构建', value: 'npm run build' },
    { label: '生产部署', value: 'vercel deploy --prod --yes' },
    { label: '查看部署', value: 'vercel inspect blog-system-rose.vercel.app' },
    {
      label: '同步工作副本',
      value: 'robocopy d:\\logs\\opencodelog\\blog-system C:\\Users\\Lin\\blog-system /E /XD .git node_modules .next .vercel',
    },
  ]

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">后台管理</span>
          </h1>
          <p className="mt-2 text-zinc-400">现在可以统一管理文章、评论、数据库概览和部署工作流。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePublishDailyDigest}
            disabled={busyAction === 'publish-digest'}
            className="flex items-center gap-2 glow-button disabled:opacity-60"
          >
            <Rocket size={18} />
            {busyAction === 'publish-digest' ? '抓取发布中...' : '自动抓取并发布 AI 日报'}
          </button>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:border-purple-500/50 text-zinc-300 transition"
          >
            <RefreshCw size={18} />
            刷新数据
          </button>
          <Link href="/admin/new" className="flex items-center gap-2 glow-button">
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

      {error && <div className="glass-card p-4 border border-red-500/40 text-red-300">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">文章总数</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">{posts.length}</p>
          <p className="mt-2 text-sm text-zinc-400">已发布 {publishedPostsCount} · 草稿 {draftPostsCount}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">评论总数</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">{comments.length}</p>
          <p className="mt-2 text-sm text-zinc-400">可在后台筛选、查看、删除评论</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">点赞总数</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">{likes.length}</p>
          <p className="mt-2 text-sm text-zinc-400">当前点赞数据来自 `likes` 表</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">日报运行记录</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-100">{digestRuns.length}</p>
          <p className="mt-2 text-sm text-zinc-400">可查看抓取日志、结果与最近执行状态</p>
        </div>
      </div>

      {Object.values(warnings).length > 0 && (
        <div className="glass-card p-4 border border-amber-500/30 text-amber-100">
          <p className="font-medium">后台已部分降级加载</p>
          <div className="mt-2 space-y-1 text-sm text-amber-200/90">
            {warnings.posts && <p>- {warnings.posts}</p>}
            {warnings.comments && <p>- {warnings.comments}</p>}
            {warnings.likes && <p>- {warnings.likes}</p>}
            {warnings.pages && <p>- {warnings.pages}</p>}
            {warnings.runs && <p>- {warnings.runs}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">AI 自动抓取与发布</h2>
              <p className="mt-2 text-sm text-zinc-400">
                支持指定日期重生成、草稿/发布切换，并记录每次抓取来源、成功/失败原因。
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <label className="rounded-xl border border-zinc-800 px-4 py-3">
                <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  <CalendarDays size={14} />
                  目标日期
                </span>
                <input
                  type="date"
                  value={digestDate}
                  onChange={(event) => setDigestDate(event.target.value)}
                  className="w-full bg-transparent text-zinc-100 focus:outline-none"
                />
              </label>
              <label className="rounded-xl border border-zinc-800 px-4 py-3">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-500">生成模式</span>
                <select
                  value={digestMode}
                  onChange={(event) => setDigestMode(event.target.value as 'publish' | 'draft')}
                  className="w-full bg-transparent text-zinc-100 focus:outline-none"
                >
                  <option value="publish">直接发布</option>
                  <option value="draft">生成草稿</option>
                </select>
              </label>
              <button
                type="button"
                onClick={handlePublishDailyDigest}
                disabled={busyAction === 'publish-digest'}
                className="glow-button disabled:opacity-60"
              >
                {busyAction === 'publish-digest' ? '执行中...' : '立即执行'}
              </button>
            </div>
          </div>
          {digestStatus && <p className="mt-4 text-sm text-zinc-300">{digestStatus}</p>}
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">快捷入口</p>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setActiveTab('deploy')}
              className="w-full rounded-xl border border-zinc-800 px-4 py-3 text-left text-zinc-300 hover:border-purple-500/40 transition"
            >
              打开部署器
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className="w-full rounded-xl border border-zinc-800 px-4 py-3 text-left text-zinc-300 hover:border-purple-500/40 transition"
            >
              打开数据库概览
            </button>
            <button
              type="button"
              onClick={() => handleCopy('/api/cron/ai-daily', 'AI 日报接口')}
              className="w-full rounded-xl border border-zinc-800 px-4 py-3 text-left text-zinc-300 hover:border-purple-500/40 transition"
            >
              复制 AI 日报接口
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">最近一次 AI 日报</p>
          {latestDigest ? (
            <>
              <p className="mt-3 text-lg font-semibold text-zinc-100">{latestDigest.title}</p>
              <p className="mt-2 text-sm text-zinc-400">
                {format(new Date(latestDigest.created_at), 'PPP p', { locale: zhCN })}
              </p>
              <Link
                href={`/blog/${latestDigest.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                查看专题 <Eye size={14} />
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">还没有生成过 AI 日报，点击上方按钮即可创建第一篇。</p>
          )}
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">最近一次运行</p>
          {latestRun ? (
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p>- 状态：{latestRun.status === 'success' ? '成功' : latestRun.status === 'error' ? '失败' : '运行中'}</p>
              <p>- 模式：{latestRun.mode === 'draft' ? '草稿' : '发布'}</p>
              <p>- 日期：{latestRun.run_date}</p>
              <p>- 收录：{latestRun.item_count} 条</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">暂无运行记录。</p>
          )}
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">定时任务状态</p>
          {latestCronRun ? (
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p>- 最近 cron：{latestCronRun.status === 'success' ? '成功' : '失败'}</p>
              <p>- 时间：{format(new Date(latestCronRun.created_at), 'PPP p', { locale: zhCN })}</p>
              <p>- 文章：{latestCronRun.post_slug || '未写入'}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">还没有成功记录到 cron 运行状态。</p>
          )}
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-zinc-500">自动化说明</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            <p>- 手动触发：已可用</p>
            <p>- 指定日期：已可用</p>
            <p>- 草稿模式：已可用</p>
            <p>- 定时发布：需配置 `SUPABASE_SERVICE_ROLE_KEY`</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-100">最近 5 篇日报</h2>
            <Clock3 size={16} className="text-zinc-500" />
          </div>
          <div className="mt-4 space-y-3">
            {digestPosts.length > 0 ? (
              digestPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 hover:border-purple-500/40 transition"
                >
                  <p className="font-medium text-zinc-100">{post.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {format(new Date(post.created_at), 'PPP', { locale: zhCN })}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-400">暂无 AI 日报历史。</p>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-100">抓取日志面板</h2>
            <span className="text-sm text-zinc-500">最近 10 次</span>
          </div>
          <div className="mt-4 space-y-4">
            {digestRuns.slice(0, 10).map((run) => (
              <div key={run.id} className="rounded-2xl border border-zinc-800 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-zinc-100">
                      {run.run_date} · {run.mode === 'draft' ? '草稿' : '发布'} ·{' '}
                      {run.status === 'success' ? '成功' : run.status === 'error' ? '失败' : '运行中'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {format(new Date(run.created_at), 'PPP p', { locale: zhCN })} · {run.trigger_type === 'cron' ? 'cron' : '手动'}
                      {run.triggered_by ? ` · ${run.triggered_by}` : ''}
                    </p>
                  </div>
                  {run.post_slug && (
                    <Link href={`/blog/${run.post_slug}`} className="text-sm text-purple-400 hover:text-purple-300">
                      查看文章
                    </Link>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-sm text-zinc-300">
                  <p>收录条数：{run.item_count}</p>
                  {run.error_message && <p className="text-red-300">失败原因：{run.error_message}</p>}
                  {(run.source_results || []).map((source) => (
                    <p key={`${run.id}-${source.source}`}>
                      - {source.source}：{source.status === 'success' ? `成功（${source.itemCount}）` : `失败（${source.error || '未知错误'}）`}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {digestRuns.length === 0 && <p className="text-sm text-zinc-400">暂无抓取日志。</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition ${
                active
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-zinc-900/70 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'posts' && (
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
                      disabled={busyAction === `toggle-post-${post.id}`}
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
                        onClick={() => handleDeletePost(post.id)}
                        disabled={busyAction === `delete-post-${post.id}`}
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
          {posts.length === 0 && <div className="text-center py-12 text-zinc-500">暂无文章，点击“新建文章”开始创作。</div>}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="glass-card p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">评论管理</h2>
              <p className="mt-2 text-sm text-zinc-400">支持按作者、内容、文章标题搜索；可直接删除不需要的评论。</p>
            </div>
            <input
              type="text"
              value={commentKeyword}
              onChange={(event) => setCommentKeyword(event.target.value)}
              placeholder="搜索评论 / 作者 / 文章"
              className="w-full lg:w-80 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-purple-500 focus:outline-none transition"
            />
          </div>

          {commentDeleteError && (
            <div className="glass-card p-4 border border-amber-500/40 text-amber-200">{commentDeleteError}</div>
          )}

          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">评论内容</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">作者</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">所属文章</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">时间</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-zinc-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredComments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-6 py-4 text-sm text-zinc-300 max-w-xl">
                      <div className="line-clamp-2">{comment.content}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{comment.author_name}</td>
                    <td className="px-6 py-4 text-sm">
                      {getCommentPostMeta(comment)?.slug ? (
                        <Link
                          href={`/blog/${getCommentPostMeta(comment)?.slug}`}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          {getCommentPostMeta(comment)?.title}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">已失联文章</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {format(new Date(comment.created_at), 'PPP p', { locale: zhCN })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={busyAction === `delete-comment-${comment.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition"
                      >
                        <Trash2 size={16} />
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredComments.length === 0 && <div className="text-center py-12 text-zinc-500">没有匹配的评论记录。</div>}
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <FileText size={16} />
                `posts`
              </div>
              <p className="mt-3 text-3xl font-semibold">{posts.length}</p>
              <p className="mt-2 text-sm text-zinc-500">文章主表，当前后台可直接维护。</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <MessageSquare size={16} />
                `comments`
              </div>
              <p className="mt-3 text-3xl font-semibold">{comments.length}</p>
              <p className="mt-2 text-sm text-zinc-500">评论可直接审核、删除。</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <Heart size={16} />
                `likes`
              </div>
              <p className="mt-3 text-3xl font-semibold">{likes.length}</p>
              <p className="mt-2 text-sm text-zinc-500">用于统计文章互动热度。</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <Database size={16} />
                `pages`
              </div>
              <p className="mt-3 text-3xl font-semibold">{pages.length}</p>
              <p className="mt-2 text-sm text-zinc-500">
                {warnings.pages ? '当前未启用独立页面模型。' : '支持扩展独立页面内容模型。'}
              </p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 text-zinc-400">
                <Rocket size={16} />
                `ai_digest_runs`
              </div>
              <p className="mt-3 text-3xl font-semibold">{digestRuns.length}</p>
              <p className="mt-2 text-sm text-zinc-500">日报抓取日志、状态与历史记录。</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">最近评论</h2>
                <span className="text-sm text-zinc-500">前 5 条</span>
              </div>
              <div className="mt-4 space-y-4">
                {comments.slice(0, 5).map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-zinc-800 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-zinc-200">{comment.author_name}</span>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(comment.created_at), 'PP p', { locale: zhCN })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{comment.content}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {getCommentPostMeta(comment)?.title ? `文章：${getCommentPostMeta(comment)?.title}` : '文章：已失联'}
                    </p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-sm text-zinc-500">暂无评论数据。</p>}
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">数据库入口</h2>
                <span className="text-sm text-zinc-500">只读导航</span>
              </div>
              <div className="mt-4 space-y-4">
                <button
                  type="button"
                  onClick={() => handleCopy('supabase/schema.sql', 'schema.sql 路径')}
                  className="w-full flex items-center justify-between rounded-xl border border-zinc-800 p-4 text-left hover:border-purple-500/40 transition"
                >
                  <div>
                    <p className="font-medium text-zinc-200">数据库结构文件</p>
                    <p className="mt-1 text-sm text-zinc-500">可在本地打开并同步到 Supabase SQL Editor</p>
                  </div>
                  <Copy size={16} />
                </button>
                {supabaseDashboardUrl && (
                  <a
                    href={supabaseDashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between rounded-xl border border-zinc-800 p-4 hover:border-purple-500/40 transition"
                  >
                    <div>
                      <p className="font-medium text-zinc-200">打开 Supabase Dashboard</p>
                      <p className="mt-1 text-sm text-zinc-500">查看表、SQL、认证与存储状态</p>
                    </div>
                    <ExternalLink size={16} />
                  </a>
                )}
                <div className="rounded-xl border border-zinc-800 p-4">
                  <p className="font-medium text-zinc-200">建议同步的新表</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    请把 `supabase/schema.sql` 中的 `ai_digest_runs` 同步到线上，抓取日志与 cron 状态才会完整显示。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deploy' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <a
              href={productionUrl}
              target="_blank"
              rel="noreferrer"
              className="glass-card p-5 hover:border-purple-500/40 transition border border-zinc-800"
            >
              <p className="text-sm text-zinc-500">生产站点</p>
              <p className="mt-3 text-lg font-semibold text-zinc-100">blog-system-rose</p>
              <p className="mt-2 text-sm text-zinc-400">{productionUrl}</p>
            </a>
            <a
              href={`${productionUrl}/admin`}
              target="_blank"
              rel="noreferrer"
              className="glass-card p-5 hover:border-purple-500/40 transition border border-zinc-800"
            >
              <p className="text-sm text-zinc-500">后台入口</p>
              <p className="mt-3 text-lg font-semibold text-zinc-100">管理台</p>
              <p className="mt-2 text-sm text-zinc-400">{productionUrl}/admin</p>
            </a>
            <a
              href={vercelProjectUrl}
              target="_blank"
              rel="noreferrer"
              className="glass-card p-5 hover:border-purple-500/40 transition border border-zinc-800"
            >
              <p className="text-sm text-zinc-500">部署平台</p>
              <p className="mt-3 text-lg font-semibold text-zinc-100">Vercel Project</p>
              <p className="mt-2 text-sm text-zinc-400">查看最近部署、日志与别名</p>
            </a>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">部署命令面板</h2>
              {copiedText && <span className="text-sm text-emerald-400">已复制：{copiedText}</span>}
            </div>
            <div className="mt-4 space-y-3">
              {deployCommands.map((command) => (
                <div
                  key={command.label}
                  className="rounded-xl border border-zinc-800 p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{command.label}</p>
                    <p className="mt-1 text-sm text-zinc-500 break-all">{command.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(command.value, command.label)}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-purple-500/40 transition"
                  >
                    <Copy size={16} />
                    复制
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="text-xl font-semibold">部署检查清单</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                '部署前先执行 `npm run build`',
                '部署后检查 `/`、`/blog`、`/about`、`/admin/login`',
                '验证首页包含 `site-backdrop` 与 `theme-toggle`',
                'AI 日报全自动发布需要 `SUPABASE_SERVICE_ROLE_KEY`',
              ].map((item) => (
                <div key={item} className="rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
