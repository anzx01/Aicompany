@echo off
if exist .env.local set DOTENV_CONFIG_PATH=.env.local
npx tsx scripts/test-agent-execution.ts
