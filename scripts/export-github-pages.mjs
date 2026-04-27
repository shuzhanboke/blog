import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outDir = path.join(projectRoot, 'out')
const siteUrl = 'https://blog.shuzhan.one'
const mainSiteUrl = 'https://blog-system-rose.vercel.app'

async function readEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const pairs = content
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith('#'))
      .map((line) => line.split('='))
      .filter((parts) => parts.length >= 2)
      .map(([key, ...rest]) => [key.trim(), rest.join('=').trim().replace(/^"|"$/g, '')])
    return Object.fromEntries(pairs)
  } catch {
    return {}
  }
}

const localEnv = await readEnvFile(path.join(projectRoot, '.env.local'))
const tempEnv = await readEnvFile(path.join(projectRoot, 'temp.env'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL || tempEnv.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || tempEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function formatDate(dateString) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString))
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

function markdownToHtml(markdown = '') {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let html = ''
  let inList = false
  let inCode = false
  let codeBuffer = []

  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  const flushCode = () => {
    if (inCode) {
      html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`
      inCode = false
      codeBuffer = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line.startsWith('```')) {
      closeList()
      if (inCode) {
        flushCode()
      } else {
        inCode = true
        codeBuffer = []
      }
      continue
    }

    if (inCode) {
      codeBuffer.push(rawLine)
      continue
    }

    if (!line.trim()) {
      closeList()
      continue
    }

    if (/^#{1,3}\s/.test(line)) {
      closeList()
      const level = line.match(/^#+/)[0].length
      html += `<h${level}>${renderInline(line.replace(/^#{1,3}\s/, ''))}</h${level}>`
      continue
    }

    if (/^- /.test(line)) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }
      html += `<li>${renderInline(line.replace(/^- /, ''))}</li>`
      continue
    }

    if (/^> /.test(line)) {
      closeList()
      html += `<blockquote>${renderInline(line.replace(/^> /, ''))}</blockquote>`
      continue
    }

    closeList()
    html += `<p>${renderInline(line)}</p>`
  }

  closeList()
  flushCode()
  return html
}

function extractField(block, field) {
  const singleQuoted = block.match(new RegExp(`${field}:\\s*'([^']*)'`))
  if (singleQuoted) return singleQuoted[1]

  const templateLiteral = block.match(new RegExp(`${field}:\\s*\\\`([\\s\\S]*?)\\\``))
  if (templateLiteral) return templateLiteral[1]

  const nullable = block.match(new RegExp(`${field}:\\s*(null|true|false)`))
  if (nullable) return nullable[1]

  return ''
}

async function readStaticPosts() {
  const file = await fs.readFile(path.join(projectRoot, 'src/lib/static-posts.ts'), 'utf8')
  const match = file.match(/export const staticPosts:[\s\S]*?=\s*\[([\s\S]*?)\]\s*$/)

  if (!match) {
    return []
  }

  const blocks = match[1].match(/\{[\s\S]*?\n\s*\}/g) || []

  return blocks.map((block) => ({
    id: extractField(block, 'id'),
    title: extractField(block, 'title'),
    slug: extractField(block, 'slug'),
    excerpt: extractField(block, 'excerpt'),
    content: extractField(block, 'content'),
    created_at: extractField(block, 'created_at') || '2026-04-18T00:00:00.000Z',
    cover_image: extractField(block, 'cover_image') === 'null' ? null : extractField(block, 'cover_image'),
    published: extractField(block, 'published') !== 'false',
  }))
}

async function fetchPublishedPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, content, created_at, cover_image, published')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch posts from Supabase: ${error.message}`)
  }

  const staticPosts = await readStaticPosts()
  const merged = [...(data || []), ...staticPosts]
  const deduped = new Map()

  for (const post of merged) {
    if (post?.slug) {
      deduped.set(post.slug, post)
    }
  }

  return [...deduped.values()].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
}

function postHref(slug) {
  return `/blog/${slug}.html`
}

