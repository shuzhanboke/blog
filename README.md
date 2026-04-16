# 我的博客系统

一个现代化的博客系统，使用 Next.js 14 和 Supabase 构建。

## 功能特性

- :white_check_mark: 响应式博客界面
- :white_check_mark: Markdown 文章编辑
- :white_check_mark: 评论系统
- :white_check_mark: 点赞功能
- :white_check_mark: 后台文章管理
- :white_check_mark: 用户认证系统
- :white_check_mark: 静态导出，支持 GitHub Pages 部署

## 技术栈

- **前端**: Next.js 14, React 18, Tailwind CSS
- **后端**: Supabase (PostgreSQL, Auth)
- **部署**: GitHub Pages

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

1. 在 [Supabase](https://supabase.com) 创建一个新项目
2. 在 SQL Editor 中运行 `supabase/schema.sql` 脚本
3. 复制 `.env.example` 为 `.env.local`
4. 填写你的 Supabase URL 和 Anon Key

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 5. 构建部署

```bash
npm run build
```

构建产物在 `out` 目录，可以部署到 GitHub Pages。

## 管理后台

访问 `/admin/login` 登录管理后台。

首次使用需要：
1. 在 Supabase 控制台创建一个用户
2. 使用该用户邮箱密码登录

## 项目结构

```
src/
├── app/
│   ├── admin/          # 管理后台页面
│   ├── blog/           # 博客页面
│   └── page.tsx        # 首页
├── components/         # React 组件
├── lib/               # 工具函数
└── types/             # TypeScript 类型
```

## License

MIT
