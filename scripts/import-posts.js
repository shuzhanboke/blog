const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://juskidhyufsquecjkwem.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1c2tpZGh5dWZzcXVlY2prd2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDk0MzMsImV4cCI6MjA5MTg4NTQzM30.ZTIyEB5bv-ntUyEz4IpFIdSx1w-aU9b_G8tTXLO4Wco';

const supabase = createClient(supabaseUrl, supabaseKey);

const postsToImport = [
  {
    title: 'giscus评论系统',
    slug: 'giscus',
    content: 'giscus 是一个基于 GitHub Discussions 的评论系统...',
    excerpt: 'giscus',
    published: true
  },
  {
    title: 'ROS系统环境搭建',
    slug: 'ros-system-setup',
    content: 'ROS系统搭建小乌龟：rosrun turtlesim turtlesim_node\n小乌龟运动控制：rosrun turtlesim turtle_teleop_key\n...',
    excerpt: 'ROS系统环境搭建',
    published: true
  },
  {
    title: 'ros仿真系统搭建',
    slug: 'ros-simulation',
    content: 'ros仿真系统搭建一、Ubuntu 22.04 安装 ROS2 Humble...',
    excerpt: 'ros仿真系统搭建',
    published: true
  },
  {
    title: '四足机器人开发指南',
    slug: 'quadruped-robot-guide',
    content: '四足机器人开发指南要开发一个完整的四足机器狗...',
    excerpt: '四足机器人开发指南',
    published: true
  },
  {
    title: '四足机器人硬件支持',
    slug: 'quadruped-robot-hardware',
    content: '四足机器人笔记本选择 四足机器狗仿真开发需求...',
    excerpt: '四足机器人硬件支持',
    published: true
  },
  {
    title: '常用命令',
    slug: 'common-commands',
    content: 'linux全局搜索 java ps -ef | grep java 文件夹授权 chmod +x...',
    excerpt: '常用命令',
    published: true
  },
  {
    title: '常用软件下载',
    slug: 'common-software',
    content: '镜像地址 华为 https://mirrors.huaweicloud.com/...',
    excerpt: '常用软件下载',
    published: true
  },
  {
    title: '虚拟机+Ubuntu操作系统搭建',
    slug: 'ubuntu-vm-setup',
    content: '虚拟机＋Ubuntu操作系统搭建一、依赖安装...',
    excerpt: '虚拟机+Ubuntu系统搭建',
    published: true
  },
  {
    title: 'JVM远程调试',
    slug: 'jvm-remote-debug',
    content: '远程调试cpolar + idea +jvm服务器...',
    excerpt: 'JVM远程调试',
    published: true
  },
  {
    title: '免密ssh连接远程服务器',
    slug: 'ssh-passwordless',
    content: '免密ssh连接远程服务器一、使用公钥验证...',
    excerpt: '免密ssh连接',
    published: true
  }
];

async function importPosts() {
  console.log('开始导入文章...\n');
  
  for (const post of postsToImport) {
    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select();
    
    if (error) {
      console.log(`❌ 导入失败: ${post.title} - ${error.message}`);
    } else {
      console.log(`✅ 导入成功: ${post.title}`);
    }
  }
  
  console.log('\n导入完成！');
}

importPosts().catch(console.error);