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
        example: { content: 'Your transcript text here', enhancement_type: 'comprehensive' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Determine available provider
    const selectedProvider = provider || (env.OPENAI_API_KEY ? 'openai' : 
                                         env.ANTHROPIC_API_KEY ? 'anthropic' : null);
    
    if (!selectedProvider) {
      return new Response(JSON.stringify({
        error: 'No LLM provider configured',
        message: 'Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable',
        status: 'error'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    let enhancedContent;
    
    try {
      if (selectedProvider === 'openai') {
        enhancedContent = await enhanceWithOpenAI(content, enhancement_type, env);
      } else if (selectedProvider === 'anthropic') {
        enhancedContent = await enhanceWithAnthropic(content, enhancement_type, env);
      }
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          original_content: content,
          enhanced_content: enhancedContent.enhanced_text,
          enhancement_type: enhancement_type,
          provider: selectedProvider,
          improvements: enhancedContent.improvements,
          original_length: content.length,
          enhanced_length: enhancedContent.enhanced_text.length
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
          content: 'You are an expert podcast script writer and audio content creator. Transform raw transcripts into polished, engaging podcast content while maintaining the original meaning and tone.'
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
 * Build enhancement prompt based on type
 */
function buildEnhancementPrompt(content, enhancementType) {
  let basePrompt = `Please enhance the following transcript for podcast use. The transcript may contain:
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
    basePrompt += `

Additionally:
- Break content into logical segments
- Add topic headings where appropriate
- Identify key quotes or soundbites
- Note any technical terms that might need explanation
- Improve transitions between ideas`;
    
  } else if (enhancementType === 'minimal') {
    basePrompt += `

Focus only on:
- Basic grammar and punctuation corrections
- Removing obvious filler words
- Maintaining original structure and style`;
  }
  
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
