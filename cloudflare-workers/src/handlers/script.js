// Script generation handlers for Cloudflare Workers
import { corsHeaders } from '../utils/cors.js';

/**
 * Handle transcript processing (cleaning and structuring)
 */
export async function handleTranscriptProcessing(request, env) {
  try {
    const body = await request.json();
    const { transcript, source_type = 'manual' } = body;
    
    if (!transcript || !transcript.trim()) {
      return new Response(JSON.stringify({
        error: 'Transcript text is required',
        example: {
          transcript: 'Your raw transcript text here...',
          source_type: 'manual'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log(`Processing transcript (${transcript.length} characters, source: ${source_type})`);
    
    // Process the transcript
    const processed = processTranscript(transcript, source_type);
    
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
 * Process raw transcript into structured segments
 */
function processTranscript(rawTranscript, sourceType = 'manual') {
  // Clean the transcript
  const cleanedTranscript = cleanTranscript(rawTranscript);
  
  // Split into segments
  const segments = segmentTranscript(cleanedTranscript);
  
  // Analyze segments
  const analyzedSegments = segments.map((segment, index) => ({
    id: index + 1,
    text: segment.text,
    word_count: segment.text.split(/\s+/).length,
    estimated_duration: estimateSegmentDuration(segment.text),
    segment_type: classifySegmentType(segment.text),
    topic_keywords: extractKeywords(segment.text),
    importance_score: calculateImportanceScore(segment.text),
    clean_score: calculateCleanScore(segment.text)
  }));
  
  const totalWordCount = analyzedSegments.reduce((sum, seg) => sum + seg.word_count, 0);
  const totalDuration = analyzedSegments.reduce((sum, seg) => sum + seg.estimated_duration, 0);
  
  return {
    segments: analyzedSegments,
    total_segments: analyzedSegments.length,
    total_word_count: totalWordCount,
    estimated_total_duration: Math.round(totalDuration * 100) / 100,
    source_type: sourceType,
    processing_notes: [
      'Cleaned filler words and repetitions',
      'Segmented into logical topic groups',
      'Added duration estimates',
      'Classified content types'
    ],
    quality_score: calculateOverallQuality(analyzedSegments)
  };
}

/**
 * Clean raw transcript text
 */
function cleanTranscript(rawText) {
  return rawText
    // Remove timestamps
    .replace(/\[\d{2}:\d{2}:\d{2}\]/g, '')
    .replace(/\d{1,2}:\d{2}:\d{2}/g, '')
    
    // Remove speaker labels that are just names/numbers
    .replace(/^[A-Z][a-z]*\s*:\s*/gm, '')
    .replace(/^Speaker\s*\d*\s*:\s*/gm, '')
    
    // Clean up filler words (but don't be too aggressive)
    .replace(/\b(um|uh|er|ah|like|you know|basically|actually)\b/gi, '')
    
    // Fix spacing and punctuation
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*([a-z])/g, '$1 $2')
    .replace(/([a-z])([.!?])/g, '$1$2')
    
    // Clean up quotes and formatting
    .replace(/[""]([^"""]*?)[""]?/g, '"$1"')
    .replace(/['']([^''']*?)['']?/g, "'$1'")
    
    // Remove extra whitespace
    .trim();
}

/**
 * Segment transcript into logical sections
 */
function segmentTranscript(cleanText) {
  // Split by strong sentence endings followed by potential topic changes
  const sentences = cleanText.split(/(?<=[.!?])\s+(?=[A-Z])/);
  
  const segments = [];
  let currentSegment = '';
  let sentenceCount = 0;
  
  for (const sentence of sentences) {
    if (sentence.trim().length === 0) continue;
    
    currentSegment += (currentSegment ? ' ' : '') + sentence.trim();
    sentenceCount++;
    
    // Create segment if we hit limits or find a natural break
    const shouldBreak = 
      sentenceCount >= 3 && currentSegment.length >= 200 ||  // 3+ sentences and 200+ chars
      currentSegment.length >= 500 ||                        // Hard limit of 500 chars
      detectTopicShift(sentence);                           // Topic shift detected
    
    if (shouldBreak) {
      if (currentSegment.trim().length > 50) { // Minimum segment size
        segments.push({
          text: currentSegment.trim(),
          sentence_count: sentenceCount
        });
      }
      currentSegment = '';
      sentenceCount = 0;
    }
  }
  
  // Add remaining content
  if (currentSegment.trim().length > 50) {
    segments.push({
      text: currentSegment.trim(),
      sentence_count: sentenceCount
    });
  }
  
  return segments;
}

/**
 * Detect potential topic shifts
 */
function detectTopicShift(sentence) {
  const topicShiftIndicators = [
    /^(Now|So|Next|However|But|Meanwhile|On the other hand|Speaking of|Moving on)/i,
    /\b(let's talk about|another point|next topic|shifting gears)\b/i,
    /\b(in contrast|conversely|alternatively|moreover|furthermore)\b/i
  ];
  
  return topicShiftIndicators.some(pattern => pattern.test(sentence));
}

/**
 * Classify segment type based on content
 */
function classifySegmentType(text) {
  const lowerText = text.toLowerCase();
  
  // Data/Statistics
  if (/\b(\d+%|percent|statistics|data|research|study|survey|report)\b/i.test(text) ||
      /\b(\d+,?\d*|\d+\.\d+)\s*(million|billion|thousand|times|fold)\b/i.test(text)) {
    return 'data';
  }
  
  // Questions/Interactive
  if (/\?/.test(text) || /\b(question|ask|wonder|curious|what if|how about)\b/i.test(text)) {
    return 'qa';
  }
  
  // Technical/Educational
  if (/\b(process|method|algorithm|system|technology|technique|approach|framework)\b/i.test(text)) {
    return 'technical';
  }
  
  // Opinion/Commentary
  if (/\b(I think|believe|opinion|perspective|view|feel|personally|in my view)\b/i.test(text)) {
    return 'opinion';
  }
  
  // Narrative/Story
  if (/\b(story|example|case|experience|happened|occurred|instance|situation)\b/i.test(text)) {
    return 'narrative';
  }
  
  // Default to informational
  return 'informational';
}

/**
 * Extract key topic keywords
 */
function extractKeywords(text) {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  // Extract words (2+ chars, not all caps unless reasonable length)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= 2 && 
      !stopWords.has(word) &&
      !/^\d+$/.test(word) &&
      (word.length >= 4 || !/^[A-Z]+$/.test(word))
    );
  
  // Count word frequency
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Get top keywords, prioritizing longer words and higher frequency
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count, score: count * (word.length > 4 ? 1.5 : 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.word);
}

/**
 * Calculate importance score (0-100)
 */
function calculateImportanceScore(text) {
  let score = 50; // Base score
  
  // Length factor
  if (text.length > 200) score += 10;
  if (text.length > 400) score += 10;
  
  // Content indicators
  if (/\b(important|significant|crucial|key|main|primary|essential)\b/i.test(text)) score += 15;
  if (/\b(data|research|study|statistics|evidence)\b/i.test(text)) score += 10;
  if (/\b(example|case|story|experience)\b/i.test(text)) score += 8;
  if (/[?!]/.test(text)) score += 5;
  
  // Complexity indicators
  if (/\b(however|therefore|moreover|furthermore|consequently)\b/i.test(text)) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate cleanliness score (0-100)
 */
function calculateCleanScore(text) {
  let score = 100;
  
  // Penalize filler words
  const fillerCount = (text.match(/\b(um|uh|er|ah|like|you know|basically|actually)\b/gi) || []).length;
  score -= fillerCount * 5;
  
  // Penalize repetition
  const words = text.toLowerCase().split(/\s+/);
  const wordSet = new Set(words);
  const repetitionRatio = (words.length - wordSet.size) / words.length;
  score -= repetitionRatio * 30;
  
  // Penalize poor punctuation
  if (!/[.!?]$/.test(text.trim())) score -= 10;
  
  return Math.max(0, score);
}

/**
 * Estimate speaking duration in minutes
 */
function estimateSegmentDuration(text) {
  const wordCount = text.split(/\s+/).length;
  const avgWordsPerMinute = 150; // Average speaking pace
  return Math.round((wordCount / avgWordsPerMinute) * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate overall quality score
 */
function calculateOverallQuality(segments) {
  if (segments.length === 0) return 0;
  
  const avgCleanScore = segments.reduce((sum, seg) => sum + seg.clean_score, 0) / segments.length;
  const avgImportanceScore = segments.reduce((sum, seg) => sum + seg.importance_score, 0) / segments.length;
  const lengthScore = Math.min(100, (segments.length / 5) * 100); // Ideal: 5+ segments
  
  return Math.round((avgCleanScore * 0.4 + avgImportanceScore * 0.4 + lengthScore * 0.2) * 100) / 100;
}

/**
 * Handle complete podcast script generation
 */
export async function handleScriptGeneration(request, env) {
  try {
    const body = await request.json();
    const { 
      processed_transcript, 
      show_config = {}, 
      script_options = {},
      use_llm = true
    } = body;
    
    if (!processed_transcript || !processed_transcript.segments) {
      return new Response(JSON.stringify({
        error: 'Processed transcript with segments is required',
        example: {
          processed_transcript: {
            segments: [/* segment objects */]
          },
          show_config: {
            show_name: 'My Podcast',
            host_name: 'Host Name'
          }
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log(`Generating script for ${processed_transcript.segments.length} segments`);
    
    // Generate the complete podcast script
    const script = await generatePodcastScript(
      processed_transcript, 
      show_config, 
      script_options,
      use_llm ? env : null
    );
    
    return new Response(JSON.stringify({
      success: true,
      data: script,
      generated_at: new Date().toISOString(),
      status: 'success'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Script generation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate script',
      message: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Generate complete podcast script
 */
async function generatePodcastScript(processedTranscript, showConfig = {}, scriptOptions = {}, env = null) {
  const config = {
    show_name: 'AI Insights Podcast',
    host_name: 'HOST',
    show_tagline: 'Exploring the future of technology',
    episode_title: '',
    speakers: {
      format: 'single_host',
      host_name: 'HOST',
      guest_name: 'GUEST',
      co_host_name: 'CO-HOST'
    },
    ...showConfig
  };
  
  // Ensure speakers config exists and merge with provided config
  if (!config.speakers) {
    config.speakers = {
      format: 'single_host',
      host_name: config.host_name || 'HOST',
      guest_name: 'GUEST',
      co_host_name: 'CO-HOST'
    };
  } else {
    // Merge with defaults  
    config.speakers = {
      format: config.speakers.format || 'single_host',
      host_name: config.speakers.host_name || config.host_name || 'HOST',
      guest_name: config.speakers.guest_name || 'GUEST',
      co_host_name: config.speakers.co_host_name || 'CO-HOST'
    };
  }
  
  const segments = processedTranscript.segments || [];
  
  console.log('Generating script components...');
  
  // Generate intro
  const intro = await generateIntro(segments, config, env);
  
  // Generate main content
  const mainContent = await generateMainContent(segments, config, env);
  
  // Generate outro
  const outro = await generateOutro(segments, config, env);
  
  // Generate show notes
  const showNotes = generateShowNotes(segments, config);
  
  // Generate transitions
  const transitions = generateTransitions(segments, config);
  
  // Calculate total duration
  const totalDuration = intro.estimated_duration + 
                       mainContent.reduce((sum, content) => sum + content.estimated_duration, 0) + 
                       outro.estimated_duration +
                       (transitions.length * 0.25); // 15 seconds per transition
  
  return {
    intro,
    main_content: mainContent,
    outro,
    show_notes: showNotes,
    transitions,
    metadata: {
      total_duration: Math.round(totalDuration * 100) / 100,
      segment_count: segments.length,
      transition_count: transitions.length,
      show_config: config,
      speaker_format: config.speakers.format,
      generated_at: new Date().toISOString(),
      llm_enhanced: env ? true : false
    }
  };
}

/**
 * Generate intro section with optional LLM enhancement
 */
async function generateIntro(segments, config, env = null) {
  const topicPreview = segments.slice(0, 3)
    .map(seg => seg.topic_keywords?.[0])
    .filter(Boolean)
    .join(', ');
  
  let script;
  
  if (env && (env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY)) {
    try {
      script = await generateLLMIntro(segments, config, env);
      console.log('Generated intro with LLM enhancement');
    } catch (error) {
      console.error('LLM intro generation failed, using template:', error);
      script = generateTemplateIntro(segments, config, topicPreview);
    }
  } else {
    script = generateTemplateIntro(segments, config, topicPreview);
  }
  
  return {
    script,
    estimated_duration: 1.5, // 1.5 minutes
    music_cues: ['intro_music', 'transition_sound'],
    type: 'introduction'
  };
}

/**
 * Generate intro using LLM
 */
async function generateLLMIntro(segments, config, env) {
  const contentSummary = segments.slice(0, 3)
    .map(seg => seg.text.substring(0, 100)).join(' ... ');
  
  const speakers = config.speakers || {};
  const format = speakers.format || 'single_host';
  
  let prompt;
  
  if (format === 'interview') {
    prompt = `Create an engaging podcast intro script for an INTERVIEW FORMAT with host and guest based on the following:

Show Name: ${config.show_name}
Host Name: ${speakers.host_name}
Guest Name: ${speakers.guest_name}
Show Tagline: ${config.show_tagline}
Episode Content Preview: ${contentSummary}

Requirements:
1. Natural conversation between ${speakers.host_name} and ${speakers.guest_name}
2. Host introduces show and guest
3. Guest responds warmly and previews what they'll discuss
4. Hook the listener in the first 15 seconds
5. Set an enthusiastic but professional tone
6. Include natural speech patterns and back-and-forth dialogue
7. Add production cues in [BRACKETS]
8. Target duration: 60-90 seconds of spoken content

Format as a conversational script with clear speaker labels (${speakers.host_name}: and ${speakers.guest_name}:)

Intro Script:`;

  } else if (format === 'multi_host') {
    prompt = `Create an engaging podcast intro script for a MULTI-HOST FORMAT based on the following:

Show Name: ${config.show_name}
Host Name: ${speakers.host_name}
Co-Host Name: ${speakers.co_host_name}
Show Tagline: ${config.show_tagline}
Episode Content Preview: ${contentSummary}

Requirements:
1. Natural banter between ${speakers.host_name} and ${speakers.co_host_name}
2. Both hosts participate in introducing the show
3. Playful but professional dynamic
4. Hook the listener in the first 15 seconds
5. Preview key topics through conversation
6. Include natural speech patterns and back-and-forth
7. Add production cues in [BRACKETS]
8. Target duration: 60-90 seconds of spoken content

Format as a conversational script with clear speaker labels (${speakers.host_name}: and ${speakers.co_host_name}:)

Intro Script:`;

  } else {
    prompt = `Create an engaging podcast intro script for a SINGLE HOST FORMAT based on the following:

Show Name: ${config.show_name}
Host Name: ${speakers.host_name}
Show Tagline: ${config.show_tagline}
Episode Content Preview: ${contentSummary}

Requirements:
1. Hook the listener in the first 15 seconds
2. Preview key topics without spoilers
3. Set an enthusiastic but professional tone
4. Include natural speech patterns
5. Add production cues in [BRACKETS]
6. Target duration: 60-90 seconds of spoken content

Format as a conversational script with clear HOST labels and production notes.

Intro Script:`;
  }

  const provider = env.OPENAI_API_KEY ? 'openai' : 'anthropic';
  
  if (provider === 'openai') {
    return await callOpenAI(prompt, env, 800);
  } else {
    return await callAnthropic(prompt, env, 800);
  }
}

/**
 * Generate template-based intro
 */
function generateTemplateIntro(segments, config, topicPreview) {
  const speakers = config.speakers || {};
  const format = speakers.format || 'single_host';
  const hostName = speakers.host_name || 'HOST';
  
  if (format === 'interview') {
    const guestName = speakers.guest_name || 'GUEST';
    return `[INTRO MUSIC - 10 seconds]

${hostName}: Welcome to ${config.show_name}, I'm ${hostName}, and this is where ${config.show_tagline}.

[MUSIC FADES]

${hostName}: Today I'm joined by our special guest to explore ${topicPreview || 'fascinating insights and developments'} that I think you'll find really interesting.

${guestName}: Thanks for having me on the show. I'm excited to share some insights about this topic.

${hostName}: Absolutely! Let's dive right in.

[TRANSITION SOUND]`;
  
  } else if (format === 'multi_host') {
    const coHostName = speakers.co_host_name || 'CO-HOST';
    return `[INTRO MUSIC - 10 seconds]

${hostName}: Welcome to ${config.show_name}, I'm ${hostName}...

${coHostName}: ...and I'm ${coHostName}, and this is where ${config.show_tagline}.

[MUSIC FADES]

${hostName}: In today's episode, we're exploring ${topicPreview || 'fascinating insights and developments'} that I think you'll find really interesting.

${coHostName}: That's right! So let's dive right in.

[TRANSITION SOUND]`;
  
  } else {
    // single_host format (default)
    return `[INTRO MUSIC - 10 seconds]

${hostName}: Welcome to ${config.show_name}, I'm ${hostName}, and this is where ${config.show_tagline}.

[MUSIC FADES]

${hostName}: In today's episode, we're exploring ${topicPreview || 'fascinating insights and developments'} that I think you'll find really interesting.

[TRANSITION SOUND]

${hostName}: So let's dive right in.`;
  }
}

/**
 * Generate outro section with optional LLM enhancement
 */
async function generateOutro(segments, config, env = null) {
  let script;
  
  if (env && (env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY)) {
    try {
      script = await generateLLMOutro(segments, config, env);
      console.log('Generated outro with LLM enhancement');
    } catch (error) {
      console.error('LLM outro generation failed, using template:', error);
      script = generateTemplateOutro(config);
    }
  } else {
    script = generateTemplateOutro(config);
  }
  
  return {
    script,
    estimated_duration: 2.0, // 2 minutes
    music_cues: ['transition_music', 'outro_music'],
    type: 'conclusion'
  };
}

/**
 * Generate outro using LLM
 */
async function generateLLMOutro(segments, config, env) {
  const episodeSummary = `Discussion covering ${segments.length} key topics including ${segments.slice(0, 2).map(s => s.topic_keywords?.[0]).filter(Boolean).join(' and ')}`;
  
  const speakers = config.speakers || {};
  const format = speakers.format || 'single_host';
  
  let prompt;
  
  if (format === 'interview') {
    prompt = `Create a compelling podcast outro script for an INTERVIEW FORMAT based on:

Show Name: ${config.show_name}
Host Name: ${speakers.host_name}
Guest Name: ${speakers.guest_name}
Episode Summary: ${episodeSummary}

Requirements:
1. Natural conversation between ${speakers.host_name} and ${speakers.guest_name}
2. Host summarizes key takeaways with guest input
3. Guest shares where listeners can learn more
4. Host includes subscription call-to-action
5. Warm, professional closing from both speakers
6. Add production cues in [BRACKETS]
7. Target duration: 75-90 seconds

Format with clear speaker labels (${speakers.host_name}: and ${speakers.guest_name}:)

Outro Script:`;

  } else if (format === 'multi_host') {
    prompt = `Create a compelling podcast outro script for a MULTI-HOST FORMAT based on:

Show Name: ${config.show_name}
Host Name: ${speakers.host_name}
Co-Host Name: ${speakers.co_host_name}
Episode Summary: ${episodeSummary}

Requirements:
1. Natural banter between ${speakers.host_name} and ${speakers.co_host_name}
2. Both hosts summarize key takeaways together
3. Include subscription call-to-action
4. Tease next episode or general future content
5. Professional but warm closing from both
6. Add production cues in [BRACKETS]
7. Target duration: 75-90 seconds

Format with clear speaker labels (${speakers.host_name}: and ${speakers.co_host_name}:)

Outro Script:`;

  } else {
    prompt = `Create a compelling podcast outro script for a SINGLE HOST FORMAT based on:

Show Name: ${config.show_name}
Host Name: ${speakers.host_name}
Episode Summary: ${episodeSummary}

Requirements:
1. Summarize key takeaways (1-2 sentences)
2. Include subscription call-to-action
3. Tease next episode or general future content
4. Professional but warm closing
5. Add production cues in [BRACKETS]
6. Target duration: 60-75 seconds

Outro Script:`;
  }

  const provider = env.OPENAI_API_KEY ? 'openai' : 'anthropic';
  
  if (provider === 'openai') {
    return await callOpenAI(prompt, env, 600);
  } else {
    return await callAnthropic(prompt, env, 600);
  }
}

/**
 * Generate template-based outro
 */
function generateTemplateOutro(config) {
  const speakers = config.speakers || {};
  const format = speakers.format || 'single_host';
  const hostName = speakers.host_name || 'HOST';
  
  if (format === 'interview') {
    const guestName = speakers.guest_name || 'GUEST';
    return `[TRANSITION MUSIC - 5 seconds]

${hostName}: That's a wrap on today's episode of ${config.show_name}. We've covered some really fascinating ground, and I hope you found these insights as compelling as I do.

${guestName}: It's been a pleasure discussing these topics with you.

${hostName}: Absolutely! Before we wrap up, where can our listeners learn more about your work?

${guestName}: You can find me [GUEST CONTACT INFO TO BE FILLED].

${hostName}: Perfect! If you enjoyed this conversation, please subscribe wherever you get your podcasts and leave us a review.

${hostName}: Thanks for joining us today!

${guestName}: Thanks for having me!

${hostName}: I'm ${hostName}, thanks for listening to ${config.show_name}.

[OUTRO MUSIC - 15 seconds]`;
  
  } else if (format === 'multi_host') {
    const coHostName = speakers.co_host_name || 'CO-HOST';
    return `[TRANSITION MUSIC - 5 seconds]

${hostName}: That's a wrap on today's episode of ${config.show_name}. We've covered some really fascinating ground.

${coHostName}: Absolutely! I hope our listeners found these insights as valuable as we did.

${hostName}: If you enjoyed this episode, please subscribe wherever you get your podcasts and leave us a review.

${coHostName}: And we'll see you next time!

${hostName}: I'm ${hostName}...

${coHostName}: ...and I'm ${coHostName}, thanks for listening to ${config.show_name}.

[OUTRO MUSIC - 15 seconds]`;
  
  } else {
    // single_host format (default)  
    return `[TRANSITION MUSIC - 5 seconds]

${hostName}: That's a wrap on today's episode of ${config.show_name}. We've covered some really fascinating ground, and I hope you found these insights as compelling as I do.

${hostName}: If you enjoyed this episode, please subscribe wherever you get your podcasts and leave us a review - it really helps us reach more listeners.

${hostName}: Thanks for listening, I'm ${hostName}, and we'll see you next time.

[OUTRO MUSIC - 15 seconds]`;
  }
}

/**
 * Generate main content sections
 */
async function generateMainContent(segments, config, env = null) {
  const speakers = config.speakers || {};
  const format = speakers.format || 'single_host';
  const hostName = speakers.host_name || 'HOST';
  const guestName = speakers.guest_name || 'GUEST';
  const coHostName = speakers.co_host_name || 'CO-HOST';
  
  return segments.map((segment, index) => {
    let polishedText = segment.text;
    
    // Add hosting cues based on segment type and speaker format
    if (format === 'interview') {
      // Break content into meaningful chunks for natural conversation
      const sentences = polishedText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      let conversationalScript = '';
      
      // Always create conversation, even for shorter segments
      if (sentences.length >= 2) {
        // Distribute content between host and guest more naturally
        const midPoint = Math.ceil(sentences.length / 2);
        const firstPart = sentences.slice(0, midPoint).join(' ');
        const secondPart = sentences.slice(midPoint).join(' ');
        
        // Create varied conversation starters based on segment type and position
        const conversationStarters = {
          data: [
            "So tell us about the data you've been looking at.",
            "What do the numbers actually tell us here?",
            "I'd love to hear about your research on this.",
            "What did you discover when you looked into this?"
          ],
          technical: [
            "How does this actually work? Can you break it down for us?",
            "Walk us through the technical side of this.",
            "What's the process behind this?",
            "Can you explain the mechanics of this for our listeners?"
          ],
          narrative: [
            "Can you share an example that illustrates this?",
            "Tell us a story that brings this to life.",
            "What's a real-world example of this?",
            "Can you paint a picture of what this looks like?"
          ],
          opinion: [
            "What's your take on this?",
            "How do you see this situation?",
            "What's your perspective on this issue?",
            "What do you think about this development?"
          ],
          informational: [
            "Tell us more about this.",
            "What should people know about this?",
            "Help us understand this better.",
            "Break this down for our audience."
          ]
        };
        
        const followUps = [
          "That's fascinating. What makes this particularly significant?",
          "Interesting. What else should people know about this?",
          "That's a great point. Can you elaborate on that?",
          "Wow, that's compelling. What happens next?",
          "That's really insightful. What are the implications of this?"
        ];
        
        const closingResponses = [
          "That puts things in a whole new perspective.",
          "Thanks for breaking that down for us.",
          "That's absolutely fascinating.",
          "I think our listeners will find this really valuable.",
          "That really makes you think."
        ];
        
        // Select appropriate conversation elements
        const starters = conversationStarters[segment.segment_type] || conversationStarters.informational;
        const starter = starters[index % starters.length];
        const followUp = followUps[index % followUps.length];
        const closing = closingResponses[index % closingResponses.length];
        
        if (secondPart.trim().length > 20) {
          // Full conversation with follow-up
          conversationalScript = `${hostName}: ${starter}

${guestName}: ${firstPart}

${hostName}: ${followUp}

${guestName}: ${secondPart}

${hostName}: ${closing}

[NATURAL PAUSE]`;
        } else {
          // Shorter conversation
          conversationalScript = `${hostName}: ${starter}

${guestName}: ${firstPart}

${hostName}: ${closing}

[BRIEF PAUSE]`;
        }
        
      } else {
        // Single sentence - still create conversation
        const starters = [
          "What are your thoughts on this?",
          "Tell us about this.",
          "What should we know about this?",
          "Help us understand this."
        ];
        const starter = starters[index % starters.length];
        
        conversationalScript = `${hostName}: ${starter}

${guestName}: ${polishedText}

${hostName}: That's a great point. I think that really captures the essence of it.

[BRIEF PAUSE]`;
      }
      
      polishedText = conversationalScript;
      
    } else if (format === 'multi_host') {
      // Break content for co-host format with more natural flow
      const sentences = polishedText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      let conversationalScript = '';
      
      if (sentences.length >= 2) {
        const midPoint = Math.ceil(sentences.length / 2);
        const firstPart = sentences.slice(0, midPoint).join(' ');
        const secondPart = sentences.slice(midPoint).join(' ');
        
        // Varied conversation starters for co-hosts
        const coHostStarters = [
          "I've been looking into something interesting.",
          "Here's something that caught my attention.",
          "Let me share something fascinating.",
          "I discovered something really important.",
          "There's something we need to talk about."
        ];
        
        const coHostResponses = [
          "That's really interesting. What do you make of that?",
          "Wow, those are some important points. What's the bigger picture?",
          "That's compelling. What else did you find?",
          "Interesting findings. What are the implications?",
          "That's significant. How should people think about this?"
        ];
        
        const closings = [
          "I think our audience will find this really valuable.",
          "That's definitely something worth understanding.",
          "This is exactly the kind of insight our listeners need.",
          "Thanks for sharing that research.",
          "That really helps clarify the situation."
        ];
        
        const starter = coHostStarters[index % coHostStarters.length];
        const response = coHostResponses[index % coHostResponses.length]; 
        const closing = closings[index % closings.length];
        
        if (secondPart.trim().length > 20) {
          conversationalScript = `${hostName}: ${starter} ${firstPart}

${coHostName}: ${response}

${hostName}: ${secondPart}

${coHostName}: ${closing}

[THOUGHTFUL PAUSE]`;
        } else {
          conversationalScript = `${hostName}: ${starter} ${firstPart}

${coHostName}: ${response}

${hostName}: Exactly. It's something we're seeing more and more.

[BRIEF PAUSE]`;
        }
      } else {
        // Single sentence for co-hosts
        conversationalScript = `${hostName}: ${polishedText}

${coHostName}: That's such an important point. What do you think people should take away from this?

${hostName}: I think it really highlights the need to pay attention to these developments.

[BRIEF PAUSE]`;
      }
      
      polishedText = conversationalScript;
      
    } else {
      // single_host format (default)
      switch (segment.segment_type) {
        case 'data':
          polishedText = `${hostName}: Here's something really interesting - ${polishedText}

[PAUSE FOR EMPHASIS]`;
          break;
          
        case 'narrative':
          polishedText = `${hostName}: Let me share something that perfectly illustrates this point. ${polishedText}

[THOUGHTFUL PAUSE]`;
          break;
          
        case 'qa':
          polishedText = `${hostName}: This brings up an important question. ${polishedText}

[BRIEF PAUSE]`;
          break;
          
        case 'technical':
          polishedText = `${hostName}: Now, let's break this down. ${polishedText}

[PAUSE TO LET THIS SINK IN]`;
          break;
          
        case 'opinion':
          polishedText = `${hostName}: Here's my take on this. ${polishedText}

[PAUSE]`;
          break;
          
        default:
          polishedText = `${hostName}: ${polishedText}

[NATURAL PAUSE]`;
      }
    }
    
    return {
      segment_id: segment.id,
      type: segment.segment_type,
      script: polishedText,
      estimated_duration: segment.estimated_duration * (format === 'single_host' ? 1.0 : 1.4), // Increase duration for conversation
      keywords: segment.topic_keywords,
      importance_score: segment.importance_score,
      speaker_format: format
    };
  });
}

/**
 * Generate show notes
 */
function generateShowNotes(segments, config) {
  const keyPoints = segments
    .filter(seg => seg.importance_score > 50)
    .slice(0, 5)
    .map(seg => `- ${seg.text.substring(0, 120).trim()}...`);
  
  const allKeywords = segments
    .flatMap(seg => seg.topic_keywords || [])
    .filter((keyword, index, array) => array.indexOf(keyword) === index)
    .slice(0, 10);
  
  const contentTypes = segments.reduce((acc, seg) => {
    acc[seg.segment_type] = (acc[seg.segment_type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    summary: `An insightful exploration covering ${segments.length} key topics with a focus on ${Object.keys(contentTypes).join(', ')} segments.`,
    key_points: keyPoints.length > 0 ? keyPoints : ['Key insights and analysis shared', 'Important developments discussed', 'Future implications explored'],
    keywords: allKeywords,
    timestamps: generateTimestamps(segments),
    social_snippets: [
      `🎙️ New episode of ${config.show_name} is live!`,
      "💡 Key insights that might change how you think about this topic.",
      "📊 The data tells a compelling story - listen to find out what it means.",
      `🔥 This episode of ${config.show_name} is packed with valuable insights!`
    ],
    seo_tags: allKeywords.slice(0, 8)
  };
}

/**
 * Generate approximate timestamps
 */
function generateTimestamps(segments) {
  let currentTime = 1.5; // Start after intro
  const timestamps = [];
  
  segments.forEach((segment, index) => {
    if (segment.importance_score > 60 || index === 0) {
      const minutes = Math.floor(currentTime);
      const seconds = Math.floor((currentTime % 1) * 60);
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      const topic = segment.topic_keywords?.[0] || `Segment ${segment.id}`;
      timestamps.push({
        time: timeString,
        topic: topic,
        description: segment.text.substring(0, 80).trim() + '...'
      });
    }
    
    currentTime += segment.estimated_duration + 0.25; // Add transition time
  });
  
  return timestamps;
}

/**
 * Generate smooth transitions between segments
 */
function generateTransitions(segments) {
  const transitions = [];
  
  for (let i = 0; i < segments.length - 1; i++) {
    const current = segments[i];
    const next = segments[i + 1];
    
    const currentTopic = current.topic_keywords?.[0] || 'this topic';
    const nextTopic = next.topic_keywords?.[0] || 'our next point';
    
    let transitionScript;
    
    // Generate transition based on segment types
    if (current.segment_type === 'data' && next.segment_type === 'narrative') {
      transitionScript = `HOST: Now, let me put that data into perspective with a real example.

[TRANSITION MUSIC - 3 seconds]`;
    } else if (current.segment_type === 'narrative' && next.segment_type === 'technical') {
      transitionScript = `HOST: So how does this actually work? Let's break it down.

[THOUGHTFUL PAUSE]`;
    } else if (current.segment_type === 'opinion' && next.segment_type === 'data') {
      transitionScript = `HOST: But what do the numbers actually tell us?

[PAUSE]`;
    } else {
      transitionScript = `HOST: Now, speaking of ${currentTopic}, this connects directly to ${nextTopic}.

[BRIEF PAUSE]`;
    }
    
    transitions.push({
      between_segments: [current.id, next.id],
      script: transitionScript,
      estimated_duration: 0.25 // 15 seconds
    });
  }
  
  return transitions;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, env, maxTokens = 1000) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert podcast script writer and audio content creator.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt, env, maxTokens = 1000) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.content[0].text.trim();
}
