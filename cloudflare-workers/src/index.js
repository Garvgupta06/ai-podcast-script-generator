export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers for browser requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

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
          return handleHealth();
        
        case '/api/process-transcript':
          if (method === 'POST') {
            return await handleProcessTranscript(request, env);
          }
          break;
        
        case '/api/generate-script':
          if (method === 'POST') {
            return await handleGenerateScript(request, env);
          }
          break;
        
        case '/api/enhance-content':
          if (method === 'POST') {
            return await handleEnhanceContent(request, env);
          }
          break;
        
        case '/api/fetch-transcript':
          if (method === 'POST') {
            return await handleFetchTranscript(request, env);
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
    description: 'Transform transcripts into polished podcast scripts',
    endpoints: {
      'GET /api/health': 'Health check endpoint',
      'POST /api/process-transcript': 'Process and clean raw transcript text',
      'POST /api/generate-script': 'Generate complete podcast script from processed transcript',
      'POST /api/enhance-content': 'Use LLM to enhance transcript quality',
      'POST /api/fetch-transcript': 'Fetch transcript from external sources'
    },
    usage: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY (for premium features)'
    }
  };
  
  return jsonResponse(apiDocs, 200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  });
}

/**
 * Health check endpoint
 */
function handleHealth() {
  return jsonResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now(),
    version: '1.0.0'
  }, 200, { 'Access-Control-Allow-Origin': '*' });
}

/**
 * Process raw transcript text
 */
async function handleProcessTranscript(request, env) {
  try {
    const body = await request.json();
    const { transcript, source_type, options } = body;
    
    if (!transcript) {
      return jsonResponse(
        { error: 'Transcript text is required' }, 
        400, 
        { 'Access-Control-Allow-Origin': '*' }
      );
    }
    
    // Clean and process the transcript
    const processed = await processTranscriptText(transcript, source_type, options);
    
    return jsonResponse({
      success: true,
      data: processed,
      processed_at: new Date().toISOString()
    }, 200, { 'Access-Control-Allow-Origin': '*' });
    
  } catch (error) {
    console.error('Process transcript error:', error);
    return jsonResponse(
      { error: 'Failed to process transcript', message: error.message }, 
      500, 
      { 'Access-Control-Allow-Origin': '*' }
    );
  }
}

/**
 * Generate complete podcast script
 */
async function handleGenerateScript(request, env) {
  try {
    const body = await request.json();
    const { processed_transcript, show_config, script_options } = body;
    
    if (!processed_transcript) {
      return jsonResponse(
        { error: 'Processed transcript data is required' }, 
        400, 
        { 'Access-Control-Allow-Origin': '*' }
      );
    }
    
    // Generate the podcast script
    const script = await generatePodcastScript(processed_transcript, show_config, script_options);
    
    return jsonResponse({
      success: true,
      data: script,
      generated_at: new Date().toISOString()
    }, 200, { 'Access-Control-Allow-Origin': '*' });
    
  } catch (error) {
    console.error('Generate script error:', error);
    return jsonResponse(
      { error: 'Failed to generate script', message: error.message }, 
      500, 
      { 'Access-Control-Allow-Origin': '*' }
    );
  }
}

/**
 * Enhance content using LLM
 */
async function handleEnhanceContent(request, env) {
  try {
    // Validate authentication if required
    const authResult = await validateApiKey(request, env);
    if (authResult) return authResult;
    
    const body = await request.json();
    const { content, enhancement_type, llm_config, provider } = body;
    
    if (!content) {
      return jsonResponse(
        { error: 'Content is required' }, 
        400, 
        { 'Access-Control-Allow-Origin': '*' }
      );
    }
    
    // Check if LLM enhancement is available
    if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
      return jsonResponse(
        { error: 'LLM enhancement not configured' }, 
        503, 
        { 'Access-Control-Allow-Origin': '*' }
      );
    }
    
    // Enhance content with LLM
    const enhanced = await enhanceWithLLM(content, enhancement_type, env, llm_config, provider);
    
    return jsonResponse({
      success: true,
      data: enhanced,
      enhanced_at: new Date().toISOString()
    }, 200, { 'Access-Control-Allow-Origin': '*' });
    
  } catch (error) {
    console.error('Enhance content error:', error);
    return jsonResponse(
      { error: 'Failed to enhance content', message: error.message }, 
      500, 
      { 'Access-Control-Allow-Origin': '*' }
    );
  }
}

