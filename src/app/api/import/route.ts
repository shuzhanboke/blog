import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY

const postsToImport = [
  {
    title: 'giscus 评论系统接入',
    slug: 'giscus',
    content:
      'giscus 是一个基于 GitHub Discussions 的评论系统，适合为博客快速增加互动能力。\n\n接入步骤：\n\n1. 安装 giscus App\n2. 为仓库启用 Discussions\n3. 在 giscus 控制台生成配置\n4. 将脚本嵌入文章详情页',
    excerpt: '用 GitHub Discussions 为博客接入评论功能。',
    published: true,
  },
  {
    title: 'ROS 系统环境搭建',
    slug: 'ros-system-setup',
    content:
      '记录 ROS 环境搭建过程中常用的命令与排查步骤。\n\n- 启动 turtlesim\n- 键盘控制小海龟\n- 查看 pose 与 cmd_vel 话题\n- 使用 rostopic 发送测试消息',
    excerpt: 'ROS 基础环境搭建与常用命令速查。',
    published: true,
  },
  {
    title: 'Linux 常用命令备忘',
    slug: 'common-commands',
    content:
      '整理工作中高频使用的 Linux 命令，包括进程、权限、端口与脚本处理。\n\n```bash\nps -ef | grep java\nchmod +x script.sh\ndos2unix deploy.sh\nsudo lsof -i :8003\n```',
    excerpt: '开发与部署中常用的 Linux 命令速查。',
    published: true,
  },
]

export async function POST() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase service credentials.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    const results = []

    for (const post of postsToImport) {
      const { error } = await supabase.from('posts').upsert([post], { onConflict: 'slug' }).select()

      if (error) {
        results.push({ title: post.title, status: 'error', message: error.message })
      } else {
        results.push({ title: post.title, status: 'success' })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
