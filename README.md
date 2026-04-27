# 我的博客系统

一个基于 `Next.js 14 + Supabase + Tailwind CSS + TypeScript` 的动态博客系统，支持文章发布、评论、点赞和后台管理，并部署在 `Vercel`。

## 功能特性
- 首页、文章列表页、文章详情页
- Markdown 文章渲染与代码高亮
- 评论与点赞
- 管理后台登录
- 文章新建、编辑、发布、删除
- 合法来源的 `每日 AI 大事` 自动专题
- Supabase 数据存储与认证

## 技术栈
- **前端**：Next.js 14、React 18、Tailwind CSS、TypeScript
- **后端 / 数据库**：Supabase
- **部署**：Vercel

## 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/shuzhanboke/blog.git
cd blog
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
创建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

如果需要使用导入接口，还需要在部署平台中配置：

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_random_secret
```

### 4. 初始化数据库
在 Supabase SQL Editor 中运行 `supabase/schema.sql`。

### 5. 本地运行
```bash
npm run dev
```

访问 `http://localhost:3000`。

## 管理后台
- 登录入口：`/admin/login`
- 首次使用前，请先在 Supabase Authentication 中创建管理员账号

## 部署
- 生产环境建议使用 `Vercel`
- 请在 Vercel 项目中配置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 如需导入文章或自动发布 AI 日报，再额外配置 `SUPABASE_SERVICE_ROLE_KEY`
- 建议配置 `CRON_SECRET` 保护定时任务接口

## 每日 AI 大事
- 自动发布接口：`/api/cron/ai-daily`
- 推荐由 `Vercel Cron` 每天触发一次
- 后台也支持管理员手动触发一次生成
- 当前只使用合规源：
  - `OpenAI News RSS`
  - `Google AI Blog RSS`
  - `Microsoft AI Blog RSS`
  - `arXiv cs.AI RSS`
- 采集原则：
  - 只保留标题、原文链接、公开 feed 短摘要
  - 不转载全文，不抓取付费墙内容
  - 每日生成一篇 `daily-ai-YYYY-MM-DD` 文章，可在后台二次编辑

## 项目结构
```text
blog/
├── src/app/            # Next.js App Router 页面
├── src/lib/            # Supabase 与通用工具
├── src/types/          # 类型定义
├── supabase/           # 数据库结构
├── scripts/            # 辅助脚本
└── public/             # 静态资源
```
