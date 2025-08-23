import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PodcastScriptGenerator:
    """
    Transforms processed transcripts into polished podcast scripts
    with intro/outro segments, show notes, and smooth transitions.
    """
    
    def __init__(self, show_config: Dict[str, Any] = None):
        self.show_config = show_config or self._default_show_config()
        
    def _default_show_config(self) -> Dict[str, Any]:
        """Default podcast show configuration"""
        return {
            'show_name': 'AI Insights Podcast',
            'host_name': 'Your Host',
            'show_tagline': 'Exploring the future of artificial intelligence',
            'episode_format': 'interview',  # interview, narrative, discussion
            'target_duration': 30,  # minutes
            'intro_music_duration': 10,  # seconds
            'outro_music_duration': 15,  # seconds
            'sponsor_segments': False,
            'call_to_action': True
        }
    
    def generate_complete_script(self, processed_transcript: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a complete podcast script from processed transcript
        """
        try:
            script_sections = {
                'intro': self._generate_intro(processed_transcript),
                'main_content': self._generate_main_content(processed_transcript),
                'transitions': self._generate_transitions(processed_transcript),
                'outro': self._generate_outro(processed_transcript),
                'show_notes': self._generate_show_notes(processed_transcript),
                'metadata': self._generate_metadata(processed_transcript)
            }
            
            # Combine all sections into final script
            full_script = self._assemble_final_script(script_sections)
            
            return {
                'script': full_script,
                'sections': script_sections,
                'generated_at': datetime.now().isoformat(),
                'status': 'success',
                'estimated_duration': self._calculate_total_duration(script_sections)
            }
            
        except Exception as e:
            logger.error(f"Error generating script: {str(e)}")
            return {
                'generated_at': datetime.now().isoformat(),
                'status': 'error',
                'message': str(e)
            }
    
    def _generate_intro(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate podcast intro with hook and episode preview"""
        segments = transcript_data.get('segments', [])
        
        # Extract key topics for teaser
        main_topics = []
        for segment in segments[:3]:  # First 3 segments for preview
            if segment.get('topic_keywords'):
                main_topics.extend(segment['topic_keywords'][:2])
        
        intro_script = f"""
[INTRO MUSIC - {self.show_config.get('intro_music_duration', 10)} seconds]

HOST: Welcome back to {self.show_config.get('show_name', 'our podcast')}, I'm {self.show_config.get('host_name', 'your host')}, 
and this is the show where {self.show_config.get('show_tagline', 'we explore interesting topics')}.

[MUSIC FADES]

HOST: In today's episode, we're diving deep into some fascinating insights about 
{', '.join(main_topics[:3]) if main_topics else 'cutting-edge developments'}. 

We'll explore {self._generate_episode_preview(segments)}, and by the end of this episode, 
you'll have a much clearer understanding of how these developments might impact your world.

[TRANSITION SOUND]

So let's jump right in.
        """.strip()
        
        return {
            'script': intro_script,
            'estimated_duration': 1.5,  # minutes
            'music_cues': [
                {'type': 'intro_music', 'duration': self.show_config.get('intro_music_duration', 10)},
                {'type': 'transition_sound', 'timing': 'after_preview'}
            ],
            'topics_preview': main_topics[:3]
        }
    
    def _generate_episode_preview(self, segments: List[Dict]) -> str:
        """Generate a compelling preview of episode content"""
        preview_items = []
        
        for segment in segments[:4]:  # Preview first 4 segments
            if segment.get('segment_type') == 'data':
                preview_items.append("some surprising statistics")
            elif segment.get('segment_type') == 'narrative':
                preview_items.append("a compelling case study")
            elif segment.get('segment_type') == 'qa':
                preview_items.append("answers to important questions")
            else:
                if segment.get('topic_keywords'):
                    preview_items.append(f"insights about {segment['topic_keywords'][0]}")
        
        if len(preview_items) >= 3:
            return f"{', '.join(preview_items[:-1])}, and {preview_items[-1]}"
        elif len(preview_items) == 2:
            return f"{preview_items[0]} and {preview_items[1]}"
        else:
            return preview_items[0] if preview_items else "fascinating insights"
    
    def _generate_main_content(self, transcript_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Transform transcript segments into polished podcast content"""
        segments = transcript_data.get('segments', [])
        main_content = []
        
        for i, segment in enumerate(segments):
            content_block = {
                'segment_id': segment.get('id', i + 1),
                'type': segment.get('segment_type', 'content'),
                'script': self._polish_segment_content(segment),
                'estimated_duration': segment.get('estimated_duration', 2),
                'production_notes': self._generate_production_notes(segment),
                'keywords': segment.get('topic_keywords', [])
            }
            main_content.append(content_block)
        
        return main_content
    
    def _polish_segment_content(self, segment: Dict[str, Any]) -> str:
        """Polish raw transcript segment into podcast-ready content"""
        raw_text = segment.get('text', '')
        segment_type = segment.get('segment_type', 'content')
        
        # Add hosting cues and polish based on segment type
        if segment_type == 'data':
            polished = f"""
HOST: Now, here's something that really caught my attention. {raw_text}

[PAUSE FOR EMPHASIS]

HOST: Let me break that down for you - because these numbers tell a really important story.
            """.strip()
        
        elif segment_type == 'narrative':
            polished = f"""
HOST: Let me share a story that perfectly illustrates this point. {raw_text}

HOST: And this isn't just one isolated example - we're seeing this pattern emerge across the industry.
            """.strip()
        
        elif segment_type == 'qa':
            polished = f"""
HOST: Now, you might be wondering... {raw_text}

HOST: It's a great question, and the answer might surprise you.
            """.strip()
        
        else:
            # General content polishing
            polished = f"""
HOST: {raw_text}

[NATURAL PAUSE]
            """.strip()
        
        return self._add_natural_speech_patterns(polished)
    
    def _add_natural_speech_patterns(self, text: str) -> str:
        """Add natural speech patterns to make content more conversational"""
        # Add conversation starters
        conversation_starters = [
            "You know what's interesting?",
            "Here's the thing -",
            "Now, this is important -",
            "Let me tell you something -"
        ]
        
        # Add emphasis markers
        text = re.sub(r'\b(really|very|extremely)\b', r'[EMPHASIS] \1', text, flags=re.IGNORECASE)
        
        # Add natural pauses
        text = re.sub(r'([.!?])\s+([A-Z])', r'\1\n\n[NATURAL PAUSE]\n\nHOST: \2', text)
        
        return text
    
    def _generate_production_notes(self, segment: Dict[str, Any]) -> List[str]:
        """Generate production notes for audio editing"""
        notes = []
        
        if segment.get('segment_type') == 'data':
            notes.append("Consider adding subtle background music for statistics")
            notes.append("Emphasize key numbers with vocal inflection")
        
        if segment.get('estimated_duration', 0) > 3:
            notes.append("Long segment - consider adding a mid-segment music break")
        
        if len(segment.get('topic_keywords', [])) > 5:
            notes.append("Dense content - speak slower and add extra pauses")
        
        return notes
    
    def _generate_transitions(self, transcript_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate smooth transitions between segments"""
        segments = transcript_data.get('segments', [])
        transitions = []
        
        for i in range(len(segments) - 1):
            current_segment = segments[i]
            next_segment = segments[i + 1]
            
            transition = {
                'between_segments': [current_segment.get('id'), next_segment.get('id')],
                'script': self._create_transition_script(current_segment, next_segment),
                'audio_cue': self._suggest_audio_cue(current_segment, next_segment)
            }
            transitions.append(transition)
        
        return transitions
    
    def _create_transition_script(self, current: Dict, next_seg: Dict) -> str:
        """Create transition script between two segments"""
        current_type = current.get('segment_type', 'content')
        next_type = next_seg.get('segment_type', 'content')
        
        if current_type == 'data' and next_type == 'narrative':
            return "HOST: Now, let me show you what this looks like in practice."
        elif current_type == 'narrative' and next_type == 'data':
            return "HOST: The numbers behind this story are equally compelling."
        elif current_type == 'introduction' and next_type == 'content':
            return "[TRANSITION MUSIC - 3 seconds]"
        else:
            return "HOST: But there's more to this story."
    
    def _suggest_audio_cue(self, current: Dict, next_seg: Dict) -> str:
        """Suggest appropriate audio cues for transitions"""
        if current.get('segment_type') == 'data':
            return "soft_chime"
        elif next_seg.get('segment_type') == 'narrative':
            return "gentle_whoosh"
        else:
            return "subtle_transition"
    
    def _generate_outro(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate podcast outro with summary and call-to-action"""
        segments = transcript_data.get('segments', [])
        key_topics = []
        
        # Extract main topics covered
        for segment in segments:
            if segment.get('topic_keywords'):
                key_topics.extend(segment['topic_keywords'][:1])
        
        unique_topics = list(set(key_topics))[:3]  # Top 3 unique topics
        
        outro_script = f"""
[TRANSITION MUSIC - 5 seconds]

HOST: So there you have it - we've covered a lot of ground today, from 
{', '.join(unique_topics) if unique_topics else 'these fascinating developments'} 
and everything in between.

HOST: The key takeaway? {self._generate_key_takeaway(segments)}

[PAUSE]

HOST: If you found today's episode valuable, please subscribe to {self.show_config.get('show_name', 'our podcast')} 
wherever you get your podcasts, and leave us a review - it really helps other listeners 
discover the show.

HOST: Next week, we'll be diving into [NEXT EPISODE TEASER], so make sure you're subscribed 
so you don't miss it.

HOST: Until then, keep exploring, keep questioning, and keep pushing the boundaries of 
what's possible.

HOST: I'm {self.show_config.get('host_name', 'your host')}, thanks for listening to {self.show_config.get('show_name', 'our podcast')}.

[OUTRO MUSIC - {self.show_config.get('outro_music_duration', 30)} seconds]
        """.strip()
        
        return {
            'script': outro_script,
            'estimated_duration': 2.0,  # minutes
            'music_cues': [
                {'type': 'transition_music', 'duration': 5},
                {'type': 'outro_music', 'duration': self.show_config.get('outro_music_duration', 30)}
            ],
            'call_to_action': True
        }
    
    def _generate_key_takeaway(self, segments: List[Dict]) -> str:
        """Generate a key takeaway from the episode content"""
        if not segments:
            return "The future is full of exciting possibilities."
        
        # Simple takeaway based on segment types
        has_data = any(s.get('segment_type') == 'data' for s in segments)
        has_narrative = any(s.get('segment_type') == 'narrative' for s in segments)
        
        if has_data and has_narrative:
            return "The data tells a clear story, and the real-world examples show us exactly how this impacts our daily lives."
        elif has_data:
            return "The numbers don't lie - we're witnessing a significant shift that deserves our attention."
        else:
            return "These insights give us a glimpse into what the future might hold."
    
    def _generate_show_notes(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive show notes"""
        segments = transcript_data.get('segments', [])
        
        # Extract timestamps and key points
        key_points = []
        timestamps = []
        
        current_time = 1.5  # Start after intro
        
        for segment in segments:
            duration = segment.get('estimated_duration', 2)
            
            # Create timestamp entry
            timestamp_entry = {
                'time': f"{int(current_time):02d}:{int((current_time % 1) * 60):02d}",
                'topic': segment.get('topic_keywords', ['Discussion'])[0] if segment.get('topic_keywords') else 'Discussion',
                'description': self._create_timestamp_description(segment)
            }
            timestamps.append(timestamp_entry)
            
            # Extract key points
            if segment.get('segment_type') in ['data', 'narrative']:
                key_points.append(self._extract_key_point(segment))
            
            current_time += duration
        
        return {
            'episode_summary': self._generate_episode_summary(segments),
            'key_points': key_points,
            'timestamps': timestamps,
            'resources': self._suggest_resources(segments),
            'guest_info': None,  # Can be added if it's an interview
            'social_media_snippets': self._generate_social_snippets(segments)
        }
    
    def _create_timestamp_description(self, segment: Dict[str, Any]) -> str:
        """Create description for timestamp in show notes"""
        text = segment.get('text', '')
        if len(text) > 100:
            return text[:100] + "..."
        return text
    
    def _extract_key_point(self, segment: Dict[str, Any]) -> str:
        """Extract key point from segment for show notes"""
        text = segment.get('text', '')
        # Simple extraction - first sentence or first 150 characters
        sentences = re.split(r'[.!?]', text)
        if sentences and len(sentences[0]) > 20:
            return sentences[0].strip() + "."
        return text[:150] + "..." if len(text) > 150 else text
    
    def _generate_episode_summary(self, segments: List[Dict]) -> str:
        """Generate episode summary for show notes"""
        if not segments:
            return "An insightful discussion about current developments and their implications."
        
        topics = []
        for segment in segments[:5]:  # First 5 segments
            if segment.get('topic_keywords'):
                topics.extend(segment['topic_keywords'][:1])
        
        unique_topics = list(set(topics))[:4]
        
        if unique_topics:
            return f"In this episode, we explore {', '.join(unique_topics[:-1])} and {unique_topics[-1]}, examining their impact and implications for the future."
        else:
            return "A comprehensive discussion covering important developments and insights."
    
    def _suggest_resources(self, segments: List[Dict]) -> List[Dict[str, str]]:
        """Suggest additional resources based on content"""
        resources = [
            {"title": "Research Paper on AI Development", "url": "https://example.com/research"},
            {"title": "Industry Report 2024", "url": "https://example.com/report"},
            {"title": "Expert Interview Series", "url": "https://example.com/interviews"}
        ]
        return resources[:3]  # Limit to 3 resources
    
    def _generate_social_snippets(self, segments: List[Dict]) -> List[str]:
        """Generate social media snippets for promotion"""
        snippets = [
            f"🎙️ New episode of {self.show_config.get('show_name', 'our podcast')} is live! We dive deep into cutting-edge developments and their real-world impact.",
            f"💡 Key insight from today's episode: The future is closer than we think!",
            f"📊 The numbers might surprise you - listen to our latest episode to find out why."
        ]
        return snippets
    
    def _generate_metadata(self, transcript_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate episode metadata"""
        segments = transcript_data.get('segments', [])
        total_duration = sum(segment.get('estimated_duration', 2) for segment in segments) + 3.5  # Add intro/outro
        
        return {
            'episode_number': None,  # To be filled in
            'title': f"Deep Dive: {self._generate_episode_title(segments)}",
            'description': self._generate_episode_summary(segments),
            'duration': f"{int(total_duration):02d}:{int((total_duration % 1) * 60):02d}",
            'tags': self._extract_all_keywords(segments),
            'category': 'Technology',
            'explicit': False,
            'publication_date': datetime.now().isoformat()
        }
    
    def _generate_episode_title(self, segments: List[Dict]) -> str:
        """Generate catchy episode title"""
        if not segments:
            return "Exploring New Frontiers"
        
        # Extract top keywords
        all_keywords = []
        for segment in segments:
            if segment.get('topic_keywords'):
                all_keywords.extend(segment['topic_keywords'])
        
        # Count frequency
        keyword_counts = {}
        for keyword in all_keywords:
            keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1
        
        # Get top keyword
        if keyword_counts:
            top_keyword = max(keyword_counts, key=keyword_counts.get)
            return f"The Future of {top_keyword.title()}"
        
        return "Innovation and Impact"
    
    def _extract_all_keywords(self, segments: List[Dict]) -> List[str]:
        """Extract all keywords for metadata tags"""
        all_keywords = set()
        for segment in segments:
            if segment.get('topic_keywords'):
                all_keywords.update(segment['topic_keywords'])
        return list(all_keywords)[:10]  # Limit to 10 tags
    
    def _calculate_total_duration(self, script_sections: Dict[str, Any]) -> float:
        """Calculate total estimated duration of the podcast"""
        total = 0
        
        # Add intro duration
        total += script_sections['intro']['estimated_duration']
        
        # Add main content duration
        for content in script_sections['main_content']:
            total += content['estimated_duration']
        
        # Add outro duration
        total += script_sections['outro']['estimated_duration']
        
        # Add buffer for transitions
        total += len(script_sections['transitions']) * 0.1
        
        return round(total, 2)
    
    def _assemble_final_script(self, sections: Dict[str, Any]) -> str:
        """Assemble all sections into final podcast script"""
        script_parts = []
        
        # Add header
        script_parts.append("=" * 60)
        script_parts.append(f"PODCAST SCRIPT: {self.show_config.get('show_name', 'PODCAST')}")
        script_parts.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        script_parts.append("=" * 60)
        script_parts.append("")
        
        # Add intro
        script_parts.append("### INTRO ###")
        script_parts.append(sections['intro']['script'])
        script_parts.append("")
        
        # Add main content with transitions
        script_parts.append("### MAIN CONTENT ###")
        main_content = sections['main_content']
        transitions = sections['transitions']
        
        for i, content in enumerate(main_content):
            script_parts.append(f"--- Segment {content['segment_id']} ({content['type'].upper()}) ---")
            script_parts.append(content['script'])
            
            # Add production notes
            if content['production_notes']:
                script_parts.append("")
                script_parts.append("PRODUCTION NOTES:")
                for note in content['production_notes']:
                    script_parts.append(f"- {note}")
            
            script_parts.append("")
            
            # Add transition if not the last segment
            if i < len(main_content) - 1 and i < len(transitions):
                script_parts.append("--- TRANSITION ---")
                script_parts.append(transitions[i]['script'])
                script_parts.append("")
        
        # Add outro
        script_parts.append("### OUTRO ###")
        script_parts.append(sections['outro']['script'])
        script_parts.append("")
        
        # Add show notes
        script_parts.append("### SHOW NOTES ###")
        show_notes = sections['show_notes']
        script_parts.append(f"**Episode Summary:**")
        script_parts.append(show_notes['episode_summary'])
        script_parts.append("")
        
        script_parts.append("**Key Points:**")
        for point in show_notes['key_points']:
            script_parts.append(f"- {point}")
        script_parts.append("")
        
        script_parts.append("**Timestamps:**")
        for timestamp in show_notes['timestamps']:
            script_parts.append(f"{timestamp['time']} - {timestamp['topic']}")
        script_parts.append("")
        
        return "\n".join(script_parts)

# Example usage
if __name__ == "__main__":
    # Sample processed transcript data
    sample_data = {
        'segments': [
            {
                'id': 1,
                'text': 'Artificial intelligence has made remarkable progress in recent years.',
                'segment_type': 'introduction',
                'estimated_duration': 1.5,
                'topic_keywords': ['artificial', 'intelligence', 'progress']
            },
            {
                'id': 2,
                'text': 'Recent studies show a 300% improvement in machine learning performance.',
                'segment_type': 'data',
                'estimated_duration': 2.0,
                'topic_keywords': ['studies', 'machine', 'learning', 'performance']
            }
        ]
    }
    
    generator = PodcastScriptGenerator()
    result = generator.generate_complete_script(sample_data)
    
    if result['status'] == 'success':
        print(result['script'][:1000] + "...")  # Print first 1000 characters
    else:
        print(f"Error: {result['message']}")
