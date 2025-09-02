# Contributing to AI Podcast Script Generator

Thank you for your interest in contributing to the AI Podcast Script Generator! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (for Cloudflare Workers)
- Python 3.8+ (for Python scripts, optional)
- Git for version control
- A Cloudflare account (free tier works)
- Perplexity API key (recommended primary provider)
- OpenAI or Anthropic API key (optional fallback providers)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/ai-podcast-script-generator.git
   cd ai-podcast-script-generator
   ```

2. **Set up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (optional - for Python scripts only)
   # For production, use Cloudflare Workers secrets instead
   ```

3. **Install Dependencies**
   ```bash
   cd cloudflare-workers
   npm install
   cd ..
   pip install -r requirements.txt  # Optional, for Python scripts
   ```

4. **Deploy for Testing**
   ```bash
   cd cloudflare-workers
   # Set up API keys in Cloudflare Workers
   npx wrangler secret put PERPLEXITY_API_KEY  # Primary provider
   npx wrangler secret put OPENAI_API_KEY      # Optional fallback
   npx wrangler secret put ANTHROPIC_API_KEY   # Optional fallback
   
   # Deploy to development environment
   npx wrangler deploy --env development
   # Or run locally for testing
   npx wrangler dev
   ```

## 🔧 Development Guidelines

### Current System Architecture (September 2025)

The project uses a **serverless-first** architecture:

**Primary Stack:**
- **Cloudflare Workers** - Serverless API (main system)
- **Perplexity AI** - Primary LLM provider (sonar-pro model)
- **Static HTML/JS** - Web interface (no server required)
- **Multi-provider fallback** - OpenAI/Anthropic as backups

**Production URL:** https://podcast-generator-prod.garvgupta2906.workers.dev

**Optional Components:**
- Python scripts (legacy/alternative implementation)
- Local development tools

### Code Style

**JavaScript/Node.js**
- Use ES6+ features and modules
- Prefer `const` and `let` over `var`
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Follow 2-space indentation

**Python**
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Add docstrings to functions and classes
- Use meaningful variable names
- 4-space indentation

### Project Structure

```
├── cloudflare-workers/    # Serverless API (JavaScript) - MAIN SYSTEM
│   ├── src/handlers/     # API endpoint logic
│   │   ├── llm.js       # AI enhancement (Perplexity primary)
│   │   ├── content.js   # Content processing
│   │   ├── script.js    # Script generation
│   │   └── transcript.js # Transcript processing
│   ├── src/utils/        # Utility functions (CORS, etc.)
│   └── src/auth/         # Authentication logic
├── web-interface/        # Frontend (HTML/JS/CSS) - MAIN UI
│   └── index.html       # Complete web application
├── python-scripts/      # Python implementations (OPTIONAL)
├── config/              # Configuration management
├── tests/               # Integration tests (OPTIONAL)
└── docs/                # Documentation
```

## 🐛 Reporting Issues

### Bug Reports
When reporting bugs, please include:
- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node.js version, Python version)
- **Error messages** or screenshots if applicable
- **Console logs** if relevant

### Feature Requests
For new features, please provide:
- **Clear description** of the feature
- **Use case** explaining why it's needed
- **Implementation ideas** if you have any
- **Examples** of how it would work

## 💡 Contributing Code

### 1. Choose an Issue
- Look for issues labeled `good first issue` for beginners
- Check `help wanted` issues for areas needing contribution
- Comment on the issue to let others know you're working on it

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Make Changes
- Write clean, documented code
- Add tests for new functionality
- Update documentation if needed
- Follow existing code patterns

### 4. Test Your Changes
```bash
# Test API endpoints
cd cloudflare-workers
npx wrangler deploy --env development

# Test health endpoint
curl https://your-worker-dev.your-username.workers.dev/api/health

# Test web interface manually
# Open web-interface/index.html in browser
# OR serve locally:
python -m http.server 8000
# Open http://localhost:8000/web-interface/

# Test Python scripts (if using)
cd tests
python test_all.py
```

### 5. Commit Your Changes
```bash
git add .
git commit -m "type: brief description

Detailed explanation if needed"
```

**Commit Types:**
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### 6. Submit a Pull Request
1. Push your branch to GitHub
2. Create a Pull Request
3. Fill out the PR template
4. Wait for review and address feedback

## 🧪 Testing Guidelines

### API Testing
- Test all endpoints with various inputs
- Include error cases and edge cases
- Verify response formats
- Test with different API providers (Perplexity primary, OpenAI/Anthropic fallbacks)
- Test health endpoint for provider availability

### Web Interface Testing
- Test on different browsers
- Verify mobile responsiveness
- Test file upload functionality
- Check error handling

### Python Scripts Testing
- Unit tests for individual functions (optional component)
- Integration tests for workflows
- Test with different input formats
- Verify output quality
- Note: Python scripts are optional - main system is Cloudflare Workers

## 📚 Documentation

### Code Documentation
- Add JSDoc comments to JavaScript functions
- Add docstrings to Python functions
- Include usage examples
- Document complex algorithms

### README Updates
- Update feature lists for new functionality
- Add new configuration options
- Include new usage examples
- Update troubleshooting section

## 🎯 Areas for Contribution

### High Priority
- **Performance optimization** for large content processing
- **Error handling** improvements for Perplexity API
- **User experience** enhancements in web interface
- **Mobile responsiveness** improvements
- **Provider fallback** system refinements

### Medium Priority
- **New export formats** (Word, PDF, etc.)
- **Template system** for custom scripts
- **Batch processing** capabilities
- **Advanced analytics** features

### Nice to Have
- **Multi-language support**
- **Voice integration**
- **WordPress plugin**
- **Mobile apps**

## 🔒 Security Considerations

### API Keys
- Never commit API keys to the repository
- Use Cloudflare Workers secrets for production
- Use environment variables for local development only
- Test with dummy keys when possible
- Document security requirements
- Perplexity API key should be primary, others as fallbacks

### Input Validation
- Validate all user inputs
- Sanitize content before processing
- Handle malicious inputs gracefully
- Test with various input sizes

### Privacy
- Don't log sensitive user content
- Implement proper CORS policies
- Use HTTPS for all communications
- Document data handling practices

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No sensitive data is included
- [ ] Feature works in both development and production
- [ ] Error handling is appropriate
- [ ] Performance impact is considered

## 🤝 Code Review Process

### What We Look For
- **Functionality**: Does the code work as intended?
- **Code Quality**: Is it readable and maintainable?
- **Testing**: Are there appropriate tests?
- **Documentation**: Is it well documented?
- **Security**: Are there any security concerns?

### Review Timeline
- Initial review within 48 hours
- Follow-up reviews within 24 hours
- Merge after approval from maintainers

## 🆘 Getting Help

### Where to Ask Questions
- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Code Comments**: Implementation-specific questions

### What to Include
- **Context**: What are you trying to achieve?
- **Problem**: What's not working?
- **Attempts**: What have you tried?
- **Environment**: What setup are you using?

## 🎉 Recognition

Contributors will be:
- Added to the contributors section
- Credited in release notes
- Recognized in project documentation
- Invited to contribute to future planning

## 📜 Code of Conduct

### Our Standards
- **Be respectful** to all contributors
- **Be constructive** in feedback
- **Be collaborative** in approach
- **Be inclusive** of different perspectives

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Inappropriate sexual content

### Enforcement
- Issues will be addressed promptly
- Violations may result in temporary or permanent bans
- Contact maintainers for serious concerns

---

Thank you for contributing to make podcast creation more accessible and engaging for everyone! 🎙️
