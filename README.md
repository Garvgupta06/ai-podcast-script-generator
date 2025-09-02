# 🎙️ AI Podcast Script Generator

Transform articles and transcripts into engaging, multi-speaker podcast scripts using AI-powered enhancement. Create natural conversations between hosts and guests from any written content.

## ✨ Key Features

- **🗣️ Multi-Speaker Conversations**: Convert articles into natural dialogue between host and guest
- **🎭 Flexible Formats**: Interview, multi-host, or single-host podcast styles
- **🤖 AI Enhancement**: Powered by **Perplexity AI** (primary), with OpenAI and Anthropic Claude fallbacks
- **📝 Smart Processing**: Automatically segment and structure content
- **🎯 Complete Scripts**: Generate intro, main content, outro, and show notes
- **🌐 Web Interface**: User-friendly interface with step-by-step workflow
- **⚡ Serverless API**: Cloudflare Workers deployment for global scalability
- **🔒 Secure**: Environment-based API key management
- **🚀 Production Ready**: Fully deployed and tested system

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Garvgupta06/ai-podcast-script-generator.git
cd ai-podcast-script-generator
```

### 2. Set Up Environment Variables

Create your environment file:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Required: At least one LLM API key
PERPLEXITY_API_KEY=your_api_key_here

# Optional: Model preferences
PERPLEXITY_MODEL=sonar-pro

# Optional: Customize defaults
SHOW_NAME=Your Amazing Podcast
HOST_NAME=Your Name
SHOW_TAGLINE=Your podcast description
```

### 3. Deploy the API

**Option A: Quick Deploy (Windows)**
```bash
cd cloudflare-workers
setup-api-keys.bat
deploy-with-env.bat
```

**Option B: Manual Deploy**
```bash
cd cloudflare-workers
npm install
npx wrangler login
npx wrangler secret put PERPLEXITY_API_KEY  # Enter your Perplexity key (Recommended)
npx wrangler secret put OPENAI_API_KEY      # Enter your OpenAI key (Optional)
npx wrangler secret put ANTHROPIC_API_KEY   # Enter your Anthropic key (Optional)
npx wrangler deploy
```

### 4. Open the Web Interface

1. Open `web-interface/index.html` in your browser
2. The interface will connect to your deployed API automatically
3. Start creating podcast scripts!

## 🌟 **Live Demo**

**Production API:** https://podcast-generator-prod.garvgupta2906.workers.dev
- ✅ **Fully deployed and operational**
- ✅ **Perplexity AI integration working**
- ✅ **Multi-provider fallback system**
- ✅ **Global edge deployment**

**Test the API:**
```bash
curl https://podcast-generator-prod.garvgupta2906.workers.dev/api/health
```

**Web Interface:** Open `web-interface/index.html` locally and it will automatically connect to the production API!

## 🎯 How It Works

### Transform Any Article Into a Podcast Conversation

**Input (Article):**
```
Climate change is affecting global weather patterns. Scientists have recorded 
unprecedented temperature increases. Recent studies show renewable energy 
solutions are becoming more cost-effective...
```

**Output (Podcast Script):**
```
Host: So tell us about the data you've been looking at.

Guest: Climate change is affecting global weather patterns. Scientists have 
recorded unprecedented temperature increases across the globe.

Host: Those are fascinating numbers. What makes them particularly significant?

Guest: Recent studies show renewable energy solutions are becoming more 
cost-effective. This really shows us where the trends are heading.

Host: That puts things in a whole new perspective.
```

## 🎪 Podcast Formats

### 🎤 Interview Format (Host + Guest)
Perfect for expert interviews and educational content:
- Host asks engaging questions
- Guest provides expertise and insights
- Natural back-and-forth conversation
- Professional interview flow

### 👥 Multi-Host Format (Co-hosted)
Great for discussion-style podcasts:
- Both hosts contribute equally
- Natural banter and conversation
- Shared insights and perspectives
- Dynamic co-host interaction

### 🗣️ Single Host Format (Monologue)
Traditional podcast style:
- Single speaker presentation
- Professional narration
- Structured content delivery
- Perfect for solo shows

## 📁 Project Structure

