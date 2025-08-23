// Transcript processing handlers for Cloudflare Workers  
import { corsHeaders } from '../utils/cors.js';

/**
 * Handle transcript processing
 */
export async function handleTranscriptProcessing(request, env) {
  try {
    const body = await request.json();
    const { transcript, source_type = 'manual', options = {} } = body;
    
    if (!transcript || typeof transcript !== 'string') {
      return new Response(JSON.stringify({
        error: 'Valid transcript text is required',
        example: {
          transcript: 'Your raw transcript text here...',
          source_type: 'manual',
          options: {}
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    if (transcript.length < 10) {
      return new Response(JSON.stringify({
        error: 'Transcript too short',
        message: 'Transcript must be at least 10 characters long'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log(`Processing transcript: ${transcript.length} characters, type: ${source_type}`);
    
    // Process the transcript
    const processed = await processTranscriptText(transcript, source_type, options);
    
    return new Response(JSON.stringify({
      success: true,
      data: processed,
      processed_at: new Date().toISOString(),
      status: 'success'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Transcript processing error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process transcript',
      message: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Core transcript processing logic
 */
async function processTranscriptText(transcript, sourceType = 'manual', options = {}) {
  try {
    // Step 1: Clean the transcript
    let cleaned = transcript
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
      // Remove timestamp markers
      .replace(/\[[\d:.,\s-]+\]/g, '')
      .replace(/\d{1,2}:\d{2}:\d{2}/g, '')
      // Remove speaker tags (more comprehensive)
      .replace(/^[A-Z][A-Z\s]*:/gm, '')
      .replace(/Speaker\s*\d+:/gi, '')
      .replace(/Host:/gi, '')
      .replace(/Interviewer:/gi, '')
      .replace(/Guest:/gi, '')
      // Remove common transcript artifacts
      .replace(/\[inaudible\]/gi, '')
      .replace(/\[crosstalk\]/gi, '')
      .replace(/\[laughter\]/gi, '')
      .replace(/\[music\]/gi, '');
    
    // Step 2: Remove filler words (optional based on options)
    if (options.remove_fillers !== false) {
      cleaned = cleaned.replace(/\b(um|uh|er|ah|like|you know|so um|well uh|i mean|you see)\b/gi, '');
    }
    
    // Step 3: Extract segments
    const paragraphs = cleaned
      .split(/\n\s*\n|\.{2,}|\n\n/)
      .map(p => p.replace(/\n/g, ' ').trim())
      .filter(p => p.length > 10); // Filter very short segments
    
    // If no natural breaks found, split by sentences
    if (paragraphs.length === 1 && cleaned.length > 500) {
      const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const segmentSize = Math.ceil(sentences.length / Math.max(3, Math.ceil(sentences.length / 5)));
      
      paragraphs.length = 0;
      for (let i = 0; i < sentences.length; i += segmentSize) {
        const segment = sentences.slice(i, i + segmentSize).join('. ').trim();
        if (segment.length > 0) {
          paragraphs.push(segment + '.');
        }
      }
    }
    
    // Step 4: Create detailed segments
    const segments = paragraphs.map((text, index) => {
      const wordCount = countWords(text);
      const keywords = extractKeywords(text);
      const segmentType = classifySegment(text);
      const estimatedDuration = estimateSpeakingDuration(text);
      
      return {
        id: index + 1,
        text: text.trim(),
        word_count: wordCount,
        estimated_duration: estimatedDuration,
        topic_keywords: keywords.slice(0, 5),
        segment_type: segmentType,
        importance_score: calculateImportanceScore(text, keywords),
        readability_score: calculateReadabilityScore(text)
      };
    });
    
    // Step 5: Calculate overall statistics
    const totalWords = segments.reduce((sum, seg) => sum + seg.word_count, 0);
    const totalDuration = segments.reduce((sum, seg) => sum + seg.estimated_duration, 0);
    
    return {
      original_text: transcript,
      cleaned_text: cleaned,
      segments: segments,
      statistics: {
        total_segments: segments.length,
        total_word_count: totalWords,
        estimated_total_duration: Math.round(totalDuration * 100) / 100, // minutes
        average_words_per_segment: Math.round(totalWords / segments.length),
        content_distribution: getContentDistribution(segments)
      },
      metadata: {
        source_type: sourceType,
        processing_options: options,
        processed_at: new Date().toISOString(),
        original_length: transcript.length,
        cleaned_length: cleaned.length,
        compression_ratio: Math.round((1 - cleaned.length / transcript.length) * 100)
      }
    };
    
  } catch (error) {
    console.error('Error in processTranscriptText:', error);
    throw new Error(`Transcript processing failed: ${error.message}`);
  }
}

/**
 * Count words in text
 */
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  // Convert to lowercase and remove punctuation
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Common stop words to exclude
  const stopWords = new Set([
    'that', 'this', 'with', 'from', 'they', 'were', 'been', 'have',
    'their', 'said', 'each', 'which', 'what', 'where', 'when', 'will',
    'more', 'some', 'time', 'very', 'into', 'just', 'also', 'only',
    'about', 'after', 'first', 'would', 'there', 'could', 'other',
    'make', 'know', 'think', 'see', 'come', 'way', 'work', 'life',
    'right', 'down', 'call', 'over', 'back', 'find', 'want', 'even',
    'take', 'look', 'feel', 'good', 'well', 'great', 'little', 'much'
  ]);
  
  // Count word frequencies
  const wordCounts = {};
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // Return most frequent words
  return Object.keys(wordCounts)
    .sort((a, b) => wordCounts[b] - wordCounts[a])
    .filter(word => wordCounts[word] > 1 || words.length < 50); // Include single occurrences for short text
}

/**
 * Classify segment type based on content
 */
function classifySegment(text) {
  const lower = text.toLowerCase();
  
  // Statistical/data content
  if (/\b(statistic|statistics|data|research|study|studies|percent|percentage|number|numbers|figure|figures|survey|analysis|report|finding|findings)\b/.test(lower)) {
    return 'data';
  }
  
  // Narrative/story content  
  if (/\b(story|stories|example|examples|case|experience|experienced|happened|occurred|situation|incident|anecdote|narrative)\b/.test(lower)) {
    return 'narrative';
  }
  
  // Question/answer content
  if (/\b(question|questions|answer|answers|q:|a:|asked|asking|wondering|curious)\b/.test(lower)) {
    return 'qa';
  }
  
  // Introduction/welcome content
  if (/\b(introduction|introduce|introducing|welcome|hello|hi|today|episode|begin|beginning|start|starting)\b/.test(lower)) {
    return 'introduction';
  }
  
  // Conclusion/summary content
  if (/\b(conclusion|conclusions|summary|summarize|closing|close|wrap|wrapping|end|ending|finally|lastly|overall)\b/.test(lower)) {
    return 'conclusion';
  }
  
  // Technical/explanation content
  if (/\b(technical|technology|explain|explanation|process|method|system|algorithm|approach|technique|concept|theory)\b/.test(lower)) {
    return 'technical';
  }
  
  // Opinion/commentary content
  if (/\b(opinion|opinions|believe|think|feel|personal|perspective|view|views|commentary|comment|thoughts)\b/.test(lower)) {
    return 'opinion';
  }
  
  return 'content'; // Default type
}

/**
 * Estimate speaking duration for text
 */
function estimateSpeakingDuration(text) {
  const wordCount = countWords(text);
  
  // Average speaking rates (words per minute)
  const speakingRates = {
    slow: 120,
    normal: 150,
    fast: 180
  };
  
  // Use normal speaking rate by default
  const wordsPerMinute = speakingRates.normal;
  
  // Calculate duration in minutes
  const durationMinutes = wordCount / wordsPerMinute;
  
  return Math.round(durationMinutes * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate importance score for segment
 */
function calculateImportanceScore(text, keywords) {
  let score = 0;
  const lower = text.toLowerCase();
  
  // Keyword density
  score += keywords.length * 10;
  
  // Length bonus (longer segments often contain more information)
  score += Math.min(text.length / 100, 20);
  
  // Content type bonuses
  if (/\b(important|crucial|key|significant|essential|critical|major|primary|main)\b/.test(lower)) {
    score += 15;
  }
  
  if (/\b(research|study|data|evidence|proof|findings|results)\b/.test(lower)) {
    score += 10;
  }
  
  if (/\b(new|latest|recent|breakthrough|discovery|innovation)\b/.test(lower)) {
    score += 8;
  }
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Calculate basic readability score
 */
function calculateReadabilityScore(text) {
  const words = countWords(text);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  if (sentences === 0) return 50; // Default score
  
  const avgWordsPerSentence = words / sentences;
  
  // Simple readability metric (inverse of average sentence length)
  // Lower average = higher readability score
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));
  
  return Math.round(readabilityScore);
}

/**
 * Get content distribution statistics
 */
function getContentDistribution(segments) {
  const distribution = {};
  
  segments.forEach(segment => {
    const type = segment.segment_type;
    if (!distribution[type]) {
      distribution[type] = {
        count: 0,
        total_duration: 0,
        total_words: 0
      };
    }
    
    distribution[type].count++;
    distribution[type].total_duration += segment.estimated_duration;
    distribution[type].total_words += segment.word_count;
  });
  
  // Calculate percentages
  const totalSegments = segments.length;
  const totalDuration = segments.reduce((sum, seg) => sum + seg.estimated_duration, 0);
  const totalWords = segments.reduce((sum, seg) => sum + seg.word_count, 0);
  
  Object.keys(distribution).forEach(type => {
    distribution[type].percentage_of_segments = Math.round((distribution[type].count / totalSegments) * 100);
    distribution[type].percentage_of_duration = Math.round((distribution[type].total_duration / totalDuration) * 100);
    distribution[type].percentage_of_words = Math.round((distribution[type].total_words / totalWords) * 100);
  });
  
  return distribution;
}
