import { slugify } from '@/lib/slugify'

export interface FeedSource {
  name: string
  url: string
  type: 'official_rss' | 'open_rss'
  weight: number
}

export interface FeedItem {
  source: string
  sourceType: FeedSource['type']
  title: string
  link: string
  publishedAt: string
  description: string
  weight: number
}

export interface FeedRunResult {
  source: string
  sourceType: FeedSource['type']
  status: 'success' | 'error'
  itemCount: number
  error?: string
}

export interface DailyAiDigest {
  title: string
  slug: string
  excerpt: string
  content: string
  published: boolean
}

export interface DailyAiDigestBuildResult {
  digest: DailyAiDigest
  items: FeedItem[]
  sourceRuns: FeedRunResult[]
}

const MAX_DESCRIPTION_LENGTH = 140
const MAX_ITEMS = 12
const MAX_HIGHLIGHTS = 3

export const AI_NEWS_FEEDS: FeedSource[] = [
  {
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    type: 'official_rss',
    weight: 10,
  },
  {
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    type: 'official_rss',
    weight: 9,
  },
  {
    name: 'Microsoft AI Blog',
    url: 'https://blogs.microsoft.com/ai/feed/',
    type: 'official_rss',
    weight: 8,
  },
  {
    name: 'arXiv cs.AI',
    url: 'https://rss.arxiv.org/rss/cs.AI',
    type: 'open_rss',
    weight: 6,
  },
]

function decodeHtmlEntities(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripHtml(text: string) {
  return decodeHtmlEntities(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTag(xml: string, tagName: string) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  return xml.match(regex)?.[1]?.trim() || ''
}

function parseRssItems(xml: string, source: FeedSource) {
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || []

  return itemBlocks
    .map((block) => {
      const title = stripHtml(extractTag(block, 'title'))
      const link = extractTag(block, 'link')
      const rawDescription =
        extractTag(block, 'description') ||
        extractTag(block, 'content:encoded') ||
        extractTag(block, 'content')
      const publishedAt =
        extractTag(block, 'pubDate') || extractTag(block, 'dc:date') || extractTag(block, 'published')

      return {
        source: source.name,
        sourceType: source.type,
        title,
        link,
        publishedAt,
        description: stripHtml(rawDescription).slice(0, MAX_DESCRIPTION_LENGTH),
        weight: source.weight,
      } satisfies FeedItem
    })
    .filter((item) => item.title && item.link && item.publishedAt)
}

async function fetchFeed(source: FeedSource) {
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'CodeBlog-Daily-AI-News/1.0 (+https://blog-system-rose.vercel.app)',
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`${source.name} feed request failed: ${response.status}`)
  }

  const xml = await response.text()
  return parseRssItems(xml, source)
}

function normalizeUrl(url: string) {
  try {
    const target = new URL(url)
    target.hash = ''
    return target.toString()
  } catch {
    return url
  }
}

function formatDigestDate(targetDate: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(targetDate)
    .replace(/\//g, '-')
}

function formatDigestDateTime(targetDate: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(targetDate)
}

function buildExcerpt(items: FeedItem[], dateLabel: string) {
  const highlights = items
    .slice(0, MAX_HIGHLIGHTS)
    .map((item) => item.title)
    .join('；')

  return `整理 ${dateLabel} 的 AI 最新动态：${highlights}`.slice(0, 160)
}

function buildMarkdown(items: FeedItem[], generatedAt: Date) {
  const generatedAtLabel = formatDigestDateTime(generatedAt)
  const grouped = new Map<string, FeedItem[]>()

  for (const item of items) {
    const list = grouped.get(item.source) || []
    list.push(item)
    grouped.set(item.source, list)
  }

  const sections = Array.from(grouped.entries())
    .map(([sourceName, sourceItems]) => {
      const lines = sourceItems.map((item) => {
        const published = new Intl.DateTimeFormat('zh-CN', {
          timeZone: 'Asia/Shanghai',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(item.publishedAt))

        const summary = item.description ? `：${item.description}` : ''
        return `- **${item.title}**（${published}）${summary} [原文链接](${item.link})`
      })

      return `## ${sourceName}\n\n${lines.join('\n')}`
    })
    .join('\n\n')

  return `# 每日 AI 大事\n
> 生成时间：${generatedAtLabel}（Asia/Shanghai）  
> 采集原则：仅使用官方 / 开放 RSS 源，保留标题、原文链接与极短摘要，不转载全文。

## 今日摘要

- 共收录 ${items.length} 条 AI 动态
- 来源限定为官方新闻源、开放学术源
- 推荐将本文作为线索入口，点击原文查看完整上下文

${sections}

## 采集合规说明

- 本文只整理标题、链接、公开 feed 中的简短描述
- 不抓取付费墙内容，不转载整篇文章
- 如来源条款变更，应及时下线或切换该源
- 涉及判断与结论时，应以原文公告为准
`
}

export async function collectDailyAiNews(now = new Date()) {
  const sourceRuns: FeedRunResult[] = []
  const allItems: FeedItem[] = []

  for (const source of AI_NEWS_FEEDS) {
    try {
      const items = await fetchFeed(source)
      allItems.push(...items)
      sourceRuns.push({
        source: source.name,
        sourceType: source.type,
        status: 'success',
        itemCount: items.length,
      })
    } catch (error) {
      sourceRuns.push({
        source: source.name,
        sourceType: source.type,
        status: 'error',
        itemCount: 0,
        error: String(error),
      })
    }
  }

  const lookbackMs = 1000 * 60 * 60 * 72
  const deduped = new Map<string, FeedItem>()

  for (const item of allItems) {
    const publishedAtMs = new Date(item.publishedAt).getTime()
    if (!Number.isFinite(publishedAtMs)) {
      continue
    }

    if (now.getTime() - publishedAtMs > lookbackMs) {
      continue
    }

    const key = `${normalizeUrl(item.link)}::${item.title.toLowerCase()}`
    const existing = deduped.get(key)
    if (!existing || existing.weight < item.weight) {
      deduped.set(key, item)
    }
  }

  const items = Array.from(deduped.values())
    .sort((left, right) => {
      if (left.weight !== right.weight) {
        return right.weight - left.weight
      }

      return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
    })
    .slice(0, MAX_ITEMS)

  return { items, sourceRuns }
}

export async function buildDailyAiDigest(
  now = new Date(),
  publish = true
): Promise<DailyAiDigestBuildResult> {
  const { items, sourceRuns } = await collectDailyAiNews(now)
  const dateLabel = formatDigestDate(now)
  const slug = slugify(`daily-ai-${dateLabel}`)

  if (items.length === 0) {
    throw new Error('No AI news items collected from legal feeds.')
  }

  return {
    digest: {
      title: `每日 AI 大事：${dateLabel}`,
      slug,
      excerpt: buildExcerpt(items, dateLabel),
      content: buildMarkdown(items, now),
      published: publish,
    },
    items,
    sourceRuns,
  }
}