/**
 * Fetch transcript from external sources
 */
async function handleFetchTranscript(request, env) {
  try {
    const body = await request.json();
    const { source_url, source_type, options } = body;
    
    if (!source_url) {
      return jsonResponse(
        { error: 'Source URL is required' }, 
        400, 
        { 'Access-Control-Allow-Origin': '*' }
      );
    }
    
    // Fetch transcript from external source
    const transcript = await fetchExternalTranscript(source_url, source_type, options);
    
    return jsonResponse({
      success: true,
      data: transcript,
      fetched_at: new Date().toISOString()
    }, 200, { 'Access-Control-Allow-Origin': '*' });
    
  } catch (error) {
    console.error('Fetch transcript error:', error);
    return jsonResponse(
      { error: 'Failed to fetch transcript', message: error.message }, 
      500, 
      { 'Access-Control-Allow-Origin': '*' }
    );
  }
}

/**
 * Process transcript text - core logic
 */
async function processTranscriptText(transcript, sourceType = 'manual', options = {}) {
  // Clean the transcript
  let cleaned = transcript
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Remove timestamp markers
    .replace(/\[[\d:]+\]/g, '')
    // Remove speaker tags
    .replace(/^[A-Z\s]+:/gm, '')
    // Remove common filler words
    .replace(/\b(um|uh|er|ah|like|you know)\b/gi, '');
  
  // Extract segments
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .filter(p => p.trim().length > 0);
  
  const segments = paragraphs.map((text, index) => {
    const wordCount = text.split(/\s+/).length;
    const keywords = extractKeywords(text);
    
    return {
      id: index + 1,
      text: text.trim(),
      word_count: wordCount,
      estimated_duration: Math.round((wordCount / 150) * 100) / 100, // 150 WPM
      topic_keywords: keywords,
      segment_type: classifySegment(text)
    };
  });
  
  return {
    original_text: transcript,
    cleaned_text: cleaned,
    segments: segments,
    total_segments: segments.length,
    total_word_count: segments.reduce((sum, seg) => sum + seg.word_count, 0),
    estimated_total_duration: segments.reduce((sum, seg) => sum + seg.estimated_duration, 0),
    source_type: sourceType,
    processing_options: options
  };
}

/**
 * Generate podcast script from processed transcript
 */
