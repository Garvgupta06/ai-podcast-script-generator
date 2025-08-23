import requests
import re
from typing import Dict, Any, Optional, List
from bs4 import BeautifulSoup
import logging
from datetime import datetime
import json

# Optional imports - will be handled gracefully if not available
try:
    import youtube_transcript_api
    YOUTUBE_TRANSCRIPT_AVAILABLE = True
except ImportError:
    YOUTUBE_TRANSCRIPT_AVAILABLE = False

try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False

logger = logging.getLogger(__name__)

class ContentFetcher:
    """Fetch transcripts from various external sources"""
    
    def __init__(self):
        self.supported_sources = {
            'youtube': self._fetch_youtube_transcript,
            'news_url': self._fetch_news_article,
            'podcast_rss': self._fetch_podcast_transcript,
            'speech_text': self._fetch_speech_text,
            'pdf_url': self._fetch_pdf_content,
            'web_article': self._fetch_web_article
        }
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def fetch_content(self, source_url: str, source_type: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Main method to fetch content from various sources"""
        options = options or {}
        
        try:
            logger.info(f"Fetching content from {source_url} (type: {source_type})")
            
            if source_type in self.supported_sources:
                result = self.supported_sources[source_type](source_url, options)
                result['fetched_at'] = datetime.now().isoformat()
                return result
            else:
                raise ValueError(f"Unsupported source type: {source_type}")
                
        except Exception as e:
            logger.error(f"Error fetching content from {source_url}: {str(e)}")
            return {
                'error': str(e),
                'source_url': source_url,
                'source_type': source_type,
                'status': 'failed',
                'fetched_at': datetime.now().isoformat()
            }
    
    def _fetch_youtube_transcript(self, url: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch transcript from YouTube video"""
        if not YOUTUBE_TRANSCRIPT_AVAILABLE:
            raise Exception("youtube_transcript_api package not installed. Run: pip install youtube-transcript-api")
        
        try:
            # Extract video ID from URL
            video_id = self._extract_youtube_id(url)
            
            # Get available transcripts
            transcript_list = youtube_transcript_api.YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Try to get English transcript first, then any available
            transcript = None
            try:
                transcript = transcript_list.find_transcript(['en', 'en-US'])
            except:
                # Get the first available transcript
                transcript = next(iter(transcript_list))
            
            # Fetch the transcript data
            transcript_data = transcript.fetch()
            
            # Combine transcript segments
            full_transcript = ' '.join([entry['text'] for entry in transcript_data])
            
            # Get video metadata
            metadata = self._get_youtube_metadata(video_id)
            
            return {
                'transcript': full_transcript,
                'source_url': url,
                'source_type': 'youtube',
                'video_id': video_id,
                'duration': sum([entry.get('duration', 0) for entry in transcript_data]),
                'language': transcript.language,
                'metadata': metadata,
                'status': 'success'
            }
            
        except Exception as e:
            raise Exception(f"YouTube transcript fetch failed: {str(e)}")
    
    def _extract_youtube_id(self, url: str) -> str:
        """Extract YouTube video ID from URL"""
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
            r'youtube\.com/v/([^&\n?#]+)',
            r'youtube\.com/watch\?.*v=([^&\n?#]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        raise ValueError("Invalid YouTube URL - could not extract video ID")
    
    def _get_youtube_metadata(self, video_id: str) -> Dict[str, Any]:
        """Get YouTube video metadata (title, description, etc.)"""
        try:
            # This is a simplified version - in production you'd use YouTube Data API
            response = self.session.get(f"https://www.youtube.com/watch?v={video_id}")
            
            # Extract title from page
            title_match = re.search(r'<title>([^<]+)</title>', response.text)
            title = title_match.group(1) if title_match else "Unknown"
            title = title.replace(" - YouTube", "")
            
            # Extract description (simplified)
            desc_match = re.search(r'"shortDescription":"([^"]*)"', response.text)
            description = desc_match.group(1) if desc_match else ""
            
            return {
                'title': title,
                'description': description,
                'url': f"https://www.youtube.com/watch?v={video_id}"
            }
        except:
            return {
                'title': "Unknown",
                'description': "",
                'url': f"https://www.youtube.com/watch?v={video_id}"
            }
    
    def _fetch_news_article(self, url: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch and extract text from news article"""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer", "aside"]):
                script.decompose()
            
            # Try to find the main article content
            article_content = self._extract_article_content(soup)
            
            # Get metadata
            title = self._extract_title(soup)
            
            return {
                'transcript': article_content,
                'source_url': url,
                'source_type': 'news_article',
                'title': title,
                'word_count': len(article_content.split()),
                'status': 'success'
            }
            
        except Exception as e:
            raise Exception(f"News article fetch failed: {str(e)}")
    
    def _extract_article_content(self, soup) -> str:
        """Extract main article content from BeautifulSoup object"""
        # Try common article selectors
        selectors = [
            'article',
            '.article-content',
            '.article-body',
            '.post-content',
            '.entry-content',
            '.content',
            'main',
            '.main-content'
        ]
        
        for selector in selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                # Extract text from paragraphs
                paragraphs = content_elem.find_all(['p', 'div'])
                text_content = []
                
                for p in paragraphs:
                    text = p.get_text().strip()
                    if len(text) > 30:  # Filter out short snippets
                        text_content.append(text)
                
                if text_content:
                    return '\n\n'.join(text_content)
        
        # Fallback: extract all paragraph text
        paragraphs = soup.find_all('p')
        text_content = []
        
        for p in paragraphs:
            text = p.get_text().strip()
            if len(text) > 50:  # Longer threshold for fallback
                text_content.append(text)
        
        return '\n\n'.join(text_content) if text_content else soup.get_text()
    
    def _extract_title(self, soup) -> str:
        """Extract title from webpage"""
        # Try different title sources
        title_selectors = [
            'h1',
            '.article-title',
            '.post-title',
            '.entry-title',
            'title'
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                title = title_elem.get_text().strip()
                if title and len(title) > 5:
                    return title
        
        return "Untitled Article"
    
    def _fetch_web_article(self, url: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Generic web article fetcher"""
        return self._fetch_news_article(url, options)  # Same logic
    
    def _fetch_podcast_transcript(self, url: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch transcript from podcast RSS or webpage"""
        if not FEEDPARSER_AVAILABLE:
            raise Exception("feedparser package not installed. Run: pip install feedparser")
        
        try:
            # Check if it's an RSS feed
            if url.endswith('.rss') or url.endswith('.xml') or 'rss' in url.lower():
                return self._fetch_from_rss(url, options)
            else:
                # Try to fetch as web page
                return self._fetch_web_article(url, options)
                
        except Exception as e:
            raise Exception(f"Podcast transcript fetch failed: {str(e)}")
    
    def _fetch_from_rss(self, rss_url: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch content from RSS feed"""
        try:
            feed = feedparser.parse(rss_url)
            
            if not feed.entries:
                raise Exception("No entries found in RSS feed")
            
            # Get the most recent episode or specific episode
            episode_index = options.get('episode_index', 0)
            if episode_index >= len(feed.entries):
                episode_index = 0
            
            entry = feed.entries[episode_index]
            
            # Extract description or summary as transcript
            transcript = entry.get('description', '') or entry.get('summary', '')
            
            # Clean HTML tags from transcript
            if transcript:
                soup = BeautifulSoup(transcript, 'html.parser')
                transcript = soup.get_text()
            
            return {
                'transcript': transcript,
                'source_url': rss_url,
                'source_type': 'podcast_rss',
                'title': entry.get('title', 'Unknown'),
                'episode_url': entry.get('link', ''),
                'published': entry.get('published', ''),
                'status': 'success'
            }
            
        except Exception as e:
            raise Exception(f"RSS feed parsing failed: {str(e)}")
    
    def _fetch_speech_text(self, url: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch speech transcript from government or official sources"""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove navigation and irrelevant elements
            for elem in soup(['nav', 'header', 'footer', 'aside', 'script', 'style']):
                elem.decompose()
            
            # Look for speech-specific content
            speech_content = self._extract_speech_content(soup)
            
            title = self._extract_title(soup)
            
            return {
                'transcript': speech_content,
                'source_url': url,
                'source_type': 'speech_text',
                'title': title,
                'word_count': len(speech_content.split()),
                'status': 'success'
            }
            
        except Exception as e:
            raise Exception(f"Speech text fetch failed: {str(e)}")
    
    def _extract_speech_content(self, soup) -> str:
        """Extract speech content specifically"""
        # Look for speech-specific patterns
        speech_selectors = [
            '.speech-content',
            '.transcript',
            '.remarks',
            '.speech-text',
            '.address-content'
        ]
        
        for selector in speech_selectors:
            content = soup.select_one(selector)
            if content:
                return content.get_text().strip()
        
        # Fallback to general article extraction
        return self._extract_article_content(soup)
    
    def _fetch_pdf_content(self, url: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch content from PDF URL"""
        try:
            # This is a placeholder - would require PyPDF2 or similar
            raise Exception("PDF content extraction not yet implemented. Please convert PDF to text first.")
            
        except Exception as e:
            raise Exception(f"PDF content fetch failed: {str(e)}")
    
    def get_supported_sources(self) -> List[str]:
        """Get list of supported source types"""
        return list(self.supported_sources.keys())
    
    def validate_url(self, url: str, source_type: str) -> Dict[str, Any]:
        """Validate URL for given source type"""
        validation_result = {
            'valid': True,
            'warnings': [],
            'requirements': []
        }
        
        if source_type == 'youtube':
            if not any(domain in url for domain in ['youtube.com', 'youtu.be']):
                validation_result['valid'] = False
                validation_result['warnings'].append('URL does not appear to be a YouTube URL')
            
            if not YOUTUBE_TRANSCRIPT_AVAILABLE:
                validation_result['requirements'].append('youtube-transcript-api package required')
        
        elif source_type == 'podcast_rss':
            if not FEEDPARSER_AVAILABLE:
                validation_result['requirements'].append('feedparser package required')
        
        # Check if URL is accessible
        try:
            response = self.session.head(url, timeout=10)
            if response.status_code >= 400:
                validation_result['warnings'].append(f'URL returned status code {response.status_code}')
        except Exception as e:
            validation_result['warnings'].append(f'URL accessibility check failed: {str(e)}')
        
        return validation_result

# Example usage and testing
if __name__ == "__main__":
    fetcher = ContentFetcher()
    
    print("Supported source types:", fetcher.get_supported_sources())
    
    # Test URL validation
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    validation = fetcher.validate_url(test_url, 'youtube')
    print(f"\nURL validation for {test_url}:")
    print(f"Valid: {validation['valid']}")
    if validation['warnings']:
        print("Warnings:", validation['warnings'])
    if validation['requirements']:
        print("Requirements:", validation['requirements'])
    
    # Example content fetch (commented out to avoid actual requests in testing)
    """
    try:
        result = fetcher.fetch_content(
            "https://example.com/article", 
            "news_url"
        )
        print(f"Fetch result: {result['status']}")
        if result['status'] == 'success':
            print(f"Content length: {len(result['transcript'])} characters")
    except Exception as e:
        print(f"Fetch failed: {e}")
    """
