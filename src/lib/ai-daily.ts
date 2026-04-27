import { slugify } from '@/lib/slugify'

export interface FeedSource {
  name: string
  url: string
  type: 'official_rss' | 'open_rss'
  weight: number
}

export type DigestItemCategory = 'breakthrough' | 'application'

export interface FeedItem {
  source: string
  sourceType: FeedSource['type']
  title: string
  link: string
  publishedAt: string
  description: string
  weight: number
  category: DigestItemCategory
  score: number
  matchedSignals: string[]
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

const MAX_DESCRIPTION_LENGTH = 180
const LOOKBACK_HOURS = 24 * 10
const TARGET_ITEMS = 10
const MIN_APPLICATION_ITEMS = 3
const MAX_HIGHLIGHTS = 3

const APPLICATION_KEYWORDS = [
  'customer',
  'customers',
  'case study',
  'use case',
  'workflow',
  'workflows',
  'production',
  'deployed',
  'deployment',
  'enterprise',
  'business',
  'team',
  'company',
  'companies',
  'organization',
  'hospital',
  'bank',
  'factory',
  'retail',
  'education',
  'developer story',
  'built with',
  'how ',
  'using ',
  'used by',
  'real-world',
  '应用',
  '案例',
  '落地',
  '部署',
  '客户',
  '企业',
  '医院',
  '银行',
  '工厂',
  '教育',
  '生产',
]

const BREAKTHROUGH_KEYWORDS = [
  'introducing',
  'introduce',
  'launch',
  'launched',
  'release',
  'released',
  'new model',
  'new models',
  'breakthrough',
  'state-of-the-art',
  'sota',
  'benchmark',
  'paper',
  'research',
  'study',
  'advances',
  'advancing',
  'frontier',
  'reasoning',
  'multimodal',
  'robotics',
  'science',
  'drug discovery',
  'agent',
  'agents',
  'inference',
  'chip',
  'gpu',
  'framework',
  'open source',
  '推出',
  '发布',
  '开源',
  '升级',
  '突破',
  '研究',
  '论文',
  '模型',
  '推理',
  '智能体',
  '多模态',
  '机器人',
]

const THEME_KEYWORDS: Array<{ label: string; keywords: string[] }> = [
  { label: '智能体', keywords: ['agent', 'agents', 'assistant', 'workflow', '智能体', '代理'] },
  { label: '多模态', keywords: ['multimodal', 'vision', 'video', 'image', 'audio', '多模态', '视觉'] },
  { label: '企业落地', keywords: ['enterprise', 'customer', 'business', 'case study', '企业', '客户', '落地'] },
  { label: '科研突破', keywords: ['research', 'paper', 'benchmark', 'study', '论文', '研究', '突破'] },
  { label: '开发效率', keywords: ['developer', 'coding', 'code', 'copilot', '开发', '编程', '代码'] },
  { label: '基础设施', keywords: ['gpu', 'chip', 'inference', 'infra', 'deployment', '硬件', '推理', '部署'] },
]

export const AI_NEWS_FEEDS: FeedSource[] = [
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml', type: 'official_rss', weight: 10 },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', type: 'official_rss', weight: 9 },
  { name: 'Google Research Blog', url: 'https://research.google/blog/rss/', type: 'official_rss', weight: 9 },
  { name: 'Google DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml', type: 'official_rss', weight: 9 },
  { name: 'Microsoft AI Blog', url: 'https://blogs.microsoft.com/ai/feed/', type: 'official_rss', weight: 8 },
  { name: 'Microsoft Research', url: 'https://www.microsoft.com/en-us/research/feed/', type: 'official_rss', weight: 8 },
  { name: 'NVIDIA Blog', url: 'https://blogs.nvidia.com/feed/', type: 'official_rss', weight: 8 },
  { name: 'AWS Machine Learning Blog', url: 'https://aws.amazon.com/blogs/machine-learning/feed/', type: 'official_rss', weight: 8 },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', type: 'official_rss', weight: 7 },
  { name: 'arXiv cs.AI', url: 'https://rss.arxiv.org/rss/cs.AI', type: 'open_rss', weight: 6 },
  { name: 'arXiv cs.LG', url: 'https://rss.arxiv.org/rss/cs.LG', type: 'open_rss', weight: 6 },
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

function classifyItem(text: string) {
  const normalized = text.toLowerCase()
  const matchedApplicationSignals = APPLICATION_KEYWORDS.filter((keyword) => normalized.includes(keyword.toLowerCase()))
  const matchedBreakthroughSignals = BREAKTHROUGH_KEYWORDS.filter((keyword) => normalized.includes(keyword.toLowerCase()))

  const applicationScore = matchedApplicationSignals.length * 3
  const breakthroughScore = matchedBreakthroughSignals.length * 2

  if (applicationScore >= breakthroughScore && matchedApplicationSignals.length > 0) {
    return {
      category: 'application' as const,
      score: applicationScore + breakthroughScore,
      matchedSignals: matchedApplicationSignals.slice(0, 4),
    }
  }

  return {
    category: 'breakthrough' as const,
    score: breakthroughScore + matchedApplicationSignals.length,
    matchedSignals: matchedBreakthroughSignals.slice(0, 4),
  }
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
      const description = stripHtml(rawDescription).slice(0, MAX_DESCRIPTION_LENGTH)
      const classification = classifyItem(`${title} ${description}`)

      return {
        source: source.name,
        sourceType: source.type,
        title,
        link,
        publishedAt,
        description,
        weight: source.weight,
        category: classification.category,
        score: classification.score + source.weight,
        matchedSignals: classification.matchedSignals,
      } satisfies FeedItem
    })
    .filter((item) => item.title && item.link && item.publishedAt)
}

