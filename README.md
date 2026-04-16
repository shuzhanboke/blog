# 我的博客系统

一个现代化的博客系统，使用 Next.js 14 和 Supabase 构建，支持评论、点赞和后台管理。

## 功能特性

- 响应式博客界面
- Markdown 文章编辑与语法高亮
- 评论系统
- 点赞功能
- 后台文章管理
- 用户认证系统
- GitHub Actions 自动部署

## 技术栈

- **前端**: Next.js 14, React 18, Tailwind CSS
- **后端**: Supabase (PostgreSQL, Auth)
- **部署**: GitHub Pages (自动部署)

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

### 3. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在 SQL Editor 中运行 `supabase/schema.sql`
3. 创建 `.env.local`：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=你的项目URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
   ```

详细步骤请查看 [DEPLOY.md](./DEPLOY.md)

### 4. 本地运行

```bash
npm run dev
```

访问 http://localhost:3000

## 管理后台

- 访问 `/admin/login` 登录
- 首次使用需在 Supabase 创建用户

## 自动部署

推送到 `main` 分支自动触发 GitHub Actions 部署到 GitHub Pages。

首次部署需要：
1. 在仓库 Settings > Pages 启用 GitHub Pages
2. 添加 Secrets: `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 项目结构

```
blog/
├── .github/workflows/    # CI/CD 部署脚本
├── scripts/             # 设置脚本
├── src/app/            # Next.js 页面
│   ├── admin/          # 管理后台
│   └── blog/           # 博客页面
├── supabase/          # 数据库结构
└── public/             # 静态资源
```

## License

MIT