async function generatePodcastScript(processedTranscript, showConfig = {}, scriptOptions = {}) {
  const config = {
    show_name: 'AI Insights Podcast',
    host_name: 'Your Host',
    show_tagline: 'Exploring the future of technology',
    ...showConfig
  };
  
  const segments = processedTranscript.segments || [];
  
  // Generate intro
  const intro = generateIntro(segments, config);
  
  // Generate main content
  const mainContent = generateMainContent(segments, config);
  
  // Generate outro
  const outro = generateOutro(segments, config);
  
  // Generate show notes
  const showNotes = generateShowNotes(segments, config);
  
  // Calculate total duration
  const totalDuration = intro.estimated_duration + 
                       mainContent.reduce((sum, content) => sum + content.estimated_duration, 0) + 
                       outro.estimated_duration;
  
  return {
    intro,
    main_content: mainContent,
    outro,
    show_notes: showNotes,
    metadata: {
      total_duration: Math.round(totalDuration * 100) / 100,
      segment_count: segments.length,
      show_config: config,
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate intro section
 */
function generateIntro(segments, config) {
  const topicPreview = segments.slice(0, 3)
    .map(seg => seg.topic_keywords?.[0])
    .filter(Boolean)
    .join(', ');
  
  const script = `
[INTRO MUSIC - 10 seconds]

HOST: Welcome to ${config.show_name}, I'm ${config.host_name}, and this is where ${config.show_tagline}.

[MUSIC FADES]

HOST: In today's episode, we're exploring ${topicPreview || 'fascinating insights'} and what they mean for our future.

[TRANSITION SOUND]

HOST: Let's dive in.
  `.trim();
  
  return {
    script,
    estimated_duration: 1.5,
    music_cues: ['intro_music', 'transition_sound']
  };
}

/**
 * Generate main content sections
 */
function generateMainContent(segments, config) {
  return segments.map((segment, index) => {
    let polishedText = segment.text;
    
    // Add hosting cues based on segment type
    if (segment.segment_type === 'data') {
      polishedText = `HOST: Here's something interesting - ${polishedText}\n\n[PAUSE FOR EMPHASIS]`;
    } else if (segment.segment_type === 'narrative') {
      polishedText = `HOST: Let me share a story that illustrates this perfectly. ${polishedText}`;
    } else {
      polishedText = `HOST: ${polishedText}`;
    }
    
    return {
      segment_id: segment.id,
      type: segment.segment_type,
      script: polishedText,
      estimated_duration: segment.estimated_duration,
      keywords: segment.topic_keywords
    };
  });
}

/**
 * Generate outro section
 */
function generateOutro(segments, config) {
  const script = `
[TRANSITION MUSIC - 5 seconds]

HOST: That's a wrap on today's episode of ${config.show_name}. We've covered a lot of ground, and I hope you found these insights as fascinating as I do.

HOST: If you enjoyed this episode, please subscribe wherever you get your podcasts and leave us a review - it really helps.

HOST: Thanks for listening, I'm ${config.host_name}, and we'll see you next time.

[OUTRO MUSIC - 15 seconds]
  `.trim();
  
  return {
    script,
    estimated_duration: 2.0,
    music_cues: ['transition_music', 'outro_music']
  };
}

/**
 * Generate show notes
 */
function generateShowNotes(segments, config) {
  const keyPoints = segments
    .filter(seg => seg.segment_type === 'data' || seg.segment_type === 'narrative')
    .slice(0, 5)
    .map(seg => `- ${seg.text.substring(0, 100)}...`);
  
  const allKeywords = segments
    .flatMap(seg => seg.topic_keywords || [])
    .filter((keyword, index, array) => array.indexOf(keyword) === index)
    .slice(0, 10);
  
  return {
    summary: "An insightful exploration of current developments and their implications.",
    key_points: keyPoints,
    keywords: allKeywords,
    social_snippets: [
      `🎙️ New episode of ${config.show_name} is live!`,
      "💡 Key insights that might change how you think about the future.",
      "📊 The data tells a compelling story - listen to find out what it means."
    ]
  };
}

/**
 * Enhance content with LLM
 */
async function enhanceWithLLM(content, enhancementType, env, llmConfig = {}, provider = null) {
  const selectedProvider = provider || (env.OPENAI_API_KEY ? 'openai' : 'anthropic');
  
  try {
    if (selectedProvider === 'openai' && env.OPENAI_API_KEY) {
      return await enhanceWithOpenAI(content, enhancementType, env, llmConfig);
    } else if (selectedProvider === 'anthropic' && env.ANTHROPIC_API_KEY) {
      return await enhanceWithAnthropic(content, enhancementType, env, llmConfig);
    } else {
      throw new Error(`LLM provider ${selectedProvider} not available or configured`);
    }
  } catch (error) {
    console.error(`LLM enhancement failed with ${selectedProvider}:`, error);
    
    // Fallback to basic enhancement
    return {
      original_content: content,
      enhanced_content: basicContentEnhancement(content),
      enhancement_type: enhancementType,
      provider: 'fallback',
      improvements: [
        'Removed filler words',
        'Basic text cleanup',
        'Note: LLM enhancement failed, using fallback'
      ]
    };
  }
}

/**
 * Enhance content using OpenAI
 */
async function enhanceWithOpenAI(content, enhancementType, env, config) {
  const prompt = buildEnhancementPrompt(content, enhancementType);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert podcast script writer and audio content creator. Your goal is to transform raw transcripts into polished, engaging podcast content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.max_tokens || 2000,
      temperature: config.temperature || 0.3
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const enhancedContent = data.choices[0].message.content.trim();
  
  return {
    original_content: content,
    enhanced_content: enhancedContent,
    enhancement_type: enhancementType,
    provider: 'openai',
    model: config.model || 'gpt-3.5-turbo',
    token_usage: data.usage,
    improvements: [
      'AI-powered content enhancement',
      'Improved clarity and flow',
      'Removed filler words',
      'Enhanced structure and readability'
    ]
  };
}

/**
 * Enhance content using Anthropic Claude
 */
async function enhanceWithAnthropic(content, enhancementType, env, config) {
  const prompt = buildEnhancementPrompt(content, enhancementType);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-sonnet-20240229',
      max_tokens: config.max_tokens || 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const enhancedContent = data.content[0].text.trim();
  
  return {
    original_content: content,
    enhanced_content: enhancedContent,
    enhancement_type: enhancementType,
    provider: 'anthropic',
    model: config.model || 'claude-3-sonnet-20240229',
    usage: data.usage,
    improvements: [
      'AI-powered content enhancement',
      'Improved clarity and flow',
      'Removed filler words',
      'Enhanced structure and readability'
    ]
  };
}

/**
 * Build enhancement prompt based on type
 */
function buildEnhancementPrompt(content, enhancementType) {
  const basePrompt = `Please enhance the following transcript for podcast use. The transcript may contain:
- Filler words (um, uh, like, you know)
- Repetitive phrases
- Unclear sentences
- Missing punctuation
- Speaker attribution issues

Enhancement type: ${enhancementType}

Original transcript:
${content}

Please provide an enhanced version that:
1. Removes unnecessary filler words
2. Improves clarity and flow
3. Maintains the original meaning and tone
4. Adds appropriate punctuation
5. Structures content logically
6. Preserves important emphasis and emotion

Enhanced transcript:`;

  if (enhancementType === 'comprehensive') {
    return basePrompt + `

Additionally:
- Break content into logical segments
- Add topic headings where appropriate
- Identify key quotes or soundbites
- Note any technical terms that might need explanation`;
  } else if (enhancementType === 'minimal') {
    return basePrompt + `

Focus only on:
- Basic grammar and punctuation corrections
- Removing obvious filler words
- Maintaining original structure`;
  }
  
  return basePrompt;
}

/**
 * Basic content enhancement fallback
 */
function basicContentEnhancement(content) {
  return content
    // Remove common filler words
    .replace(/\b(um|uh|er|ah|like|you know)\b/gi, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Remove timestamp markers
    .replace(/\[[\d:]+\]/g, '')
    // Clean up speaker tags
    .replace(/^[A-Z\s]+:/gm, '')
    .trim();
}

/**
 * Authentication middleware
 */
async function validateApiKey(request, env) {
  // Skip authentication if no API keys are configured
  if (!env.VALID_API_KEYS) {
    return null;
  }
  
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({
      error: 'Missing or invalid authorization header',
      message: 'Please provide a valid API key in the Authorization header'
    }, 401, { 'Access-Control-Allow-Origin': '*' });
  }
  
  const token = authHeader.substring(7);
  const validApiKeys = env.VALID_API_KEYS.split(',');
  
  if (!validApiKeys.includes(token)) {
    return jsonResponse({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    }, 403, { 'Access-Control-Allow-Origin': '*' });
  }
  
  return null; // Valid authentication
}

/**
 * Rate limiting (simple implementation)
 */
function rateLimiter(clientIp, env) {
  // This is a simplified rate limiter
  // In production, you'd use Cloudflare KV or Durable Objects
  return { 
    allowed: true, 
    remaining: 100,
    resetTime: Date.now() + 3600000 // 1 hour
  };
}

/**
 * Fetch transcript from external sources
 */
async function fetchExternalTranscript(sourceUrl, sourceType, options = {}) {
  // Placeholder for external transcript fetching
  // Would integrate with YouTube API, news APIs, etc.
  
  return {
    source_url: sourceUrl,
    source_type: sourceType,
    transcript: "Transcript fetching not yet implemented for this source type.",
    metadata: {
      title: "Sample Content",
      duration: "Unknown",
      fetched_at: new Date().toISOString()
    }
  };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const commonWords = new Set([
    'that', 'this', 'with', 'from', 'they', 'were', 'been', 'have',
    'their', 'said', 'each', 'which', 'what', 'where', 'when', 'will',
    'more', 'some', 'time', 'very', 'into', 'just', 'also', 'only'
  ]);
  
  const wordCounts = {};
  words.forEach(word => {
    if (!commonWords.has(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  return Object.keys(wordCounts)
    .sort((a, b) => wordCounts[b] - wordCounts[a])
    .slice(0, 5);
}

/**
 * Classify segment type
 */
function classifySegment(text) {
  const lower = text.toLowerCase();
  
  if (/\b(statistic|data|research|study|percent|number)\b/.test(lower)) {
    return 'data';
  }
  if (/\b(story|example|case|experience|happened)\b/.test(lower)) {
    return 'narrative';
  }
  if (/\b(question|answer|q:|a:)\b/.test(lower)) {
    return 'qa';
  }
  if (/\b(introduction|welcome|hello|today)\b/.test(lower)) {
    return 'introduction';
  }
  if (/\b(conclusion|summary|closing|wrap)\b/.test(lower)) {
    return 'conclusion';
  }
  
  return 'content';
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
