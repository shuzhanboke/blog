-- 执行这个SQL来导入10篇旧博客文章

INSERT INTO posts (title, slug, content, excerpt, published) VALUES
('giscus评论系统', 'giscus', 'giscus 是一个基于 GitHub Discussions 的评论系统，允许博客使用 GitHub 来存储评论。配置方法：1. 安装 giscus App 2. 启用 Discussions 3. 复制仓库设置中的配置', 'giscus评论系统介绍', true),
('ROS系统环境搭建', 'ros-system-setup', 'ROS系统搭建 小乌龟：rosrun turtlesim turtlesim_node 小乌龟运动控制：rosrun turtlesim turtle_teleop_key', 'ROS系统环境搭建基础教程', true),
('ros仿真系统搭建', 'ros-simulation', 'ros仿真系统搭建 一、Ubuntu 22.04 安装 ROS2 Humble 1.确认语言环境 2.设置软件源 3.添加 ROS 2 GPG 密钥', 'ROS2仿真环境搭建教程', true),
('四足机器人开发指南', 'quadruped-robot-guide', '四足机器人开发指南 要开发一个完整的四足机器狗实现自动避障和自主导航。一、硬件系统：主控制器 NVIDIA Jetson AGX Orin', '四足机器人开发完整指南', true),
('四足机器人硬件支持', 'quadruped-robot-hardware', '四足机器人笔记本选择 四足机器狗仿真开发需求（Gazebo + ROS 2）。关键配置优先级：CPU > 内存 > GPU > 存储', '四足机器人硬件推荐配置', true),
('常用命令', 'common-commands', 'linux 常用命令 全局搜索:ps -ef | grep java 文件夹授权:chmod +x 脚本转换:dos2unix', '常用Linux命令汇总', true),
('常用软件下载', 'common-software', '常用软件镜像下载站 华为:mirrors.huaweicloud.com 清华:mirrors.tuna.tsinghua.edu.cn 阿里云:mirrors.aliyun.com', '常用软件镜像下载站汇总', true),
('虚拟机Ubuntu操作系统搭建', 'ubuntu-vm-setup', '虚拟机+Ubuntu操作系统搭建 一、依赖安装 sudo apt-get install git ssh make gcc libssl-dev', '虚拟机Ubuntu系统搭建教程', true),
('JVM远程调试', 'jvm-remote-debug', 'JVM远程调试 cpolar + idea + jvm 服务器：192.168.31.69', 'JVM远程调试配置教程', true),
('免密ssh连接远程服务器', 'ssh-passwordless', '免密ssh连接远程服务器 一、使用公钥验证 1.本地服务器生成公钥和私钥:ssh-keygen -t rsa -b 4096', 'SSH免密登录配置教程', true);

-- 查看结果
SELECT title, slug, created_at FROM posts ORDER BY created_at DESC LIMIT 10;