```
ai-podcast-script/
├── 📄 README.md              # This comprehensive guide
├── 🔧 .env.example          # Environment template
├── 📋 requirements.txt      # Python dependencies
│
├── ☁️ cloudflare-workers/   # Serverless API
│   ├── src/
│   │   ├── 🚀 index.js      # Main API handler
│   │   ├── handlers/        # API endpoints
│   │   │   ├── script.js    # Script generation (NEW!)
│   │   │   ├── llm.js       # AI enhancement
│   │   │   └── content.js   # Content processing
│   │   └── utils/           # Utilities
│   ├── 🚀 deploy-with-env.bat # Windows deployment
│   └── ⚙️ wrangler.toml     # Cloudflare config
│
├── 🌐 web-interface/        # Web application
│   └── 📱 index.html        # Complete web UI
│
├── 🐍 python-scripts/      # Python implementations
│   ├── env_loader.py       # Environment management
│   ├── llm_integration.py  # LLM API clients
│   ├── script_generator.py # Script generation
│   └── transcript_processor.py # Content processing
│
├── ⚙️ config/              # Configuration
│   └── config.py           # Settings management
│
└── 🧪 tests/               # Testing
    └── test_all.py         # Comprehensive tests
```

## 🎬 Step-by-Step Usage

### Web Interface Workflow

1. **📝 Input Content**
   - Paste article text or transcript
   - Upload text files
   - Manual text input

2. **🤖 AI Enhancement** 
   - **Skip**: Basic cleanup only
   - **Comprehensive**: Full AI enhancement  
   - **Conversational**: Perfect for articles (NEW!)
   - **Minimal**: Light touch improvements

3. **🎭 Configure Podcast**
   - Choose format: Interview/Multi-host/Single-host
   - Set show name and tagline
   - Enter host and guest names
   - Customize episode details

4. **🎯 Generate Script**
   - Creates complete podcast script
   - Includes intro, main content, outro
   - Generates show notes and timestamps
   - Natural speaker conversations

5. **📤 Export & Use**
   - Download as text, markdown, or JSON
   - Copy individual segments
   - Use in your podcast production

## 🔄 Enhancement Types

| Type | Best For | What It Does |
|------|----------|--------------|
| **Skip** | Demo/Testing | Basic cleanup only |
| **Conversational** | Articles | Transforms written content into natural dialogue |
| **Comprehensive** | Transcripts | Full AI enhancement with improvements |
| **Minimal** | Clean Content | Light touch, preserves original style |

## 🛠️ API Reference

### Base URL
```
https://your-worker-name.your-username.workers.dev
```

### Key Endpoints

#### `GET /api/health`
Check system status and available providers.

```json
{
  "status": "healthy",
  "environment": "production",
  "features": {
    "perplexity_available": true,
    "preferred_provider": "PERPLEXITY"
  }
}
```

#### `POST /api/process-transcript`
Process and segment content for podcast use.

```json
{
  "transcript": "Your article or transcript content...",
  "source_type": "article"
}
```

#### `POST /api/enhance-content`
AI-powered content enhancement using Perplexity AI.

```json
{
  "content": "Content to enhance...",
  "enhancement_type": "conversational"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enhanced_content": "Enhanced content...",
    "provider": "perplexity",
    "improvements": ["AI-powered enhancement", "Improved clarity"]
  }
}
```

#### `POST /api/generate-script`
Generate complete podcast script with conversations.

```json
{
  "processed_transcript": { "segments": [...] },
  "show_config": {
    "show_name": "Tech Insights",
    "speakers": {
      "format": "interview",
      "host_name": "Sarah",
      "guest_name": "Dr. Johnson"
    }
  }
}
```

## 🔧 Advanced Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PERPLEXITY_API_KEY` | Perplexity API key | **Required (Recommended)** |
| `PERPLEXITY_MODEL` | Perplexity model | sonar-pro |
| `OPENAI_API_KEY` | OpenAI API key | Optional fallback |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional fallback |
| `OPENAI_MODEL` | OpenAI model | gpt-3.5-turbo |
| `ANTHROPIC_MODEL` | Anthropic model | claude-3-sonnet-20240229 |

### Customization Options

- **Show Configuration**: Name, tagline, host details
- **Speaker Formats**: Interview, multi-host, single-host
- **Enhancement Levels**: Skip, minimal, conversational, comprehensive
- **Export Formats**: TXT, MD, JSON

## 🎨 Examples

### Article Input
```
"Artificial intelligence is transforming healthcare. Machine learning algorithms 
can now analyze medical images with 95% accuracy. This technology is being 
implemented in hospitals worldwide."
```

