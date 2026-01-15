#!/bin/bash
# 用法: ./scripts/setup-auth.sh <用户名> <密码>
# 示例: ./scripts/setup-auth.sh admin mypassword123

set -e

USERNAME=$1
PASSWORD=$2

if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
  echo "用法: $0 <用户名> <密码>"
  echo "示例: $0 admin mypassword123"
  exit 1
fi

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$PROJECT_DIR/config"
CONFIG_FILE="$CONFIG_DIR/auth.json"
ENV_FILE="$PROJECT_DIR/.env.local"

# 检查 bcryptjs 是否已安装
if ! node -e "require('bcryptjs')" 2>/dev/null; then
  echo "错误: bcryptjs 未安装，请先运行 npm install"
  exit 1
fi

# 创建 config 目录
mkdir -p "$CONFIG_DIR"

# 生成密码哈希
echo "正在生成密码哈希..."
HASH=$(node -e "console.log(require('bcryptjs').hashSync('$PASSWORD', 10))")

# 写入配置文件
echo "正在写入配置文件..."
cat > "$CONFIG_FILE" << EOF
{
  "users": [
    {
      "username": "$USERNAME",
      "passwordHash": "$HASH"
    }
  ]
}
EOF

# 生成/更新 JWT 密钥到环境变量
echo "正在更新环境变量..."
JWT_SECRET=$(openssl rand -base64 32)

# 移除旧的 AUTH_ 配置
if [ -f "$ENV_FILE" ]; then
  grep -v "^AUTH_" "$ENV_FILE" > "$ENV_FILE.tmp" 2>/dev/null || true
  grep -v "^# JWT" "$ENV_FILE.tmp" > "$ENV_FILE.tmp2" 2>/dev/null || true
  mv "$ENV_FILE.tmp2" "$ENV_FILE"
  rm -f "$ENV_FILE.tmp"
fi

# 追加 JWT 配置
cat >> "$ENV_FILE" << EOF

# JWT 配置 (由 setup-auth.sh 生成)
AUTH_JWT_SECRET=$JWT_SECRET
AUTH_TOKEN_EXPIRY=24h
EOF

echo ""
echo "✅ 配置完成！"
echo ""
echo "账号信息:"
echo "  用户名: $USERNAME"
echo "  密码: $PASSWORD"
echo ""
echo "配置文件: $CONFIG_FILE"
echo "环境变量: $ENV_FILE (JWT 密钥)"
echo ""
echo "请重启开发服务器以使配置生效"
