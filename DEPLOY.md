# 博客部署指南

本指南用于把博客系统配置到 `Supabase + Vercel`。

## 一、配置 Supabase

### 1. 创建项目
1. 登录 `https://supabase.com`
2. 新建项目
3. 等待数据库初始化完成

### 2. 获取密钥
在 `Settings -> API` 中记录：
- `Project URL`
- `anon public key`
- `service_role secret key`（仅服务端使用，不要暴露到前端）

### 3. 创建数据表
在 `SQL Editor` 中运行 `supabase/schema.sql`。

### 4. 配置认证
在 `Authentication -> URL Configuration` 中添加：
- `http://localhost:3000`
- 你的 Vercel 域名，例如 `https://blog-system-rose.vercel.app`

### 5. 创建管理员账号
在 `Authentication -> Users` 中添加后台登录账号。

## 二、本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

如果需要调用导入接口，再额外配置：

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 本地运行
```bash
npm run dev
```

打开 `http://localhost:3000` 进行验证。

## 三、部署到 Vercel

### 1. 创建或关联项目
```bash
vercel link
```

### 2. 配置环境变量
至少配置以下变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

如需使用文章导入接口，再配置：
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. 执行生产部署
```bash
vercel deploy --prod
```

## 四、部署后验证
至少检查以下页面：
- `/`
- `/blog`
- `/about`
- `/admin/login`

如数据库中已有文章，再检查任意文章详情页是否可正常打开、评论与点赞是否正常工作。

## 五、常见问题

### 1. 页面能打开但没有数据
- 检查 Supabase 表结构是否已创建
- 检查 `published = true` 的文章是否存在
- 检查 Vercel 环境变量是否正确

### 2. 登录失败
- 检查 Supabase Authentication 中是否存在管理员账号
- 检查 Site URL 与 Redirect URL 是否包含当前域名

### 3. 导入接口报错
- 检查是否配置了 `SUPABASE_SERVICE_ROLE_KEY`
- 确认该密钥只在服务端环境中使用