### Generated Interview Script
```
Sarah: So tell us about the data you've been looking at.

Dr. Martinez: Artificial intelligence is transforming healthcare. Machine 
learning algorithms can now analyze medical images with 95% accuracy.

Sarah: Those are fascinating numbers. What makes them particularly significant?

Dr. Martinez: This technology is being implemented in hospitals worldwide. 
This really shows us where the trends are heading.

Sarah: That puts things in a whole new perspective.

[PAUSE FOR EMPHASIS]
```

## 🚀 Deployment Options

### Cloudflare Workers (Recommended)
```bash
cd cloudflare-workers
npm install
npx wrangler deploy
```

### Local Development
```bash
cd cloudflare-workers
npm run dev
```

### Python Scripts (Standalone)
```bash
pip install -r requirements.txt
python python-scripts/script_generator.py
```

## 🔒 Security Features

- **No Data Persistence**: Content is not stored permanently
- **Environment Variables**: Secure API key management
- **HTTPS Only**: All communications encrypted
- **Local Processing**: Can run entirely offline (Python version)
- **CORS Protection**: Secure cross-origin requests

## 🧪 Testing

### Run All Tests
```bash
cd tests
python test_all.py
```

### Test Individual Components
```bash
# Test API deployment
curl https://your-worker.workers.dev/api/health

# Test web interface
python -m http.server 8000
# Open http://localhost:8000/web-interface/
```

## 📋 Requirements

### System Requirements
- **Node.js 16+** (for Cloudflare Workers)
- **Python 3.8+** (for Python scripts, optional)
- **Modern Browser** (for web interface)

### API Requirements
- **Perplexity API Key** (recommended primary provider)
- **OpenAI API Key** OR **Anthropic API Key** (fallback options)
- **Cloudflare Account** (free tier sufficient)

### Optional Requirements
- **Git** (for version control)
- **VS Code** (recommended editor)

## 🆘 Troubleshooting

### Common Issues

**"No LLM provider configured"**
- Ensure API keys are set in Cloudflare Workers secrets
- Run `npx wrangler secret put PERPLEXITY_API_KEY` to set your key
- Check deployment with `npx wrangler deploy`

**"Failed to generate script"**
- Verify API deployment is successful at your workers.dev URL
- Check browser console for detailed error messages
- Ensure input content is not empty

**"Enhancement failed, using fallback"**
- Perplexity API quota may be exceeded
- Check API key validity at https://www.perplexity.ai/settings/api
- Try different enhancement type or use basic fallback

### Getting Help

- **📚 Documentation**: Check this README
- **🐛 Issues**: [GitHub Issues](https://github.com/Garvgupta06/ai-podcast-script-generator/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Garvgupta06/ai-podcast-script-generator/discussions)

## 🚧 What's New

### v2.1 - Perplexity AI Integration (Latest - September 2025)
- ✅ **Perplexity AI** as primary LLM provider (sonar-pro model)
- ✅ **Multi-provider fallback system** with intelligent switching
- ✅ **Enhanced content quality** with advanced AI processing  
- ✅ **Production deployment** at podcast-generator-prod.garvgupta2906.workers.dev
- ✅ **Streamlined codebase** with unnecessary files removed
- ✅ **Improved error handling** and debugging capabilities

### v2.0 - Conversational AI
- ✅ Multi-speaker conversation generation
- ✅ Interview and multi-host formats
- ✅ Conversational enhancement for articles
- ✅ Intelligent content distribution between speakers
- ✅ Varied conversation starters and natural flow

### v1.0 - Foundation
- ✅ Basic transcript processing
- ✅ Single-host script generation
- ✅ Web interface
- ✅ Cloudflare Workers API

## 🎯 Roadmap

### Upcoming Features
- [ ] **Voice Integration**: AI voice generation for scripts
- [ ] **Template System**: Custom script templates
- [ ] **Batch Processing**: Multiple files at once
- [ ] **Advanced Analytics**: Script quality metrics
- [ ] **Multi-language Support**: International podcasts
- [ ] **WordPress Plugin**: Direct website integration

### Long-term Goals
- [ ] **Mobile App**: Native iOS/Android apps
- [ ] **Team Collaboration**: Multi-user workspaces
- [ ] **Premium Features**: Advanced customization
- [ ] **Podcast Networks**: Multi-show management

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Perplexity AI** for advanced language model capabilities
- **OpenAI** and **Anthropic** for powerful LLM APIs
- **Cloudflare** for serverless computing platform
- **Bootstrap** for beautiful web interface
- **Font Awesome** for icons

---

**🎙️ Built with ❤️ for podcast creators who want to turn any content into engaging conversations**

*Transform your articles into podcast gold with AI-powered enhancement!*
