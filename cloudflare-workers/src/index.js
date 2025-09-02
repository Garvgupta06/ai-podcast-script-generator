// AI Podcast Script Generator - Cloudflare Workers API
import { handleContentFetch } from './handlers/content.js';
import { handleLLMEnhancement } from './handlers/llm.js';
import { handleScriptGeneration, handleTranscriptProcessing } from './handlers/script.js';
import { corsHeaders } from './utils/cors.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      // Route handling
      switch (path) {
        case '/':
          return handleRoot();
        
        case '/api/health':
          return handleHealth(env);
        
        case '/api/process-transcript':
          if (method === 'POST') {
            return await handleTranscriptProcessing(request, env);
          }
          break;
        
        case '/api/generate-script':
          if (method === 'POST') {
            return await handleScriptGeneration(request, env);
          }
          break;
        
        case '/api/enhance-content':
          if (method === 'POST') {
            return await handleLLMEnhancement(request, env);
          }
          break;
        
        case '/api/fetch-transcript':
          if (method === 'POST') {
            return await handleContentFetch(request, env);
          }
          break;
        
        default:
          return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
      }
      
      return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
      
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse(
        { 
          error: 'Internal server error', 
          message: error.message,
          timestamp: new Date().toISOString()
        }, 
        500, 
        corsHeaders
      );
    }
  },
};

/**
 * Handle root endpoint - API documentation
 */
function handleRoot() {
  const apiDocs = {
    name: 'AI Podcast Script Generator API',
    version: '1.0.0',
    description: 'Transform transcripts into polished podcast scripts with AI',
    endpoints: {
      'GET /api/health': 'Health check endpoint',
      'POST /api/process-transcript': 'Process and clean raw transcript text (manual input only)',
      'POST /api/generate-script': 'Generate complete podcast script from processed transcript',
      'POST /api/enhance-content': 'Use LLM to enhance transcript quality (requires API keys)',
      'POST /api/fetch-transcript': 'Process manually provided content (URL fetching removed)'
    },
    usage: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY (for premium features)'
    },
    environment: {
      llm_providers: ['OpenAI', 'Anthropic Claude'],
      features_removed: ['YouTube fetching', 'Web scraping', 'RSS parsing'],
      note: 'This API now focuses on manual content input and AI enhancement'
    }
  };
  
  return jsonResponse(apiDocs, 200, corsHeaders);
}

/**
 * Health check endpoint
 */
function handleHealth(env) {
  const hasOpenAI = !!env.OPENAI_API_KEY;
  const hasAnthropic = !!env.ANTHROPIC_API_KEY;
  const hasPerplexity = !!env.PERPLEXITY_API_KEY;
  const hasLLM = hasOpenAI || hasAnthropic || hasPerplexity;
  
  // Determine preferred provider based on DEFAULT_LLM_PROVIDER or availability
  let preferredProvider = env.DEFAULT_LLM_PROVIDER || 'none';
  if (preferredProvider === 'none' || !preferredProvider) {
    preferredProvider = hasPerplexity ? 'perplexity' : hasOpenAI ? 'openai' : hasAnthropic ? 'anthropic' : 'none';
  }
  
  return jsonResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now(),
    version: '1.0.0',
    environment: env.ENVIRONMENT || 'development',
    features: {
      llm_enhancement: hasLLM,
      openai_available: hasOpenAI,
      anthropic_available: hasAnthropic,
      perplexity_available: hasPerplexity,
      preferred_provider: preferredProvider,
      current_model: preferredProvider === 'perplexity' ? (env.PERPLEXITY_MODEL || 'sonar-pro') : 
                     preferredProvider === 'openai' ? (env.OPENAI_MODEL || 'gpt-3.5-turbo') : 
                     preferredProvider === 'anthropic' ? (env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229') : 'none'
    },
    endpoints_active: [
      '/api/health',
      '/api/process-transcript',
      '/api/generate-script',
      '/api/enhance-content',
      '/api/fetch-transcript'
    ]
  }, 200, corsHeaders);
}

/**
 * Utility function for JSON responses
 */
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}
