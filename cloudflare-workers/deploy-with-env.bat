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
if "%PERPLEXITY_API_KEY%"== (
    echo ❌ Error: PERPLEXITY_API_KEY is required
    echo Please add PERPLEXITY_API_KEY to your .env file
    exit /b 1
)

echo ✅ Environment variables loaded successfully

REM Set Cloudflare Workers secrets
echo 🔐 Setting up Cloudflare Workers secrets...

echo Setting PERPLEXITY_API_KEY...
echo %PERPLEXITY_API_KEY% | npx wrangler secret put PERPLEXITY_API_KEY --env production

echo Setting DEFAULT_LLM_PROVIDER...
echo %DEFAULT_LLM_PROVIDER% | npx wrangler secret put DEFAULT_LLM_PROVIDER --env production

echo Setting PERPLEXITY_MODEL...
echo %PERPLEXITY_MODEL% | npx wrangler secret put PERPLEXITY_MODEL --env production

REM Deploy to Cloudflare Workers
echo 🚀 Deploying to Cloudflare Workers...
npx wrangler deploy --env production

if %ERRORLEVEL%==0 (
    echo ✅ Deployment successful!
    echo 🌐 API URL: https://podcast-generator-prod.garvgupta2906.workers.dev
    echo.
    echo Available endpoints:
    echo   - GET  / ^(API documentation^)
    echo   - GET  /api/health ^(Health check^)
    echo   - POST /api/process-transcript ^(Process transcript^)
    echo   - POST /api/enhance-content ^(AI enhancement^)
    echo   - POST /api/generate-script ^(Generate podcast script^)
    echo.
    echo 🔧 Test your deployment:
    echo curl https://podcast-generator-prod.garvgupta2906.workers.dev/api/health
) else (
    echo ❌ Deployment failed!
    exit /b 1
)
