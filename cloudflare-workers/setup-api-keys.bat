@echo off
REM ===============================================================================
REM AI Podcast Script Generator - API Keys Setup (Windows)
REM ===============================================================================
REM This script helps you set up API keys for Cloudflare Workers deployment
REM Run this before deploying to configure your secrets

echo.
echo ===============================================================================
echo  AI Podcast Script Generator - API Keys Setup
echo ===============================================================================
echo.

REM Check if wrangler is installed
npx wrangler --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Wrangler CLI not found. Please install it first:
    echo    npm install -g wrangler
    echo.
    pause
    exit /b 1
)

echo ✅ Wrangler CLI found
echo.

REM Login to Cloudflare if not already logged in
echo 🔑 Checking Cloudflare login...
npx wrangler whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 🚀 Please login to Cloudflare:
    npx wrangler login
    if %ERRORLEVEL% neq 0 (
        echo ❌ Login failed. Please try again.
        pause
        exit /b 1
    )
)

echo ✅ Logged in to Cloudflare
echo.

echo 🤖 Setting up AI Provider API Keys...
echo.
echo Choose your AI providers (you need at least one):
echo   1. Perplexity AI (Recommended - Primary provider)
echo   2. OpenAI (Fallback option)
echo   3. Anthropic Claude (Fallback option)
echo.

REM Setup Perplexity API Key (Primary)
set /p setup_perplexity="🤖 Set up Perplexity API key? (y/n): "
if /i "%setup_perplexity%"=="y" (
    echo.
    echo 📝 Get your Perplexity API key from: https://www.perplexity.ai/settings/api
    echo 🔑 Setting up Perplexity API key...
    npx wrangler secret put PERPLEXITY_API_KEY
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to set Perplexity API key
    ) else (
        echo ✅ Perplexity API key configured
    )
    echo.
)

REM Setup OpenAI API Key (Optional)
set /p setup_openai="🤖 Set up OpenAI API key? (y/n): "
if /i "%setup_openai%"=="y" (
    echo.
    echo 📝 Get your OpenAI API key from: https://platform.openai.com/api-keys
    echo 🔑 Setting up OpenAI API key...
    npx wrangler secret put OPENAI_API_KEY
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to set OpenAI API key
    ) else (
        echo ✅ OpenAI API key configured
    )
    echo.
)

REM Setup Anthropic API Key (Optional)
set /p setup_anthropic="🤖 Set up Anthropic API key? (y/n): "
if /i "%setup_anthropic%"=="y" (
    echo.
    echo 📝 Get your Anthropic API key from: https://console.anthropic.com/
    echo 🔑 Setting up Anthropic API key...
    npx wrangler secret put ANTHROPIC_API_KEY
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to set Anthropic API key
    ) else (
        echo ✅ Anthropic API key configured
    )
    echo.
)

echo ===============================================================================
echo  🎉 API Keys Setup Complete!
echo ===============================================================================
echo.
echo Next steps:
echo   1. Run: deploy-with-env.bat (to deploy your API)
echo   2. Open: ..\web-interface\index.html (to use the web interface)
echo.
echo 📚 Documentation:
echo   - README.md for full setup guide
echo   - docs\API_DOCUMENTATION.md for API reference
echo.

pause
