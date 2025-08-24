// Content processing handlers for Cloudflare Workers - URL fetching removed
import { corsHeaders } from '../utils/cors.js';

/**
 * Handle manual content input processing
 */
export async function handleContentFetch(request, env) {
  try {
    const body = await request.json();
    const { content, source_type = 'manual', options = {} } = body;
    
    if (!content) {
      return new Response(JSON.stringify({
        error: 'Content is required',
        message: 'Please provide content text directly. URL fetching has been removed.',
        example: {
          content: 'Your transcript or article text here...',
          source_type: 'manual',
          options: {}
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log(`Processing manual content, type: ${source_type}`);
    
    // Process the provided content
    const result = await processManualContent(content, source_type, options);
    
    return new Response(JSON.stringify({
      success: true,
      data: result,
      processed_at: new Date().toISOString(),
      status: 'success'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Content processing error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process content',
      message: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Process manually provided content
 */
async function processManualContent(content, sourceType, options = {}) {
  try {
    // Basic content processing and validation
    const cleanContent = content.trim();
    
    if (cleanContent.length < 50) {
      throw new Error('Content is too short. Please provide at least 50 characters of content.');
    }
    
    if (cleanContent.length > 50000) {
      throw new Error('Content is too long. Please limit to 50,000 characters.');
    }
    
    // Estimate reading time and basic stats
    const wordCount = cleanContent.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed
    
    // Generate a title from the first sentence or first 50 characters
    const firstSentence = cleanContent.split('.')[0];
    const title = firstSentence.length > 5 && firstSentence.length < 100 
      ? firstSentence.trim() 
      : cleanContent.substring(0, 50).trim() + '...';
    
    return {
      source_type: sourceType,
      title: title,
      transcript: cleanContent,
      word_count: wordCount,
      estimated_reading_time: readingTimeMinutes,
      metadata: {
        platform: 'manual_input',
        processed_at: new Date().toISOString(),
        content_length: cleanContent.length,
        source_type: sourceType
      }
    };
    
  } catch (error) {
    throw new Error(`Content processing failed: ${error.message}`);
  }
}
