// Script generation handlers for Cloudflare Workers
import { corsHeaders } from '../utils/cors.js';

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
    host_name: 'Your Host',
    show_tagline: 'Exploring the future of technology',
    episode_title: '',
    ...showConfig
  };
  
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
  
  const prompt = `Create an engaging podcast intro script based on the following:

Show Name: ${config.show_name}
Host Name: ${config.host_name}
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
  return `[INTRO MUSIC - 10 seconds]

HOST: Welcome to ${config.show_name}, I'm ${config.host_name}, and this is where ${config.show_tagline}.

[MUSIC FADES]

HOST: In today's episode, we're exploring ${topicPreview || 'fascinating insights and developments'} that I think you'll find really interesting.

[TRANSITION SOUND]

HOST: So let's dive right in.`;
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
  
  const prompt = `Create a compelling podcast outro script based on:

Show Name: ${config.show_name}
Host Name: ${config.host_name}
Episode Summary: ${episodeSummary}

Requirements:
1. Summarize key takeaways (1-2 sentences)
2. Include subscription call-to-action
3. Tease next episode or general future content
4. Professional but warm closing
5. Add production cues in [BRACKETS]
6. Target duration: 60-75 seconds

Outro Script:`;

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
  return `[TRANSITION MUSIC - 5 seconds]

HOST: That's a wrap on today's episode of ${config.show_name}. We've covered some really fascinating ground, and I hope you found these insights as compelling as I do.

HOST: If you enjoyed this episode, please subscribe wherever you get your podcasts and leave us a review - it really helps us reach more listeners.

HOST: Thanks for listening, I'm ${config.host_name}, and we'll see you next time.

[OUTRO MUSIC - 15 seconds]`;
}

/**
 * Generate main content sections
 */
async function generateMainContent(segments, config, env = null) {
  return segments.map((segment, index) => {
    let polishedText = segment.text;
    
    // Add hosting cues based on segment type
    switch (segment.segment_type) {
      case 'data':
        polishedText = `HOST: Here's something really interesting - ${polishedText}

[PAUSE FOR EMPHASIS]`;
        break;
        
      case 'narrative':
        polishedText = `HOST: Let me share something that perfectly illustrates this point. ${polishedText}

[THOUGHTFUL PAUSE]`;
        break;
        
      case 'qa':
        polishedText = `HOST: This brings up an important question. ${polishedText}

[BRIEF PAUSE]`;
        break;
        
      case 'technical':
        polishedText = `HOST: Now, let's break this down. ${polishedText}

[PAUSE TO LET THIS SINK IN]`;
        break;
        
      case 'opinion':
        polishedText = `HOST: Here's my take on this. ${polishedText}

[PAUSE]`;
        break;
        
      default:
        polishedText = `HOST: ${polishedText}

[NATURAL PAUSE]`;
    }
    
    return {
      segment_id: segment.id,
      type: segment.segment_type,
      script: polishedText,
      estimated_duration: segment.estimated_duration,
      keywords: segment.topic_keywords,
      importance_score: segment.importance_score
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