async function fetchFeed(source: FeedSource) {
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'CodeBlog-Daily-AI-News/2.0 (+https://blog-system-rose.vercel.app)',
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

function formatPublishedAt(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function buildExcerpt(items: FeedItem[], dateLabel: string) {
  const highlights = items
    .slice(0, MAX_HIGHLIGHTS)
    .map((item) => item.title)
    .join('；')

  return `整理 ${dateLabel} 的 AI 成果、突破与应用案例：${highlights}`.slice(0, 160)
}

function collectThemeLabels(items: FeedItem[]) {
  const scores = new Map<string, number>()

  for (const item of items) {
    const text = `${item.title} ${item.description}`.toLowerCase()
    for (const theme of THEME_KEYWORDS) {
      const matches = theme.keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length
      if (matches > 0) {
        scores.set(theme.label, (scores.get(theme.label) || 0) + matches)
      }
    }
  }

  return Array.from(scores.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label]) => label)
}

function buildSummary(items: FeedItem[]) {
  const breakthroughCount = items.filter((item) => item.category === 'breakthrough').length
  const applicationCount = items.filter((item) => item.category === 'application').length
  const themes = collectThemeLabels(items)
  const topSources = Array.from(new Set(items.slice(0, 5).map((item) => item.source))).slice(0, 3)
  const leadItem = items[0]

  const lines = [
    `- 今天共筛出 ${items.length} 条值得关注的动态，其中成果与突破 ${breakthroughCount} 条，应用案例 ${applicationCount} 条。`,
    `- 重点主题集中在${themes.length > 0 ? `：${themes.join('、')}。` : '：模型升级、研究进展与企业落地。'}`,
    `- 代表性信号主要来自 ${topSources.join('、')}，说明官方产品发布、研究博客和产业博客仍是最稳定的一手来源。`,
    `- 如果只追一条主线，建议优先看《${leadItem.title}》对应的原文，再沿着同主题继续追踪上下游应用。`,
  ]

  return `## 今日总结\n\n${lines.join('\n')}`
}

function buildMarkdown(items: FeedItem[], generatedAt: Date) {
  const generatedAtLabel = formatDigestDateTime(generatedAt)
  const breakthroughs = items.filter((item) => item.category === 'breakthrough')
  const applications = items.filter((item) => item.category === 'application')

  const renderList = (list: FeedItem[]) =>
    list
      .map((item, index) => {
        const summary = item.description ? `：${item.description}` : ''
        return `${index + 1}. **${item.title}**｜${item.source}｜${formatPublishedAt(item.publishedAt)}${summary} [原文链接](${item.link})`
      })
      .join('\n')

  return `# 每日 AI 大事

> 生成时间：${generatedAtLabel}（Asia/Shanghai）
> 筛选标准：仅保留 AI 成果、关键突破与真实应用案例；只使用官方公开 RSS 或开放 RSS；正文只保留标题、摘要与原文链接。

## 本期规则

- 至少整理 ${TARGET_ITEMS} 条动态
- 必须同时覆盖“成果与突破”以及“应用案例”
- 应用案例不少于 ${MIN_APPLICATION_ITEMS} 条
- 优先收录模型发布、研究突破、产品升级、企业落地、行业案例

## 成果与突破

${renderList(breakthroughs)}

## 应用案例

${renderList(applications)}

${buildSummary(items)}

## 采集合规说明

- 本文只整理公开 feed 中的标题、摘要和原文链接
- 不抓取付费墙内容，不转载全文
- 如来源条款变化，应及时下线或切换该来源
- 涉及判断与结论时，应以原文公告为准`
}

function pickDigestItems(items: FeedItem[]) {
  const applications = items.filter((item) => item.category === 'application')
  const breakthroughs = items.filter((item) => item.category === 'breakthrough')

  const selected: FeedItem[] = []
  const seen = new Set<string>()

  const pushIfNeeded = (item: FeedItem) => {
    const key = `${item.title}::${item.link}`
    if (!seen.has(key) && selected.length < TARGET_ITEMS) {
      selected.push(item)
      seen.add(key)
    }
  }

  applications.slice(0, MIN_APPLICATION_ITEMS).forEach(pushIfNeeded)
  breakthroughs.slice(0, TARGET_ITEMS).forEach(pushIfNeeded)
  applications.slice(MIN_APPLICATION_ITEMS).forEach(pushIfNeeded)
  items.forEach(pushIfNeeded)

  if (selected.length < TARGET_ITEMS) {
    throw new Error(`Qualified AI digest items are fewer than ${TARGET_ITEMS}.`)
  }

  return selected
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, TARGET_ITEMS)
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

  const lookbackMs = 1000 * 60 * 60 * LOOKBACK_HOURS
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
    if (!existing || existing.score < item.score) {
      deduped.set(key, item)
    }
  }

  const ranked = Array.from(deduped.values()).sort((left, right) => {
    if (left.score !== right.score) {
      return right.score - left.score
    }

    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  })

  return { items: pickDigestItems(ranked), sourceRuns }
}

export async function buildDailyAiDigest(
  now = new Date(),
  publish = true
): Promise<DailyAiDigestBuildResult> {
  const { items, sourceRuns } = await collectDailyAiNews(now)
  const dateLabel = formatDigestDate(now)
  const slug = slugify(`daily-ai-${dateLabel}`)

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
