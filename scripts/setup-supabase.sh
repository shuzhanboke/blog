#!/bin/bash

# Supabase Setup Script
# 运行此脚本初始化 Supabase 数据库

echo "======================================"
echo "Supabase 数据库设置脚本"
echo "======================================"

# 检查是否安装了 Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "错误: 未安装 Supabase CLI"
    echo "请先安装: npm install -g supabase"
    exit 1
fi

echo ""
echo "步骤:"
echo "1. 访问 https://supabase.com 创建新项目"
echo "2. 获取 Project URL 和 anon/public key (在 Settings > API)"
echo "3. 获取 service_role key (仅服务器使用)"
echo ""
read -p "按 Enter 继续..."

echo ""
echo "请提供以下信息:"
read -p "Supabase Project URL: " SUPABASE_URL
read -p "Supabase anon key: " SUPABASE_ANON_KEY

echo ""
echo "正在创建 .env.local 文件..."
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

echo ".env.local 已创建"
echo ""
echo "接下来请在 Supabase Dashboard > SQL Editor 中运行 supabase/schema.sql"
echo "或者使用 Supabase CLI 运行: supabase db push"
