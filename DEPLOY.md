# 博客部署指南

本指南将帮助你在 Supabase 上配置数据库并部署到 GitHub Pages。

## 第一部分：配置 Supabase

### 步骤 1: 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击 "New Project" 创建新项目
3. 填写项目信息（名称、数据库密码等）
4. 等待项目创建完成（约2分钟）

### 步骤 2: 获取 API 密钥

1. 进入项目后，点击左侧 "Settings"
2. 点击 "API"
3. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`（公开密钥）
   - **service_role secret key**: `eyJhbGc...`（私密密钥，仅服务器使用）

### 步骤 3: 创建数据库表

1. 在 Supabase Dashboard 点击左侧 "SQL Editor"
2. 点击 "New Query"
3. 复制 `supabase/schema.sql` 的内容并粘贴
4. 点击 "Run" 执行

### 步骤 4: 配置认证

1. 进入 "Authentication" > "Settings"
2. 在 "Site URL" 填写你的博客地址
   - 本地开发: `http://localhost:3000`
   - GitHub Pages: `https://shuzhanboke.github.io/blog`
3. 在 "Redirect URLs" 添加:
   - `http://localhost:3000/**`
   - `https://shuzhanboke.github.io/blog/**`

### 步骤 5: 创建管理员用户

1. 进入 "Authentication" > "Users"
2. 点击 "Add User"
3. 填写邮箱和密码
4. 点击 "Create user"

---

## 第二部分：配置本地环境

### 步骤 1: 克隆仓库

```bash
git clone https://github.com/shuzhanboke/blog.git
cd blog
```

### 步骤 2: 安装依赖

```bash
npm install
```

### 步骤 3: 配置环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon公钥
```

### 步骤 4: 本地测试

```bash
npm run dev
```

访问 http://localhost:3000 查看博客。

---

## 第三部分：部署到 GitHub Pages

### 步骤 1: 添加 GitHub Secrets

1. 在 GitHub 仓库页面，点击 "Settings" > "Secrets and variables" > "Actions"
2. 点击 "New repository secret"
3. 添加以下 secrets：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 anon 公钥

### 步骤 2: 启用 GitHub Pages

1. 进入 "Settings" > "Pages"
2. 在 "Source" 下选择 "GitHub Actions"

### 步骤 3: 推送代码

```bash
git add .
git commit -m "feat: 准备部署"
git push
```

GitHub Actions 将自动构建并部署。

### 步骤 4: 验证部署

1. 访问 `https://shuzhanboke.github.io/blog`
2. 访问 `/admin/login` 使用管理员账号登录

---

## 常见问题

### Q: 评论功能不工作？
A: 确保 Supabase 的 Row Level Security 策略已正确配置。检查 `supabase/schema.sql` 中的策略。

### Q: 静态导出后动态路由不工作？
A: 由于使用静态导出，某些动态功能（如评论）需要客户端 JavaScript 执行。确保 Supabase 密钥已正确配置。

### Q: 如何更新文章？
A: 访问 `/admin/login` 登录后，可新建、编辑、发布/下架文章。

---

## 目录结构

```
blog/
├── .github/workflows/    # GitHub Actions 配置
├── scripts/             # 设置脚本
├── src/
│   ├── app/            # Next.js 页面
│   │   ├── admin/      # 管理后台
│   │   └── blog/       # 博客页面
│   ├── lib/            # 工具函数
│   └── types/          # TypeScript 类型
├── supabase/
│   └── schema.sql      # 数据库表结构
└── public/             # 静态资源
```
