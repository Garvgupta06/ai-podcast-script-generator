@echo off
REM Deploy AI Podcast Script Generator with Environment Variables (Windows)
REM This script sets up secrets and deploys to Cloudflare Workers

echo 🚀 Deploying AI Podcast Script Generator API...

REM Check if .env file exists
if not exist "..\\.env" (
    echo ❌ Error: .env file not found in root directory
    echo Please create a .env file with your API keys first
    exit /b 1
)

echo 📝 Loading environment variables from .env file...

REM Read .env file and set variables
for /f "usebackq tokens=1,2 delims==" %%a in ("..\\.env") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" set "%%a=%%b"
)

REM Check if at least one API key is present
if "%OPENAI_API_KEY%"=="" if "%ANTHROPIC_API_KEY%"=="" (
    echo ❌ Error: At least one LLM API key is required
    echo Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file
    exit /b 1
)

echo ✅ Environment variables loaded successfully

REM Set Cloudflare Workers secrets
echo 🔐 Setting up Cloudflare Workers secrets...

if not "%OPENAI_API_KEY%"=="" (
    echo Setting OPENAI_API_KEY...
    echo %OPENAI_API_KEY% | npx wrangler secret put OPENAI_API_KEY --env production
)

if not "%ANTHROPIC_API_KEY%"=="" (
    echo Setting ANTHROPIC_API_KEY...
    echo %ANTHROPIC_API_KEY% | npx wrangler secret put ANTHROPIC_API_KEY --env production
)

if not "%VALID_API_KEYS%"=="" (
    echo Setting VALID_API_KEYS...
    echo %VALID_API_KEYS% | npx wrangler secret put VALID_API_KEYS --env production
)

REM Deploy to Cloudflare Workers
echo 🚀 Deploying to Cloudflare Workers...
npx wrangler deploy --env production

if %ERRORLEVEL%==0 (
    echo ✅ Deployment successful!
    echo 🌐 API URL: https://ai-podcast-script-api-prod.garvgupta2906.workers.dev
    echo.
    echo Available endpoints:
    echo   - GET  / ^(API documentation^)
    echo   - GET  /api/health ^(Health check^)
    echo   - POST /api/process-transcript ^(Process transcript^)
    echo   - POST /api/enhance-content ^(AI enhancement^)
    echo   - POST /api/generate-script ^(Generate podcast script^)
    echo.
    echo 🔧 Test your deployment:
    echo curl https://ai-podcast-script-api-prod.garvgupta2906.workers.dev/api/health
) else (
    echo ❌ Deployment failed!
    exit /b 1
)