function renderShell({ title, description, body }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="stylesheet" href="/assets/site.css" />
    <link rel="canonical" href="${siteUrl}" />
  </head>
  <body>
    <div class="page-shell">
      <header class="site-header">
        <a class="site-logo" href="/">CodeBlog</a>
        <nav class="site-nav">
          <a href="/">首页</a>
          <a href="/blog/">文章</a>
          <a href="/about/">关于</a>
          <a href="${mainSiteUrl}/admin" target="_blank" rel="noreferrer">管理后台</a>
        </nav>
      </header>
      <main class="site-main">
        ${body}
      </main>
      <footer class="site-footer">
        <p>© CodeBlog · GitHub Pages 镜像站 · 由主站内容静态导出</p>
      </footer>
    </div>
  </body>
</html>`
}

function renderIndex(posts) {
  const latest = posts.slice(0, 6)
  return renderShell({
    title: 'CodeBlog | 首页',
    description: '博客镜像站：AI 协作开发、博客系统设计、部署与验证。',
    body: `
      <section class="hero">
        <div class="hero-badge">AI Code Desk Mirror</div>
        <h1>代码改变世界</h1>
        <p>这是主站内容的 GitHub Pages 镜像版本，用于在自定义域名下持续展示当前博客内容。</p>
        <div class="hero-actions">
          <a class="primary-btn" href="/blog/">浏览文章</a>
          <a class="secondary-btn" href="${mainSiteUrl}" target="_blank" rel="noreferrer">访问主站</a>
        </div>
      </section>
      <section class="content-section">
        <div class="section-head">
          <h2>最新文章</h2>
          <a href="/blog/">查看全部 →</a>
        </div>
        <div class="card-grid">
          ${latest
            .map(
              (post) => `
              <article class="post-card">
                <div class="post-meta">${formatDate(post.created_at)}</div>
                <h3><a href="${postHref(post.slug)}">${escapeHtml(post.title)}</a></h3>
                <p>${escapeHtml(post.excerpt || `${String(post.content || '').slice(0, 120)}...`)}</p>
              </article>
            `
            )
            .join('')}
        </div>
      </section>
    `,
  })
}

function renderBlogIndex(posts) {
  return renderShell({
    title: 'CodeBlog | 文章',
    description: '博客文章列表',
    body: `
      <section class="content-section">
        <div class="section-head">
          <h1>博客文章</h1>
          <span>${posts.length} 篇已发布内容</span>
        </div>
        <div class="stack-list">
          ${posts
            .map(
              (post) => `
              <article class="stack-card">
                <div>
                  <div class="post-meta">${formatDate(post.created_at)}</div>
                  <h3><a href="${postHref(post.slug)}">${escapeHtml(post.title)}</a></h3>
                  <p>${escapeHtml(post.excerpt || `${String(post.content || '').slice(0, 180)}...`)}</p>
                </div>
                <a class="read-link" href="${postHref(post.slug)}">阅读全文 →</a>
              </article>
            `
            )
            .join('')}
        </div>
      </section>
    `,
  })
}

function renderAbout() {
  return renderShell({
    title: 'CodeBlog | 关于',
    description: '关于这个博客',
    body: `
      <section class="content-section prose-shell">
        <h1>关于我</h1>
        <p>这是一个围绕 AI 协作开发、博客沉淀与部署验证持续演进的个人博客。</p>
        <p>主站运行在 Vercel，本镜像站发布在 GitHub Pages，用于同步展示当前内容与专题文章。</p>
        <div class="tag-row">
          <span>Next.js</span>
          <span>TypeScript</span>
          <span>Supabase</span>
          <span>Vercel</span>
          <span>GitHub Pages</span>
        </div>
      </section>
    `,
  })
}

function renderPost(post) {
  return renderShell({
    title: `${post.title} | CodeBlog`,
    description: post.excerpt || post.title,
    body: `
      <article class="prose-shell">
        <a class="back-link" href="/blog/">← 返回文章列表</a>
        <div class="post-meta">${formatDate(post.created_at)}</div>
        <h1>${escapeHtml(post.title)}</h1>
        ${markdownToHtml(post.content)}
      </article>
    `,
  })
}

function renderNotFound() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/" />
    <title>Redirecting...</title>
  </head>
  <body>
    <p>正在跳转到首页… <a href="/">点击这里</a></p>
  </body>
</html>`
}

async function writeFile(relativePath, content) {
  const outputPath = path.join(outDir, relativePath)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, content, 'utf8')
}

async function main() {
  const posts = await fetchPublishedPosts()
  const css = await fs.readFile(path.join(projectRoot, 'public/site-mirror.css'), 'utf8')

  await fs.rm(outDir, { recursive: true, force: true })
  await writeFile('index.html', renderIndex(posts))
  await writeFile('blog/index.html', renderBlogIndex(posts))
  await writeFile('about/index.html', renderAbout())
  await writeFile('assets/site.css', css)
  await writeFile('404.html', renderNotFound())
  await writeFile('CNAME', 'blog.shuzhan.one')
  await writeFile('.nojekyll', '')

  for (const post of posts) {
    const html = renderPost(post)
    await writeFile(`blog/${post.slug}.html`, html)
    await writeFile(`blog/${post.slug}/index.html`, html)
  }

  console.log(`Exported ${posts.length} posts to ${outDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
