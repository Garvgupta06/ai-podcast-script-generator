// LLM integration handlers for Cloudflare Workers
import { corsHeaders } from '../utils/cors.js';

/**
 * Handle LLM content enhancement
 */
export async function handleLLMEnhancement(request, env) {
  try {
    const body = await request.json();
    const { content, enhancement_type = 'comprehensive', provider = null } = body;
    
    if (!content) {
      return new Response(JSON.stringify({
        error: 'Content is required for enhancement',
        example: { 
          content: 'Your article or transcript text here', 
          enhancement_type: 'comprehensive' // Options: minimal, comprehensive, conversational
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Validate enhancement type
    const validTypes = ['minimal', 'comprehensive', 'conversational'];
    if (!validTypes.includes(enhancement_type)) {
      return new Response(JSON.stringify({
        error: 'Invalid enhancement type',
        valid_types: validTypes,
        example: { content: 'Your text here', enhancement_type: 'comprehensive' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Determine available provider
    const selectedProvider = provider || (env.PERPLEXITY_API_KEY ? 'perplexity' : 
                                         env.OPENAI_API_KEY ? 'openai' : 
                                         env.ANTHROPIC_API_KEY ? 'anthropic' : null);
    
    if (!selectedProvider) {
      return new Response(JSON.stringify({
        error: 'No LLM provider configured',
        message: 'Set PERPLEXITY_API_KEY, OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable',
        status: 'error'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    let enhancedContent;
    
    try {
      if (selectedProvider === 'perplexity') {
        enhancedContent = await enhanceWithPerplexity(content, enhancement_type, env);
      } else if (selectedProvider === 'openai') {
        enhancedContent = await enhanceWithOpenAI(content, enhancement_type, env);
      } else if (selectedProvider === 'anthropic') {
        enhancedContent = await enhanceWithAnthropic(content, enhancement_type, env);
      }
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          original_content: content,
          enhanced_content: enhancedContent.enhanced_content || enhancedContent.enhanced_text,
          enhancement_type: enhancement_type,
          provider: selectedProvider,
          improvements: enhancedContent.improvements,
          original_length: content.length,
          enhanced_length: (enhancedContent.enhanced_content || enhancedContent.enhanced_text).length
        },
        processed_at: new Date().toISOString(),
        status: 'success'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (llmError) {
      console.error(`${selectedProvider} enhancement failed:`, llmError);
      
      // Fallback to basic enhancement
      const fallbackContent = basicContentEnhancement(content);
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          original_content: content,
          enhanced_content: fallbackContent,
          enhancement_type: 'fallback',
          provider: 'basic',
          improvements: [
            'Basic text cleanup',
            'Removed filler words',
            'Note: AI enhancement failed, using fallback method'
          ],
          original_length: content.length,
          enhanced_length: fallbackContent.length
        },
        processed_at: new Date().toISOString(),
        status: 'partial_success',
        warning: `${selectedProvider} API failed, used fallback enhancement`
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
  } catch (error) {
    console.error('LLM Enhancement error:', error);
    return new Response(JSON.stringify({
      error: 'Enhancement processing failed',
      message: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Enhance content using OpenAI
 */
async function enhanceWithOpenAI(content, enhancementType, env) {
  const prompt = buildEnhancementPrompt(content, enhancementType);
  
  console.log('Calling OpenAI API for content enhancement...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert podcast script writer and audio content creator. Transform raw transcripts into polished, engaging podcast content, fix any spelling errors or gramitical mistakes while maintaining the original meaning and tone.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const enhancedText = data.choices[0].message.content.trim();
  
  return {
    enhanced_text: enhancedText,
    improvements: [
      'AI-powered content enhancement using OpenAI',
      'Improved clarity and flow',
      'Removed filler words and repetitions',
      'Enhanced structure and readability',
      'Maintained original meaning and tone'
    ],
    token_usage: data.usage
  };
}

/**
 * Enhance content using Anthropic Claude
 */
async function enhanceWithAnthropic(content, enhancementType, env) {
  const prompt = buildEnhancementPrompt(content, enhancementType);
  
  console.log('Calling Anthropic API for content enhancement...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const enhancedText = data.content[0].text.trim();
  
  return {
    enhanced_text: enhancedText,
    improvements: [
      'AI-powered content enhancement using Anthropic Claude',
      'Improved clarity and flow',
      'Removed filler words and repetitions', 
      'Enhanced structure and readability',
      'Maintained original meaning and tone'
    ],
    usage: data.usage
  };
}

/**
 * LLM Handler for AI Podcast Script Generator
 * Updated: 02-09-2025 for Perplexity AI Integration
 * Handles AI content enhancement using Perplexity API
 */

/**
 * Main LLM handler function
 */
export async function handleLLMRequest(request, env) {
  try {
    const { content, enhancement_type } = await request.json();
    
    if (!content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content is required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const provider = env.DEFAULT_LLM_PROVIDER || 'perplexity';
    
    console.log(`Processing with provider: ${provider}`);
    
    let result;
    if (provider === 'perplexity') {
      result = await enhanceWithPerplexity(content, enhancement_type, env);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        enhanced_content: result.enhanced_content,
        provider: 'Perplexity AI',
        model: env.PERPLEXITY_MODEL || 'sonar-pro',
        improvements: result.improvements || ['Content enhanced with Perplexity AI']
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('LLM processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'LLM processing failed'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Enhance content using Perplexity AI
 */
async function enhanceWithPerplexity(content, enhancementType, env) {
  const prompt = buildEnhancementPrompt(content, enhancementType);
  
  console.log('Calling Perplexity API for content enhancement...');
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.PERPLEXITY_MODEL || 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are an expert podcast script writer and audio content creator. Transform raw transcripts into polished, engaging podcast content while maintaining the original meaning and tone.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: parseInt(env.LLM_MAX_TOKENS) || 2000,
      temperature: parseFloat(env.LLM_TEMPERATURE) || 0.3
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Perplexity API error status:', response.status);
    console.error('Perplexity API error text:', errorData);
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const data = await response.json();
  console.log('Perplexity API response structure:', JSON.stringify({
    hasChoices: !!data.choices,
    choicesLength: data.choices ? data.choices.length : 0,
    firstChoice: data.choices && data.choices[0] ? Object.keys(data.choices[0]) : 'none',
    fullResponse: data
  }));  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from Perplexity API');
  }
  
  const enhanced_content = data.choices[0].message.content;
  
  // Extract improvements from the enhancement
  const improvements = extractImprovements(enhanced_content, enhancementType);
  
  console.log('Perplexity enhancement completed successfully');
  
  return {
    enhanced_content,
    improvements,
    model_used: env.PERPLEXITY_MODEL || 'sonar-pro'
  };
}

/**
 * Extract improvements from enhanced content
 */
function extractImprovements(enhancedContent, enhancementType) {
  const improvements = [];
  
  switch (enhancementType) {
    case 'comprehensive':
      improvements.push(
        'AI-powered content enhancement using Perplexity AI',
        'Comprehensive grammar and clarity improvements',
        'Removed filler words and repetitions',
        'Enhanced structure and logical flow',
        'Improved readability and engagement',
        'Maintained original meaning and tone'
      );
      break;
    case 'minimal':
      improvements.push(
        'Basic grammar and punctuation corrections',
        'Removed obvious filler words',
        'Maintained original structure and tone'
      );
      break;
    default:
      improvements.push(
        'AI-powered content enhancement',
        'Improved clarity and flow',
        'Professional language optimization'
      );
  }
  
  return improvements;
}

/**
 * Build enhancement prompt based on type
 */
function buildEnhancementPrompt(content, enhancementType) {
  let basePrompt = `Please enhance the following podcast transcript content for better readability and flow. 

IMPORTANT INSTRUCTIONS:
- Convert written text to natural spoken language
- Fix grammatical errors and improve clarity
- Add natural conversation markers and transitions
- Maintain the original meaning and key information
- Make it sound conversational and engaging for audio
- Remove or fix any awkward phrasing

ORIGINAL CONTENT:
${content}

ENHANCEMENT REQUIREMENTS:`;

  if (enhancementType === 'comprehensive') {
    basePrompt += `

Additionally for COMPREHENSIVE enhancement:
- Break content into logical conversation segments
- Add topic headings and natural transition points
- Identify moments for host/guest interaction
- Note technical terms that need explanation
- Suggest where examples or stories would help
- Create opportunities for back-and-forth dialogue
- Add emphasis points and speaking cues
- Structure for interview or multi-host format potential`;
    
  } else if (enhancementType === 'minimal') {
    basePrompt += `

For MINIMAL enhancement, focus only on:
- Converting written to spoken language style
- Basic conversational flow improvements
- Maintaining original structure and content
- Simple clarity improvements`;

  } else if (enhancementType === 'conversational') {
    basePrompt += `

For CONVERSATIONAL enhancement:
- Transform article content into natural dialogue opportunities
- Add discussion points and questions
- Create natural speaking rhythm
- Improve engagement and flow
- Add conversational bridges between topics`;
  }

  basePrompt += `

Please provide the enhanced content that sounds natural when spoken aloud.`;

  return basePrompt;
}

/**
 * Basic content enhancement fallback
 */
function basicContentEnhancement(content) {
  return content
    // Remove common filler words
    .replace(/\b(um|uh|er|ah|like|you know|so um|well uh)\b/gi, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Remove timestamp markers
    .replace(/\[[\d:]+\]/g, '')
    // Clean up speaker tags (basic pattern)
    .replace(/^[A-Z\s]+:/gm, '')
    // Remove repetitive words
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    // Basic punctuation cleanup
    .replace(/([.!?])\s*([.!?])/g, '$1')
    .trim();
}
