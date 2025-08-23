// Content fetching handlers for Cloudflare Workers
import { corsHeaders } from '../utils/cors.js';

/**
 * Handle content fetching from external sources
 */
export async function handleContentFetch(request, env) {
  try {
    const body = await request.json();
    const { source_url, source_type, options = {} } = body;
    
    if (!source_url) {
      return new Response(JSON.stringify({
        error: 'Source URL is required',
        example: {
          source_url: 'https://example.com/content',
          source_type: 'web_article',
          options: {}
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log(`Fetching content from: ${source_url}, type: ${source_type}`);
    
    // Fetch content based on source type
    const result = await fetchExternalContent(source_url, source_type, options);
    
    return new Response(JSON.stringify({
      success: true,
      data: result,
      fetched_at: new Date().toISOString(),
      status: 'success'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Content fetch error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch content',
      message: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Fetch content from external sources
 */
async function fetchExternalContent(sourceUrl, sourceType, options = {}) {
  switch (sourceType) {
    case 'youtube':
      return await fetchYouTubeContent(sourceUrl, options);
    case 'web_article':
      return await fetchWebArticle(sourceUrl, options);
    case 'news_url':
      return await fetchNewsArticle(sourceUrl, options);
    case 'podcast_rss':
      return await fetchPodcastRSS(sourceUrl, options);
    default:
      return await fetchGenericWebContent(sourceUrl, options);
  }
}

/**
 * Fetch YouTube content (transcript/captions)
 */
async function fetchYouTubeContent(url, options = {}) {
  try {
    // Extract video ID from various YouTube URL formats
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }
    
    console.log(`Extracting YouTube content for video: ${videoId}`);
    
    // For demo purposes, return a placeholder
    // In production, you would use YouTube API or transcript extraction service
    return {
      source_url: url,
      video_id: videoId,
      title: 'YouTube Video (Title extraction not implemented)',
      transcript: `This is a placeholder transcript for YouTube video ${videoId}. 
      
In a production environment, this would contain the actual video transcript extracted using:
- YouTube Data API v3 for video metadata
- YouTube Transcript API for captions/subtitles
- Or a third-party service like AssemblyAI for audio transcription

The transcript would include speaker attribution, timestamps, and properly formatted text suitable for podcast script generation.`,
      duration: 'Unknown',
      metadata: {
        platform: 'youtube',
        video_id: videoId,
        fetched_at: new Date().toISOString(),
        language: options.language || 'en',
        note: 'This is a placeholder implementation. Production version would fetch real transcript.'
      }
    };
    
  } catch (error) {
    throw new Error(`YouTube content fetch failed: ${error.message}`);
  }
}

/**
 * Fetch web article content
 */
async function fetchWebArticle(url, options = {}) {
  try {
    console.log(`Fetching web article: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Podcast-Generator/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const extracted = extractArticleContent(html, url);
    
    return {
      source_url: url,
      title: extracted.title,
      transcript: extracted.content,
      metadata: {
        platform: 'web_article',
        word_count: extracted.content.split(/\s+/).length,
        extracted_at: new Date().toISOString(),
        author: extracted.author,
        publish_date: extracted.publishDate
      }
    };
    
  } catch (error) {
    throw new Error(`Web article fetch failed: ${error.message}`);
  }
}

/**
 * Fetch news article content
 */
async function fetchNewsArticle(url, options = {}) {
  try {
    console.log(`Fetching news article: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Podcast-Generator/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const extracted = extractNewsContent(html, url);
    
    return {
      source_url: url,
      title: extracted.title,
      transcript: extracted.content,
      metadata: {
        platform: 'news_article',
        word_count: extracted.content.split(/\s+/).length,
        extracted_at: new Date().toISOString(),
        author: extracted.author,
        publish_date: extracted.publishDate,
        source: extracted.source
      }
    };
    
  } catch (error) {
    throw new Error(`News article fetch failed: ${error.message}`);
  }
}

/**
 * Fetch podcast RSS content
 */
async function fetchPodcastRSS(url, options = {}) {
  try {
    console.log(`Fetching podcast RSS: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AI-Podcast-Generator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xml = await response.text();
    const parsed = parseRSSFeed(xml);
    
    return {
      source_url: url,
      title: `${parsed.title} - Latest Episode`,
      transcript: parsed.latestEpisode.description,
      metadata: {
        platform: 'podcast_rss',
        podcast_title: parsed.title,
        episode_title: parsed.latestEpisode.title,
        episode_date: parsed.latestEpisode.pubDate,
        duration: parsed.latestEpisode.duration,
        extracted_at: new Date().toISOString()
      }
    };
    
  } catch (error) {
    throw new Error(`Podcast RSS fetch failed: ${error.message}`);
  }
}

/**
 * Fetch generic web content
 */
async function fetchGenericWebContent(url, options = {}) {
  try {
    console.log(`Fetching generic web content: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Podcast-Generator/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const extracted = extractGenericContent(html, url);
    
    return {
      source_url: url,
      title: extracted.title || 'Untitled Content',
      transcript: extracted.content,
      metadata: {
        platform: 'generic_web',
        word_count: extracted.content.split(/\s+/).length,
        extracted_at: new Date().toISOString(),
        content_type: 'text'
      }
    };
    
  } catch (error) {
    throw new Error(`Generic web content fetch failed: ${error.message}`);
  }
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Extract article content from HTML
 */
function extractArticleContent(html, url) {
  // Basic content extraction (in production, use proper HTML parsing library)
  try {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
    
    // Extract meta description as fallback
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    
    // Remove scripts and styles
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If content is too long, try to extract main content area
    if (content.length > 5000) {
      const paragraphs = content.split(/\.\s+/).slice(0, 20);
      content = paragraphs.join('. ');
    }
    
    // Extract author if available
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const author = authorMatch ? authorMatch[1] : null;
    
    // Extract publish date if available
    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const publishDate = dateMatch ? dateMatch[1] : null;
    
    return {
      title: title.replace(/&[^;]+;/g, ''),
      content: content || metaDescMatch?.[1] || 'Could not extract article content',
      author,
      publishDate
    };
    
  } catch (error) {
    console.error('Article content extraction error:', error);
    return {
      title: 'Extraction Error',
      content: 'Could not extract content from this article',
      author: null,
      publishDate: null
    };
  }
}

/**
 * Extract news content with news-specific patterns
 */
function extractNewsContent(html, url) {
  try {
    // Extract title (try multiple patterns for news sites)
    let titleMatch = html.match(/<h1[^>]*class=["'][^"']*headline[^"']*["'][^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/<title[^>]*>([^<]+)<\/title>/i);
    
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled News Article';
    
    // Extract source name from URL
    const sourceMatch = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
    const source = sourceMatch ? sourceMatch[1] : 'Unknown Source';
    
    // Extract content (similar to article but with news-specific patterns)
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract author
    const authorMatch = html.match(/(?:by\s+|author[:"]\s*)([A-Za-z\s]+)/i);
    const author = authorMatch ? authorMatch[1].trim() : null;
    
    // Extract publish date
    const dateMatch = html.match(/<time[^>]*datetime=["']([^"']+)["'][^>]*>/i) ||
                      html.match(/published[:"]\s*["']?([^"'<>\n]+)["']?/i);
    const publishDate = dateMatch ? dateMatch[1] : null;
    
    return {
      title: title.replace(/&[^;]+;/g, ''),
      content: content || 'Could not extract news content',
      author,
      publishDate,
      source
    };
    
  } catch (error) {
    console.error('News content extraction error:', error);
    return {
      title: 'Extraction Error',
      content: 'Could not extract content from this news article',
      author: null,
      publishDate: null,
      source: 'Unknown'
    };
  }
}

/**
 * Parse RSS feed XML
 */
function parseRSSFeed(xml) {
  try {
    // Basic RSS parsing (in production, use proper XML parser)
    const titleMatch = xml.match(/<title[^>]*><!\[CDATA\[([^\]]+)\]\]><\/title>|<title[^>]*>([^<]+)<\/title>/i);
    const title = (titleMatch?.[1] || titleMatch?.[2] || 'Unknown Podcast').trim();
    
    // Find the first item (latest episode)
    const itemMatch = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/i);
    if (!itemMatch) {
      throw new Error('No episodes found in RSS feed');
    }
    
    const itemContent = itemMatch[1];
    
    // Extract episode details
    const episodeTitleMatch = itemContent.match(/<title[^>]*><!\[CDATA\[([^\]]+)\]\]><\/title>|<title[^>]*>([^<]+)<\/title>/i);
    const episodeTitle = (episodeTitleMatch?.[1] || episodeTitleMatch?.[2] || 'Untitled Episode').trim();
    
    const descriptionMatch = itemContent.match(/<description[^>]*><!\[CDATA\[([^\]]+)\]\]><\/description>|<description[^>]*>([^<]+)<\/description>/i);
    const description = (descriptionMatch?.[1] || descriptionMatch?.[2] || 'No description available').trim();
    
    const pubDateMatch = itemContent.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : null;
    
    const durationMatch = itemContent.match(/<itunes:duration[^>]*>([^<]+)<\/itunes:duration>/i);
    const duration = durationMatch ? durationMatch[1].trim() : 'Unknown';
    
    return {
      title,
      latestEpisode: {
        title: episodeTitle,
        description,
        pubDate,
        duration
      }
    };
    
  } catch (error) {
    console.error('RSS parsing error:', error);
    throw new Error(`Failed to parse RSS feed: ${error.message}`);
  }
}

/**
 * Extract generic content from HTML
 */
function extractGenericContent(html, url) {
  try {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    
    // Remove scripts, styles, and other non-content elements
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit content length for processing
    if (content.length > 10000) {
      content = content.substring(0, 10000) + '...';
    }
    
    return {
      title: title?.replace(/&[^;]+;/g, ''),
      content: content || 'Could not extract content from this page'
    };
    
  } catch (error) {
    console.error('Generic content extraction error:', error);
    return {
      title: 'Extraction Error',
      content: 'Could not extract content from this page'
    };
  }
}
