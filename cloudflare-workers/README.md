# Cloudflare Workers API for AI Podcast Script Generator

This directory contains the Cloudflare Workers implementation that provides a serverless API for the AI Podcast Script Generator.

## 🚀 Quick Setup

### 1. Prerequisites
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 2. Install Dependencies
```bash
cd cloudflare-workers
npm install
```

### 3. Configure API Keys
Run the interactive setup script:
```bash
npm run setup-secrets
```

Or set secrets manually:
```bash
# Required: OpenAI API Key
wrangler secret put OPENAI_API_KEY --env production

# Optional: Anthropic API Key
wrangler secret put ANTHROPIC_API_KEY --env production

# Optional: API Keys for client authentication
wrangler secret put VALID_API_KEYS --env production
```

### 4. Deploy
```bash
# Deploy to production
npm run deploy

# Deploy to development
npm run deploy:dev

# Local development
npm run dev
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Process Transcript
```
POST /api/process-transcript
Content-Type: application/json

{
  "transcript": "Your raw transcript text...",
  "source_type": "manual",
  "options": {}
}
```

### Enhance Content (requires API key)
```
POST /api/enhance-content
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "content": "Raw transcript to enhance...",
  "enhancement_type": "comprehensive",
  "provider": "openai"
}
```

### Generate Script
```
POST /api/generate-script
Content-Type: application/json

{
  "processed_transcript": {
    "segments": [...]
  },
  "show_config": {
    "show_name": "My Podcast",
    "host_name": "Host Name"
  }
}
```

### Fetch External Content
```
POST /api/fetch-transcript
Content-Type: application/json

{
  "source_url": "https://example.com/content",
  "source_type": "web_article"
}
```

## 🔐 Authentication

The API supports optional authentication for premium features:

1. **No Authentication**: Basic transcript processing and script generation
2. **API Key Authentication**: AI enhancement features require valid API key

Set up client API keys:
```bash
wrangler secret put VALID_API_KEYS --env production
# Enter: key1,key2,key3
```

Use in requests:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"content":"..."}' \
     https://your-worker.your-subdomain.workers.dev/api/enhance-content
```

## 🌍 Environment Configuration

### Development
- Unlimited rate limits
- Detailed logging
- CORS enabled for all origins

### Production
- Rate limiting enabled
- Error logging only
- Secure CORS configuration

## 📁 File Structure

```
src/
├── index.js              # Main worker entry point
├── auth/
│   └── auth.js           # Authentication utilities
├── utils/
│   └── cors.js           # CORS handling
└── handlers/
    ├── llm.js            # LLM integration
    ├── transcript.js     # Transcript processing
    ├── script.js         # Script generation
    └── content.js        # Content fetching
```

## 🔧 Configuration

### Environment Variables
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-3.5-turbo)
- `ANTHROPIC_MODEL`: Anthropic model to use (default: claude-3-sonnet-20240229)
- `RATE_LIMIT_REQUESTS`: Requests per window (default: 100)
- `RATE_LIMIT_WINDOW`: Rate limit window in seconds (default: 3600)

### Secrets
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key  
- `VALID_API_KEYS`: Comma-separated list of valid client API keys

## 🚀 Deployment Commands

```bash
# Local development
npm run dev

# Deploy to development environment
npm run deploy:dev

# Deploy to production environment
npm run deploy

# View logs
npm run tail

# View development logs
npm run tail:dev
```

## 🔍 Testing

Test the deployed API:

```bash
# Health check
curl https://your-worker.your-subdomain.workers.dev/api/health

# Process transcript
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Hello, this is a test transcript."}' \
  https://your-worker.your-subdomain.workers.dev/api/process-transcript

# Enhanced content (requires API key)
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test content","enhancement_type":"comprehensive"}' \
  https://your-worker.your-subdomain.workers.dev/api/enhance-content
```

## 🔗 Integration

### Frontend Integration
Update your frontend `API_BASE_URL` to point to your deployed worker:

```javascript
const API_BASE_URL = 'https://your-worker.your-subdomain.workers.dev';
```

### Python Integration
Update your Python configuration to use the Cloudflare Workers API:

```python
from config.config import Config

config = Config()
config.api_base_url = 'https://your-worker.your-subdomain.workers.dev'
config.api_key = 'your-api-key'
```

## 📈 Monitoring

View logs and metrics:
```bash
# Real-time logs
npm run tail

# View in Cloudflare dashboard
# https://dash.cloudflare.com -> Workers -> your-worker -> Metrics
```

## 🛠 Troubleshooting

### Common Issues

1. **Secret Not Set**
   ```bash
   wrangler secret list --env production
   ```

2. **API Key Invalid**
   - Check that your OpenAI/Anthropic keys are correct
   - Verify account has sufficient credits

3. **CORS Issues**
   - All origins are allowed by default
   - Check browser console for specific errors

4. **Rate Limiting**
   - Development environment has higher limits
   - Check the response headers for rate limit info

### Debug Mode
```bash
# Local development with verbose logging
wrangler dev --env development --local
```

This Cloudflare Workers API provides a scalable, serverless backend that integrates perfectly with your Python LLM integration system!
