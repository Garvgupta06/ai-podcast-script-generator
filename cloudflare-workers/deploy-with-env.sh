#!/bin/bash

# Deploy AI Podcast Script Generator with Environment Variables
# This script sets up secrets and deploys to Cloudflare Workers

echo "🚀 Deploying AI Podcast Script Generator API..."

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found in root directory"
    echo "Please create a .env file with your API keys first"
    exit 1
fi

# Load environment variables from .env file
echo "📝 Loading environment variables from .env file..."
source "../.env"

# Check required variables
required_vars=("OPENAI_API_KEY" "ANTHROPIC_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 2 ]; then
    echo "❌ Error: At least one LLM API key is required"
    echo "Missing: ${missing_vars[*]}"
    echo "Please add at least PERPLEXITY_API_KEY, OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file"
    exit 1
fi

echo "✅ Environment variables loaded successfully"

# Set Cloudflare Workers secrets
echo "🔐 Setting up Cloudflare Workers secrets..."

if [ ! -z "$PERPLEXITY_API_KEY" ]; then
    echo "Setting PERPLEXITY_API_KEY..."
    echo "$PERPLEXITY_API_KEY" | wrangler secret put PERPLEXITY_API_KEY --env production
fi

if [ ! -z "$PERPLEXITY_MODEL" ]; then
    echo "Setting PERPLEXITY_MODEL..."
    echo "$PERPLEXITY_MODEL" | wrangler secret put PERPLEXITY_MODEL --env production
fi

if [ ! -z "$DEFAULT_LLM_PROVIDER" ]; then
    echo "Setting DEFAULT_LLM_PROVIDER..."
    echo "$DEFAULT_LLM_PROVIDER" | wrangler secret put DEFAULT_LLM_PROVIDER --env production
fi

if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "Setting OPENAI_API_KEY..."
    echo "$OPENAI_API_KEY" | wrangler secret put OPENAI_API_KEY --env production
fi

if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    echo "Setting ANTHROPIC_API_KEY..."
    echo "$ANTHROPIC_API_KEY" | wrangler secret put ANTHROPIC_API_KEY --env production
fi

if [ ! -z "$VALID_API_KEYS" ]; then
    echo "Setting VALID_API_KEYS..."
    echo "$VALID_API_KEYS" | wrangler secret put VALID_API_KEYS --env production
fi

# Deploy to Cloudflare Workers
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy --env production

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 API URL: https://ai-podcast-script-api-prod.garvgupta2906.workers.dev"
    echo ""
    echo "Available endpoints:"
    echo "  - GET  / (API documentation)"
    echo "  - GET  /api/health (Health check)"
    echo "  - POST /api/process-transcript (Process transcript)"
    echo "  - POST /api/enhance-content (AI enhancement)"
    echo "  - POST /api/generate-script (Generate podcast script)"
    echo ""
    echo "🔧 Test your deployment:"
    echo "curl https://ai-podcast-script-api-prod.garvgupta2906.workers.dev/api/health"
else
    echo "❌ Deployment failed!"
    exit 1
fi
