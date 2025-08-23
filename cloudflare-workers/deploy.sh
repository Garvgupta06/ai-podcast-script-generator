#!/bin/bash

echo "🚀 Deploying AI Podcast Script Generator to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
    echo "✅ Wrangler CLI installed"
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please login first:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Authenticated with Cloudflare"

# Change to the cloudflare-workers directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if secrets are configured
echo "🔑 Checking secrets configuration..."

MISSING_SECRETS=()

if ! wrangler secret list --env production 2>/dev/null | grep -q "OPENAI_API_KEY"; then
    MISSING_SECRETS+=("OPENAI_API_KEY")
fi

if ! wrangler secret list --env production 2>/dev/null | grep -q "VALID_API_KEYS"; then
    echo "⚠️  VALID_API_KEYS not set - API will work without authentication"
fi

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo "❌ Missing required secrets: ${MISSING_SECRETS[*]}"
    echo "Run the setup script first: npm run setup-secrets"
    echo "Or set secrets manually:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  wrangler secret put $secret --env production"
    done
    exit 1
fi

echo "✅ Secrets configured"

# Deploy to production
echo "🚀 Deploying to production..."
wrangler deploy --env production

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "Your API is now available at:"
    WORKER_URL=$(wrangler deployments list --env production --json 2>/dev/null | head -1 | sed -n 's/.*"url":"\\([^"]*\\)".*/\\1/p' 2>/dev/null || echo "https://ai-podcast-script-api-prod.your-subdomain.workers.dev")
    echo "$WORKER_URL"
    echo ""
    echo "Test endpoints:"
    echo "  Health check: $WORKER_URL/api/health"
    echo "  Process transcript: $WORKER_URL/api/process-transcript"
    echo "  Generate script: $WORKER_URL/api/generate-script"
    echo ""
    echo "📝 Don't forget to update your frontend and Python configs with the API URL!"
else
    echo "❌ Deployment failed!"
    exit 1
fi
