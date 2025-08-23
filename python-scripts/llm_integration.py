import requests
import json
import os
import re
from typing import Dict, List, Optional, Any, Union
import logging
from datetime import datetime

# Optional imports for LLM providers - will be handled gracefully if not available
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

logger = logging.getLogger(__name__)

class LLMIntegration:
    """
    Integrates with various LLM providers to enhance transcript processing
    and script generation with AI-powered improvements.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.providers = {
            'openai': self._setup_openai,
            'anthropic': self._setup_anthropic,
            'custom': self._setup_custom_api
        }
        
        # Default to OpenAI if no provider specified
        self.active_provider = self.config.get('provider', 'openai')
        self.client = None
        
        # Initialize the selected provider
        self._initialize_provider()
    
    def _initialize_provider(self):
        """Initialize the selected LLM provider"""
        try:
            if self.active_provider in self.providers:
                self.client = self.providers[self.active_provider]()
                logger.info(f"Initialized {self.active_provider} provider")
            else:
                raise ValueError(f"Unsupported provider: {self.active_provider}")
        except Exception as e:
            logger.error(f"Failed to initialize {self.active_provider}: {str(e)}")
            raise
    
    def _setup_openai(self):
        """Setup OpenAI client"""
        api_key = self.config.get('openai_api_key') or os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OpenAI API key not provided")
        
        openai.api_key = api_key
        return openai
    
    def _setup_anthropic(self):
        """Setup Anthropic Claude client"""
        api_key = self.config.get('anthropic_api_key') or os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("Anthropic API key not provided")
        
        return anthropic.Anthropic(api_key=api_key)
    
    def _setup_custom_api(self):
        """Setup custom API endpoint"""
        endpoint = self.config.get('custom_endpoint')
        if not endpoint:
            raise ValueError("Custom API endpoint not provided")
        
        return {'endpoint': endpoint, 'headers': self.config.get('custom_headers', {})}
    
    def enhance_transcript(self, raw_transcript: str, enhancement_type: str = 'comprehensive') -> Dict[str, Any]:
        """
        Use LLM to enhance raw transcript quality
        """
        try:
            prompt = self._build_enhancement_prompt(raw_transcript, enhancement_type)
            
            if self.active_provider == 'openai':
                response = self._call_openai(prompt, max_tokens=2000)
            elif self.active_provider == 'anthropic':
                response = self._call_anthropic(prompt, max_tokens=2000)
            else:
                response = self._call_custom_api(prompt)
            
            return {
                'enhanced_transcript': response,
                'original_length': len(raw_transcript),
                'enhanced_length': len(response),
                'enhancement_type': enhancement_type,
                'processed_at': datetime.now().isoformat(),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error enhancing transcript: {str(e)}")
            return {
                'enhanced_transcript': raw_transcript,  # Fallback to original
                'processed_at': datetime.now().isoformat(),
                'status': 'error',
                'message': str(e)
            }
    
    def _build_enhancement_prompt(self, transcript: str, enhancement_type: str) -> str:
        """Build prompt for transcript enhancement"""
        base_prompt = f"""
Please enhance the following transcript for podcast use. The transcript may contain:
- Filler words (um, uh, like, you know)
- Repetitive phrases
- Unclear sentences
- Missing punctuation
- Speaker attribution issues

Enhancement type: {enhancement_type}

Original transcript:
{transcript}

Please provide an enhanced version that:
1. Removes unnecessary filler words
2. Improves clarity and flow
3. Maintains the original meaning and tone
4. Adds appropriate punctuation
5. Structures content logically
6. Preserves important emphasis and emotion

Enhanced transcript:"""

        if enhancement_type == 'comprehensive':
            base_prompt += """
Additionally:
- Break content into logical segments
- Add topic headings where appropriate
- Identify key quotes or soundbites
- Note any technical terms that might need explanation
"""
        elif enhancement_type == 'minimal':
            base_prompt += """
