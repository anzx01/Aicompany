#!/bin/bash

# 心跳机制快速设置脚本
# 此脚本帮助你在 Supabase 中配置心跳机制

echo "🚀 AI Company Builder - 心跳机制设置"
echo "======================================"
echo ""

# 检查环境变量
if [ -z "$CRON_SECRET" ]; then
  echo "❌ 错误: CRON_SECRET 未设置"
  echo "请在 .env.local 中添加 CRON_SECRET"
  echo ""
  echo "生成随机密钥:"
  echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  exit 1
fi

echo "✅ CRON_SECRET 已配置"
echo ""

# 获取应用 URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ 错误: NEXT_PUBLIC_SUPABASE_URL 未设置"
  exit 1
fi

# 提示用户输入应用域名
echo "请输入你的应用域名 (例如: https://your-app.vercel.app):"
read APP_URL

if [ -z "$APP_URL" ]; then
  echo "❌ 错误: 应用域名不能为空"
  exit 1
fi

echo ""
echo "📋 配置信息:"
echo "  应用 URL: $APP_URL"
echo "  心跳端点: $APP_URL/api/cron/heartbeat"
echo "  Cron Secret: ${CRON_SECRET:0:10}..."
echo ""

# 生成 SQL 配置
echo "📝 请在 Supabase SQL Editor 中执行以下 SQL:"
echo ""
echo "-- 1. 配置应用设置"
echo "ALTER DATABASE postgres SET app.heartbeat_api_url = '$APP_URL/api/cron/heartbeat';"
echo "ALTER DATABASE postgres SET app.cron_secret = '$CRON_SECRET';"
echo ""
echo "-- 2. 验证配置"
echo "SELECT current_setting('app.heartbeat_api_url', true);"
echo "SELECT current_setting('app.cron_secret', true);"
echo ""
echo "-- 3. 执行迁移脚本"
echo "-- 复制并执行 supabase/migrations/001_setup_heartbeat_cron.sql"
echo "-- 复制并执行 supabase/migrations/002_setup_http_extension.sql"
echo ""
echo "-- 4. 验证 Cron 任务"
echo "SELECT * FROM cron.job WHERE jobname = 'heartbeat-execution';"
echo ""

# 测试端点
echo "🧪 测试心跳端点..."
echo ""

# 健康检查
echo "1. 健康检查 (GET):"
curl -s "$APP_URL/api/cron/heartbeat" | jq '.' || echo "端点未响应或应用未运行"
echo ""

# 手动触发
echo "2. 手动触发心跳 (POST):"
curl -s -X POST "$APP_URL/api/cron/heartbeat" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" | jq '.' || echo "端点未响应或应用未运行"
echo ""

echo "✅ 设置完成！"
echo ""
echo "📚 更多信息请查看: HEARTBEAT_SETUP.md"
