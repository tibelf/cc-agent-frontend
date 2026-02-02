#!/bin/bash
# CC-Agent Frontend 启动脚本
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 CC-Agent Frontend 启动检查..."

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js 未安装，请先安装 Node.js"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# 2. 检查依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
fi
echo "✓ 依赖已安装"

# 3. 检查环境配置
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local 不存在，请创建环境配置文件"
  exit 1
fi
echo "✓ 环境配置存在"

# 4. 检查认证配置
if [ ! -f "config/auth.json" ]; then
  echo "⚠️  认证未配置，请运行: ./scripts/setup-auth.sh <用户名> <密码>"
  exit 1
fi
echo "✓ 认证配置存在"

echo ""
echo "🌐 启动开发服务器..."
echo "   访问地址: http://localhost:3000/cc"
echo ""

npm run dev