Focus only on:
- Basic grammar and punctuation corrections
- Removing obvious filler words
- Maintaining original structure
"""
        
        return base_prompt
    
    def generate_intro_script(self, content_summary: str, show_config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate engaging podcast intro using LLM"""
        try:
            prompt = f"""
Create an engaging podcast intro script based on the following:

Show Name: {show_config.get('show_name', 'Podcast')}
Host Name: {show_config.get('host_name', 'Host')}
Show Tagline: {show_config.get('show_tagline', 'Exploring important topics')}
Episode Content Summary: {content_summary}

Requirements:
1. Hook the listener in the first 15 seconds
2. Preview key topics without spoilers
3. Set an enthusiastic but professional tone
4. Include natural speech patterns
5. Add production cues in [BRACKETS]
6. Target duration: 60-90 seconds of spoken content

Format the response as a conversational script with clear speaker labels and production notes.

Intro Script:
"""
            
            if self.active_provider == 'openai':
                response = self._call_openai(prompt, max_tokens=800)
            elif self.active_provider == 'anthropic':
                response = self._call_anthropic(prompt, max_tokens=800)
            else:
                response = self._call_custom_api(prompt)
            
            return {
                'intro_script': response,
                'estimated_duration': self._estimate_script_duration(response),
                'generated_at': datetime.now().isoformat(),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error generating intro: {str(e)}")
            return {
                'intro_script': self._fallback_intro(show_config),
                'generated_at': datetime.now().isoformat(),
                'status': 'error',
                'message': str(e)
            }
    
    def generate_outro_script(self, episode_summary: str, show_config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate podcast outro with call-to-action"""
        try:
            prompt = f"""
Create a compelling podcast outro script based on:

Show Name: {show_config.get('show_name', 'Podcast')}
Host Name: {show_config.get('host_name', 'Host')}
Episode Summary: {episode_summary}

Requirements:
1. Summarize key takeaways (1-2 sentences)
2. Include subscription call-to-action
3. Tease next episode or general future content
4. Professional but warm closing
5. Add production cues in [BRACKETS]
6. Target duration: 60-75 seconds

Outro Script:
"""
            
            if self.active_provider == 'openai':
                response = self._call_openai(prompt, max_tokens=600)
            elif self.active_provider == 'anthropic':
                response = self._call_anthropic(prompt, max_tokens=600)
            else:
                response = self._call_custom_api(prompt)
            
            return {
                'outro_script': response,
                'estimated_duration': self._estimate_script_duration(response),
                'generated_at': datetime.now().isoformat(),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error generating outro: {str(e)}")
            return {
                'outro_script': self._fallback_outro(show_config),
                'generated_at': datetime.now().isoformat(),
                'status': 'error',
                'message': str(e)
            }
    
    def generate_show_notes(self, transcript_segments: List[Dict[str, Any]], episode_title: str) -> Dict[str, Any]:
        """Generate comprehensive show notes using LLM"""
        try:
            # Prepare content summary
            content_summary = "\n".join([
                f"Segment {seg.get('id', i+1)}: {seg.get('text', '')[:200]}..."
                for i, seg in enumerate(transcript_segments[:5])
            ])
            
            prompt = f"""
Create comprehensive podcast show notes for the following episode:

Title: {episode_title}
Content Summary: {content_summary}

Generate show notes that include:

1. **Episode Summary** (2-3 sentences describing the main topics)
2. **Key Takeaways** (3-5 bullet points of main insights)
3. **Timestamps** (approximate timing for major topic changes)
4. **Resources Mentioned** (any studies, books, websites referenced)
5. **Social Media Snippets** (2-3 tweetable quotes or insights)
6. **SEO Tags** (relevant keywords for discovery)

Format in clean markdown for easy publishing.

Show Notes:
"""
            
            if self.active_provider == 'openai':
                response = self._call_openai(prompt, max_tokens=1200)
            elif self.active_provider == 'anthropic':
                response = self._call_anthropic(prompt, max_tokens=1200)
            else:
                response = self._call_custom_api(prompt)
            
            return {
                'show_notes': response,
                'generated_at': datetime.now().isoformat(),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error generating show notes: {str(e)}")
            return {
                'show_notes': self._fallback_show_notes(episode_title),
                'generated_at': datetime.now().isoformat(),
                'status': 'error',
                'message': str(e)
            }
    
    def improve_segment_transitions(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate smooth transitions between podcast segments"""
        try:
            transitions = []
            
            for i in range(len(segments) - 1):
                current = segments[i]
                next_segment = segments[i + 1]
                
                prompt = f"""
Create a smooth transition between these two podcast segments:

Current segment topic: {current.get('topic_keywords', ['general topic'])[0] if current.get('topic_keywords') else 'general topic'}
Current segment ending: {current.get('text', '')[-100:]}

Next segment topic: {next_segment.get('topic_keywords', ['general topic'])[0] if next_segment.get('topic_keywords') else 'general topic'}
Next segment beginning: {next_segment.get('text', '')[:100]}

Create a natural 10-15 second transition that:
1. Bridges the topics smoothly
2. Maintains listener engagement
3. Uses conversational language
4. Includes any necessary audio cues in [BRACKETS]

Transition:
"""
                
                if self.active_provider == 'openai':
                    response = self._call_openai(prompt, max_tokens=200, temperature=0.7)
                elif self.active_provider == 'anthropic':
                    response = self._call_anthropic(prompt, max_tokens=200)
                else:
                    response = self._call_custom_api(prompt)
                
                transitions.append({
                    'between_segments': [current.get('id'), next_segment.get('id')],
                    'script': response,
                    'estimated_duration': 0.25  # 15 seconds
                })
            
            return transitions
            
        except Exception as e:
            logger.error(f"Error generating transitions: {str(e)}")
            return []
    
    def _call_openai(self, prompt: str, max_tokens: int = 1000, temperature: float = 0.3) -> str:
        """Call OpenAI API"""
        try:
            response = openai.ChatCompletion.create(
                model=self.config.get('openai_model', 'gpt-3.5-turbo'),
                messages=[
                    {"role": "system", "content": "You are an expert podcast script writer and audio content creator."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
    
    def _call_anthropic(self, prompt: str, max_tokens: int = 1000) -> str:
        """Call Anthropic Claude API"""
        try:
            response = self.client.messages.create(
                model=self.config.get('anthropic_model', 'claude-3-sonnet-20240229'),
                max_tokens=max_tokens,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.content[0].text.strip()
        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}")
            raise
    
    def _call_custom_api(self, prompt: str) -> str:
        """Call custom API endpoint"""
        try:
            endpoint = self.client['endpoint']
            headers = self.client['headers']
            
            payload = {
                'prompt': prompt,
                'max_tokens': 1000,
                'temperature': 0.3
            }
            
            response = requests.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            
            return response.json().get('text', '').strip()
        except Exception as e:
            logger.error(f"Custom API error: {str(e)}")
            raise
    
    def _estimate_script_duration(self, script: str) -> float:
        """Estimate speaking duration of script text"""
        # Remove production cues
        clean_script = re.sub(r'\[.*?\]', '', script)
        word_count = len(clean_script.split())
        
        # Average speaking rate: 150 words per minute
        return round(word_count / 150, 2)
    
    def _fallback_intro(self, show_config: Dict[str, Any]) -> str:
        """Fallback intro when LLM fails"""
        return f"""
[INTRO MUSIC - 10 seconds]

HOST: Welcome to {show_config.get('show_name', 'our podcast')}, I'm {show_config.get('host_name', 'your host')}.

HOST: In today's episode, we're exploring some fascinating insights and developments that I think you'll find really interesting.

[MUSIC FADES]

HOST: So let's dive right in.
        """.strip()
    
    def _fallback_outro(self, show_config: Dict[str, Any]) -> str:
        """Fallback outro when LLM fails"""
        return f"""
HOST: That's all for today's episode of {show_config.get('show_name', 'our podcast')}.

HOST: If you enjoyed this episode, please subscribe and leave us a review.

HOST: Thanks for listening, and we'll see you next time.

[OUTRO MUSIC - 15 seconds]
        """.strip()
    
    def _fallback_show_notes(self, episode_title: str) -> str:
        """Fallback show notes when LLM fails"""
        return f"""
# {episode_title}

## Episode Summary
An insightful discussion covering important topics and developments.

## Key Takeaways
- Important insights shared
- Valuable information discussed
- Future implications explored

## Resources
- Additional reading available on our website

## Social Media
Share your thoughts about this episode using #PodcastDiscussion
        """.strip()

# Example usage and testing
if __name__ == "__main__":
    # Example configuration
    config = {
        'provider': 'openai',  # or 'anthropic', 'custom'
        'openai_api_key': 'your-api-key-here',
        'openai_model': 'gpt-3.5-turbo'
    }
    
    try:
        llm = LLMIntegration(config)
        
        # Test transcript enhancement
        sample_transcript = """
        Um, so basically, you know, artificial intelligence is like, really changing 
        everything. I mean, uh, the research shows that, um, machine learning has improved 
        by like 300% in recent years, which is, you know, pretty significant.
        """
        
        enhanced = llm.enhance_transcript(sample_transcript, 'comprehensive')
        print("Enhanced transcript:", enhanced['enhanced_transcript'])
        
    except Exception as e:
        print(f"Error in example: {str(e)}")
        print("Note: This example requires valid API keys to run successfully.")
