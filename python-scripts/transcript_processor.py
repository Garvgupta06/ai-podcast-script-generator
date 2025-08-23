import requests
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranscriptProcessor:
    """
    Processes raw transcripts from various sources including:
    - Public speeches
    - News articles
    - Video transcripts
    - Audio transcriptions
    """
    
    def __init__(self):
        self.supported_sources = ['youtube', 'news_api', 'manual_input', 'file_upload']
    
    def clean_transcript(self, raw_text: str) -> str:
        """
        Clean and normalize transcript text
        """
        # Remove extra whitespace
        cleaned = re.sub(r'\s+', ' ', raw_text.strip())
        
        # Remove timestamp markers (e.g., [00:01:23])
        cleaned = re.sub(r'\[[\d:]+\]', '', cleaned)
        
        # Remove speaker tags (e.g., "Speaker 1:", "INTERVIEWER:")
        cleaned = re.sub(r'^[A-Z\s]+\d*\s*:', '', cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r'\b(Speaker|Host|Interviewer|Guest)\s*\d*\s*:\s*', '', cleaned, flags=re.IGNORECASE)
        
        # Remove filler words and false starts
        cleaned = re.sub(r'\b(um|uh|er|ah|like|you know)\b', '', cleaned, flags=re.IGNORECASE)
        
        # Fix common transcription errors
        cleaned = self._fix_common_errors(cleaned)
        
        # Clean up extra commas and punctuation
        cleaned = re.sub(r'\s*,\s*,', ',', cleaned)  # Fix double commas
        cleaned = re.sub(r'\s*\?\s*', '?', cleaned)   # Fix question marks
        cleaned = re.sub(r'\s+', ' ', cleaned)        # Multiple spaces to single
        
        return cleaned.strip()
    
    def _fix_common_errors(self, text: str) -> str:
        """
        Fix common transcription errors
        """
        corrections = {
            r'\btheres\b': 'there\'s',
            r'\bwere\b(?=\s+going)': 'we\'re',
            r'\bits\b(?=\s+a)': 'it\'s',
            r'\byouve\b': 'you\'ve',
            r'\bweve\b': 'we\'ve',
            r'\btheyre\b': 'they\'re',
        }
        
        for pattern, replacement in corrections.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        return text
    
    def extract_key_segments(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract key segments from the transcript for podcast structuring
        """
        segments = []
        
        # Split into paragraphs
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        
        for i, paragraph in enumerate(paragraphs):
            segment = {
                'id': i + 1,
                'text': paragraph,
                'word_count': len(paragraph.split()),
                'estimated_duration': self._estimate_speaking_duration(paragraph),
                'topic_keywords': self._extract_keywords(paragraph),
                'segment_type': self._classify_segment(paragraph)
            }
            segments.append(segment)
        
        return segments
    
    def _estimate_speaking_duration(self, text: str) -> float:
        """
        Estimate speaking duration based on average speaking rate (150 words per minute)
        """
        word_count = len(text.split())
        return round(word_count / 150, 2)  # minutes
    
    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract key terms from text segment
        """
        # Simple keyword extraction (can be enhanced with NLP libraries)
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        # Remove common words
        common_words = {'that', 'this', 'with', 'from', 'they', 'were', 'been', 'have', 'their', 'said', 'each', 'which', 'what', 'where', 'when', 'will', 'more', 'some', 'time', 'very', 'into', 'just', 'also', 'only', 'over', 'think', 'know', 'people', 'other', 'come', 'could', 'there', 'first', 'after', 'back', 'work', 'way', 'even', 'want', 'because', 'these', 'give', 'most', 'us'}
        keywords = [word for word in set(words) if word not in common_words]
        return keywords[:10]  # Top 10 keywords
    
    def _classify_segment(self, text: str) -> str:
        """
        Classify the type of content segment
        """
        text_lower = text.lower()
        
        if any(phrase in text_lower for phrase in ['introduction', 'welcome', 'hello', 'today we']):
            return 'introduction'
        elif any(phrase in text_lower for phrase in ['conclusion', 'summary', 'in closing', 'to wrap up']):
            return 'conclusion'
        elif any(phrase in text_lower for phrase in ['question', 'answer', 'q:', 'a:']):
            return 'qa'
        elif any(phrase in text_lower for phrase in ['data', 'statistics', 'research', 'study']):
            return 'data'
        elif any(phrase in text_lower for phrase in ['story', 'example', 'case', 'experience']):
            return 'narrative'
        else:
            return 'content'
    
    def process_from_url(self, url: str) -> Dict[str, Any]:
        """
        Process transcript from a URL source
        """
        try:
            # This would integrate with various APIs to fetch content
            # For now, returning a placeholder structure
            return {
                'source': url,
                'processed_at': datetime.now().isoformat(),
                'status': 'success',
                'message': 'URL processing not yet implemented'
            }
        except Exception as e:
            logger.error(f"Error processing URL {url}: {str(e)}")
            return {
                'source': url,
                'processed_at': datetime.now().isoformat(),
                'status': 'error',
                'message': str(e)
            }
    
    def process_from_file(self, file_content: str) -> Dict[str, Any]:
        """
        Process transcript from file content
        """
        try:
            cleaned_text = self.clean_transcript(file_content)
            segments = self.extract_key_segments(cleaned_text)
            
            return {
                'original_length': len(file_content),
                'cleaned_length': len(cleaned_text),
                'segments': segments,
                'total_segments': len(segments),
                'estimated_duration': sum(segment['estimated_duration'] for segment in segments),
                'processed_at': datetime.now().isoformat(),
                'status': 'success'
            }
        except Exception as e:
            logger.error(f"Error processing file content: {str(e)}")
            return {
                'processed_at': datetime.now().isoformat(),
                'status': 'error',
                'message': str(e)
            }

# Example usage
if __name__ == "__main__":
    processor = TranscriptProcessor()
    
    # Example transcript
    sample_transcript = """
    [00:01:23] Speaker: Um, welcome everyone to today's discussion about artificial intelligence. 
    You know, AI has really transformed the way we think about technology and its applications 
    in our daily lives.
    
    [00:02:15] The research shows that, uh, machine learning algorithms have improved by 
    over 300% in the last five years. This is really significant because it means were 
    seeing unprecedented capabilities in natural language processing.
    
    [00:03:45] Let me give you an example. Just last week, a study from MIT demonstrated 
    how AI can now understand context better than ever before. The implications are huge 
    for industries like healthcare, education, and entertainment.
    """
    
    result = processor.process_from_file(sample_transcript)
    print(json.dumps(result, indent=2))
