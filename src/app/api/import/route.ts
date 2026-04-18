import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://juskidhyufsquecjkwem.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1c2tpZGh5dWZzcXVlY2prd2VtIiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3NzYzMDk0MzMsImV4cCI6MjA5MTg4NTQzM30.Tj8FvXq3r0lZ3Y6oCF0cT7bX1zKfEhN3vR9B2gLqk';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const postsToImport = [
  { title: 'giscus评论系统', slug: 'giscus', content: 'giscus 是一个基于 GitHub Discussions 的评论系统，允许博客使用 GitHub 来存储评论。配置方法：\n\n1. 安装 giscus App\n2. 启用 Discussions\n3. 复制仓库设置中的配置', excerpt: 'giscus评论系统介绍', published: true },
  { title: 'ROS系统环境搭建', slug: 'ros-system-setup', content: 'ROS系统搭建\n\n小乌龟：rosrun turtlesim turtlesim_node\n\n小乌龟运动控制：rosrun turtlesim turtle_teleop_key\n\ncmd_vel:=/turtle1/cmd_vel\n\n小乌龟节点监控：rostopic echo /turtle1/pose\n\n控制一个小乌龟一直转圈：rostopic pub -r 10 /turtle1/cmd_vel geometry_msgs/Twist "{linear: {x: 1, y: 0, z: 0}, angular: {x: 0, y: 0, z: 1}}"', excerpt: 'ROS系统环境搭建基础教程', published: true },
  { title: 'ros仿真系统搭建', slug: 'ros-simulation', content: 'ros仿真系统搭建\n\n一、Ubuntu 22.04 安装 ROS2 Humble\n\n1.确认语言环境为UTF-8\nlocale\n\n2.设置软件源\nROS 2 apt 存储库添加到系统\nsudo apt install software-properties-common\nsudo add-apt-repository universe\n\n添加 ROS 2 GPG 密钥\nsudo apt update && sudo apt install ros-humble-ros-baseG', excerpt: 'ROS2仿真环境搭建教程', published: true },
  { title: '四足机器人开发指南', slug: 'quadruped-robot-guide', content: '四足机器人开发指南\n\n要开发一个完整的四足机器狗实现自动避障和自主导航，需要系统性地整合硬件和软件组件。\n\n一、硬件系统（模块化选型）\n\n1. 核心运动硬件\n   组件  推荐型号/规格  作用\n   主控制器  NVIDIA Jetson AGX Orin/Intel NUC 11  处理导航算法与实时控制\n   电机驱动器  MIT Mini Cheetah驱动器  控制电机运动\n   传感器  RealSense D455  深度摄像\n   电池  12V 5000mAh  供电', excerpt: '四足机器人开发完整指南', published: true },
  { title: '四足机器人硬件支持', slug: 'quadruped-robot-hardware', content: '四足机器人笔记本选择\n\n四足机器狗仿真开发需求（Gazebo + ROS 2），结合预算和性能要求。\n\n一、关键配置优先级\nCPU > 内存 > GPU > 存储\n\nGazebo物理引擎依赖多核CPU，ROS 2节点并行需要大内存。GPU主要影响渲染速度。', excerpt: '四足机器人硬件推荐配置', published: true },
  { title: '常用命令', slug: 'common-commands', content: 'linux 常用命令\n\n全局搜索\njava ps -ef | grep java\n\n文件夹授权\nchmod +x\n\n脚本转换\ndos2unix 脚本名\n\n强制终止进程\npkill -9 -f "webrtc-streamer -H 0.0.0.0:8003"\n\n查看端口占用信息\nsudo lsof -i :8003', excerpt: '常用Linux命令汇总', published: true },
  { title: '常用软件下载', slug: 'common-software', content: '常用软件镜像下载站\n\n华为 https://mirrors.huaweicloud.com/ 速度 No.1\n\n清华 https://mirrors.tuna.tsinghua.edu.cn/ 速度 No.2\n\n阿里云 https://mirrors.aliyun.com/ 速度 NO.3\n\n网易 https://mirrors.163.com/ 速度 No.4', excerpt: '常用软件镜像下载站汇总', published: true },
  { title: '虚拟机Ubuntu操作系统搭建', slug: 'ubuntu-vm-setup', content: '虚拟机+Ubuntu操作系统搭建\n\n一、依赖安装\nsudo apt-get install git ssh make gcc libssl-dev liblz4-tool expect g++ patchelf chrpath gawk texinfo chrpath diffstat binfmt-support qemu-user-static live-build bison flex fak', excerpt: '虚拟机Ubuntu系统搭建教程', published: true },
  { title: 'JVM远程调试', slug: 'jvm-remote-debug', content: 'JVM远程调试\n\ncpolar + idea + jvm\n\n服务器：192.168.31.69\n\n基础信息服务：\njava -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=0.0.0.0:8071 -jar /home/linaro/diaodu', excerpt: 'JVM远程调试配置教程', published: true },
  { title: '免密ssh连接远程服务器', slug: 'ssh-passwordless', content: '免密ssh连接远程服务器\n\n一、使用公钥验证\n1.本地服务器生成公钥和私钥\nssh-keygen -t rsa -b 4096\n\n2.文件授权\nchmod 600 ~/.ssh/id_rsa\nchmod 644 ~/.ssh/id_rsa.pub\n\n3.复制公钥内容\ncat ~/.ssh/id_rsa.pub\n\n4.登录远程服务器\nssh username@remote_server', excerpt: 'SSH免密登录配置教程', published: true }
];

export async function POST() {
  try {
    const results = [];
    
    for (const post of postsToImport) {
      const { data, error } = await supabase
        .from('posts')
        .upsert([post], { onConflict: 'slug' })
        .select();
      
      if (error) {
        results.push({ title: post.title, status: 'error', message: error.message });
      } else {
        results.push({ title: post.title, status: 'success' });
      }
    }
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}