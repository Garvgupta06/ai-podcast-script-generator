@echo off
echo 🚀 Deploying AI Podcast Script Generator to Cloudflare Workers...

:: Check if wrangler is installed
wrangler --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Wrangler CLI not found. Installing...
    npm install -g wrangler
    echo ✅ Wrangler CLI installed
)

:: Check if logged in to Cloudflare
wrangler whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Not logged in to Cloudflare. Please login first:
    echo wrangler login
    pause
    exit /b 1
)

echo ✅ Authenticated with Cloudflare

:: Change to the cloudflare-workers directory
cd /d "%~dp0"

:: Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

:: Check if secrets are configured
echo 🔑 Checking secrets configuration...

wrangler secret list --env production 2>nul | findstr "OPENAI_API_KEY" >nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Missing OPENAI_API_KEY secret
    echo Run the setup script first: npm run setup-secrets
    echo Or set manually: wrangler secret put OPENAI_API_KEY --env production
    pause
    exit /b 1
)

echo ✅ Secrets configured

:: Deploy to production
echo 🚀 Deploying to production...
wrangler deploy --env production

if %ERRORLEVEL% equ 0 (
    echo 🎉 Deployment successful!
    echo.
    echo Your API is now available at:
    echo https://ai-podcast-script-api-prod.your-subdomain.workers.dev
    echo.
    echo Test endpoints:
    echo   Health check: /api/health
    echo   Process transcript: /api/process-transcript
    echo   Generate script: /api/generate-script
    echo.
    echo 📝 Don't forget to update your frontend and Python configs with the API URL!
) else (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

pause
