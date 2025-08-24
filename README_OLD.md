# 🎙️ AI Podcast Script Generator

Transform raw transcripts into polished, professional podcast scripts using AI-powered enhancement. This tool provides a complete workflow from transcript processing to final script generation with show notes.

## ✨ Features

- **📝 Transcript Processing**: Clean and structure raw transcript text
- **🤖 AI Enhancement**: Improve content quality using OpenAI or Anthropic Claude
- **🎯 Script Generation**: Create complete podcast scripts with intro, outro, and transitions
- **📋 Show Notes**: Generate comprehensive show notes automatically
- **🌐 Web Interface**: User-friendly web interface for easy use
- **⚡ Cloudflare Workers**: Serverless API deployment for scalability
- **🔒 Environment Security**: Secure API key management with .env files

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/Garvgupta06/ai-podcast-script-generator.git
cd ai-podcast-script-generator
```

### 2. Configure Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Required: At least one LLM API key
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: Customize your podcast
SHOW_NAME=Your Amazing Podcast
HOST_NAME=Your Name
SHOW_TAGLINE=Your podcast description

# Optional: Processing preferences
DEFAULT_ENHANCEMENT_LEVEL=comprehensive
MAX_SEGMENT_LENGTH=500
```

### 3. Deploy API (Cloudflare Workers)

```bash
cd cloudflare-workers
npm install
./deploy-with-env.bat  # Windows
# or
./deploy-with-env.sh   # Linux/Mac
```

### 4. Use the Web Interface

Open `web-interface/index.html` in your browser and start generating podcast scripts!

## 📁 Project Structure

```
ai-podcast-script/
├── .env                    # Environment variables (create from .env.example)
├── .env.example           # Template for environment variables
├── README.md              # This file
├── requirements.txt       # Python dependencies
│
├── cloudflare-workers/    # Serverless API
│   ├── src/
│   │   ├── index.js      # Main API handler
│   │   ├── handlers/     # API endpoint handlers
│   │   └── utils/        # Utility functions
│   ├── deploy-with-env.bat # Windows deployment script
│   ├── deploy-with-env.sh  # Linux/Mac deployment script
│   └── wrangler.toml     # Cloudflare configuration
│
├── python-scripts/       # Python implementations
│   ├── env_loader.py     # Environment variable loader
│   ├── llm_integration.py # LLM API integration
│   ├── script_generator.py # Script generation logic
│   └── transcript_processor.py # Transcript processing
│
├── config/               # Configuration management
│   └── config.py         # Python configuration class
│
├── web-interface/        # Web UI
│   └── index.html        # Single-page application
│
└── tests/                # Test files
    └── test_all.py       # Comprehensive tests
```

## 🎯 Usage

### Option 1: Web Interface (Recommended)

1. Open `web-interface/index.html` in your browser
2. Follow the step-by-step workflow:
   - **Step 1**: Input your transcript (manual input or file upload)
   - **Step 2**: Choose AI enhancement level
   - **Step 3**: Configure podcast details
   - **Step 4**: Generate complete script
   - **Step 5**: Export in multiple formats

### Option 2: Python Scripts

```python
from python-scripts.llm_integration import LLMIntegration
from python-scripts.script_generator import ScriptGenerator

# Initialize with environment variables automatically loaded
llm = LLMIntegration()

# Process transcript
enhanced = llm.enhance_transcript(raw_transcript, 'comprehensive')

# Generate script
generator = ScriptGenerator()
script = generator.generate_full_script(enhanced, show_config)
```

### Option 3: API Direct Usage

```bash
# Health check
curl https://ai-podcast-script-api-prod.garvgupta2906.workers.dev/api/health

# Process transcript
curl -X POST https://ai-podcast-script-api-prod.garvgupta2906.workers.dev/api/process-transcript \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Your raw transcript here"}'

# Enhance with AI
curl -X POST https://ai-podcast-script-api-prod.garvgupta2906.workers.dev/api/enhance-content \
  -H "Content-Type: application/json" \
  -d '{"content": "Your content", "enhancement_type": "comprehensive"}'

# Generate script
curl -X POST https://ai-podcast-script-api-prod.garvgupta2906.workers.dev/api/generate-script \
  -H "Content-Type: application/json" \
  -d '{"processed_transcript": {...}, "show_config": {...}}'
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key | One of OpenAI/Anthropic | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | One of OpenAI/Anthropic | - |
| `SHOW_NAME` | Default podcast name | No | AI Insights Podcast |
| `HOST_NAME` | Default host name | No | Your Host |
| `SHOW_TAGLINE` | Podcast tagline | No | Exploring the future of AI |
| `DEFAULT_ENHANCEMENT_LEVEL` | AI enhancement level | No | comprehensive |
| `MAX_SEGMENT_LENGTH` | Max segment length | No | 500 |

### Enhancement Levels

- **skip**: No AI enhancement (basic cleanup only)
- **minimal**: Light AI enhancement
- **comprehensive**: Full AI enhancement with improvements

## 🔄 Workflow

1. **Input**: Provide raw transcript text
2. **Process**: Clean and structure the transcript
3. **Enhance**: Optional AI-powered content improvement
4. **Configure**: Set podcast details (show name, host, format)
5. **Generate**: Create complete podcast script
6. **Export**: Download in various formats (TXT, MD, JSON)

## 🛡️ Security & Privacy

- **No Data Storage**: Transcripts are not stored permanently
- **Secure API Keys**: Environment variables protect sensitive data
- **Local Processing**: Python scripts can run entirely offline
- **HTTPS Only**: All API communications use secure connections

## 🚫 Removed Features

For security and reliability, the following features have been removed:
- YouTube video transcript fetching
- Web scraping and URL content extraction
- RSS feed parsing
- Automated content crawling

The tool now focuses on manual transcript input and AI enhancement for better security and reliability.

## 🔍 API Endpoints

### `GET /` - API Documentation
Returns detailed API documentation and available endpoints.

### `GET /api/health` - Health Check
Check API status and available LLM providers.

### `POST /api/process-transcript` - Process Transcript
Clean and structure raw transcript text.

**Request:**
```json
{
  "transcript": "Your raw transcript text here...",
  "source_type": "manual"
}
```

### `POST /api/enhance-content` - AI Enhancement
Enhance content quality using LLM providers.

**Request:**
```json
{
  "content": "Content to enhance...",
  "enhancement_type": "comprehensive"
}
```

### `POST /api/generate-script` - Generate Script
Create complete podcast script with intro, outro, and show notes.

**Request:**
```json
{
  "processed_transcript": {...},
  "show_config": {
    "show_name": "Your Podcast",
    "host_name": "Your Name",
    "episode_title": "Episode Title"
  }
}
```

## 🧪 Testing

Run comprehensive tests:

```bash
cd tests
python test_all.py
```

## 📋 Requirements

- **Python 3.8+** (for Python scripts)
- **Node.js 16+** (for Cloudflare Workers)
- **API Keys**: OpenAI or Anthropic (or both)
- **Cloudflare Account** (for API deployment)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] **Multiple Export Formats**: Word documents, PDF generation
- [ ] **Template System**: Customizable script templates
- [ ] **Batch Processing**: Process multiple transcripts
- [ ] **Advanced Analytics**: Script quality metrics
- [ ] **Voice Cloning Integration**: AI voice generation
- [ ] **Multi-language Support**: Support for non-English podcasts

## 🆘 Support

- 📧 **Email**: support@yourpodcast.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/Garvgupta06/ai-podcast-script-generator/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Garvgupta06/ai-podcast-script-generator/discussions)

---

**Made with ❤️ for podcast creators worldwide**
