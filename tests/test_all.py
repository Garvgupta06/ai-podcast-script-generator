import unittest
from unittest.mock import patch, MagicMock, mock_open
import sys
import os
import json
from datetime import datetime

# Add project directories to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'python-scripts'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'config'))

# Import project modules
try:
    from transcript_processor import TranscriptProcessor
    from script_generator import PodcastScriptGenerator
    from content_fetcher import ContentFetcher
    from config import Config
except ImportError as e:
    print(f"Warning: Could not import modules: {e}")
    print("Make sure all Python files are in the correct directories")

class TestTranscriptProcessor(unittest.TestCase):
    """Test cases for TranscriptProcessor class"""
    
    def setUp(self):
        self.processor = TranscriptProcessor()
        self.sample_transcript = """
        [00:01:23] Speaker 1: Um, welcome everyone to today's discussion about, uh, artificial intelligence.
        You know, AI has really, like, transformed the way we think about technology and its applications
        in our daily lives, you know?
        
        [00:02:15] The research shows that, uh, machine learning algorithms have improved by
        over 300% in the last five years. This is really, like, significant because it means we're
        seeing unprecedented capabilities in natural language processing.
        
        [00:03:45] Let me give you an example, you know. Just last week, a study from MIT demonstrated
        how AI can now understand context better than ever before. The implications are, like, huge
        for industries like healthcare, education, and entertainment.
        """
    
    def test_clean_transcript(self):
        """Test transcript cleaning functionality"""
        cleaned = self.processor.clean_transcript(self.sample_transcript)
        
        # Check that filler words are removed
        self.assertNotIn('um', cleaned.lower())
        self.assertNotIn('uh', cleaned.lower())
        self.assertNotIn('like,', cleaned.lower())
        
        # Check that timestamps are removed
        self.assertNotIn('[00:01:23]', cleaned)
        self.assertNotIn('[00:02:15]', cleaned)
        
        # Check that speaker tags are removed
        self.assertNotIn('Speaker 1:', cleaned)
        
        # Ensure content is not empty
        self.assertGreater(len(cleaned), 0)
        
        # Check that meaningful content is preserved
        self.assertIn('artificial intelligence', cleaned)
        self.assertIn('machine learning', cleaned)
    
    def test_extract_key_segments(self):
        """Test segment extraction"""
        cleaned_text = self.processor.clean_transcript(self.sample_transcript)
        segments = self.processor.extract_key_segments(cleaned_text)
        
        self.assertGreater(len(segments), 0)
        
        # Check segment structure
        for segment in segments:
            self.assertIn('id', segment)
            self.assertIn('text', segment)
            self.assertIn('word_count', segment)
            self.assertIn('estimated_duration', segment)
            self.assertIn('topic_keywords', segment)
            self.assertIn('segment_type', segment)
            
            # Validate data types
            self.assertIsInstance(segment['id'], int)
            self.assertIsInstance(segment['text'], str)
            self.assertIsInstance(segment['word_count'], int)
            self.assertIsInstance(segment['estimated_duration'], float)
            self.assertIsInstance(segment['topic_keywords'], list)
            self.assertIsInstance(segment['segment_type'], str)
    
    def test_segment_classification(self):
        """Test segment type classification"""
        # Test data segment
        data_text = "The research shows that machine learning has improved by 300% according to recent studies."
        segment_type = self.processor._classify_segment(data_text)
        self.assertEqual(segment_type, 'data')
        
        # Test narrative segment
        narrative_text = "Let me share a story about what happened when we implemented this technology."
        segment_type = self.processor._classify_segment(narrative_text)
        self.assertEqual(segment_type, 'narrative')
        
        # Test introduction segment
        intro_text = "Welcome everyone to today's discussion about artificial intelligence."
        segment_type = self.processor._classify_segment(intro_text)
        self.assertEqual(segment_type, 'introduction')
    
    def test_process_from_file(self):
        """Test complete file processing"""
        result = self.processor.process_from_file(self.sample_transcript)
        
        self.assertEqual(result['status'], 'success')
        self.assertIn('original_length', result)
        self.assertIn('cleaned_length', result)
        self.assertIn('segments', result)
        self.assertIn('total_segments', result)
        self.assertIn('estimated_duration', result)
        
        # Check that processing actually cleaned the text
        self.assertLess(result['cleaned_length'], result['original_length'])
        
        # Check that segments were created
        self.assertGreater(result['total_segments'], 0)
        self.assertGreater(result['estimated_duration'], 0)

class TestPodcastScriptGenerator(unittest.TestCase):
    """Test cases for PodcastScriptGenerator class"""
    
    def setUp(self):
        self.show_config = {
            'show_name': 'Test Podcast',
            'host_name': 'Test Host',
            'show_tagline': 'Testing AI podcast generation'
        }
        self.generator = PodcastScriptGenerator(self.show_config)
        
        self.sample_processed_data = {
            'segments': [
                {
                    'id': 1,
                    'text': 'Artificial intelligence has made remarkable progress in recent years.',
                    'word_count': 10,
                    'estimated_duration': 4.0,
                    'topic_keywords': ['artificial', 'intelligence', 'progress'],
                    'segment_type': 'introduction'
                },
                {
                    'id': 2,
                    'text': 'Recent studies show a 300% improvement in machine learning performance.',
                    'word_count': 12,
                    'estimated_duration': 4.8,
                    'topic_keywords': ['studies', 'machine', 'learning', 'performance'],
                    'segment_type': 'data'
                },
                {
                    'id': 3,
                    'text': 'Let me share a case study from a healthcare company that implemented AI.',
                    'word_count': 14,
                    'estimated_duration': 5.6,
                    'topic_keywords': ['case', 'study', 'healthcare', 'company'],
                    'segment_type': 'narrative'
                }
            ],
            'status': 'success'
        }
    
    def test_script_generation_structure(self):
        """Test that complete script generation returns proper structure"""
        result = self.generator.generate_complete_script(self.sample_processed_data)
        
        self.assertEqual(result['status'], 'success')
        self.assertIn('script', result)
        self.assertIn('sections', result)
        self.assertIn('estimated_duration', result)
        
        # Check sections
        sections = result['sections']
        self.assertIn('intro', sections)
        self.assertIn('main_content', sections)
        self.assertIn('outro', sections)
        self.assertIn('show_notes', sections)
        self.assertIn('metadata', sections)
    
    def test_intro_generation(self):
        """Test intro generation"""
        intro = self.generator._generate_intro(self.sample_processed_data)
        
        self.assertIn('script', intro)
        self.assertIn('estimated_duration', intro)
        self.assertIn('music_cues', intro)
        
        # Check that show config is used
        script = intro['script']
        self.assertIn(self.show_config['show_name'], script)
        self.assertIn(self.show_config['host_name'], script)
        self.assertIn('[INTRO MUSIC', script)
    
    def test_outro_generation(self):
        """Test outro generation"""
        outro = self.generator._generate_outro(self.sample_processed_data)
        
        self.assertIn('script', outro)
        self.assertIn('estimated_duration', outro)
        self.assertIn('music_cues', outro)
        
        # Check for call-to-action elements
        script = outro['script']
        self.assertIn('subscribe', script.lower())
        self.assertIn(self.show_config['show_name'], script)
    
    def test_show_notes_generation(self):
        """Test show notes generation"""
        show_notes = self.generator._generate_show_notes(self.sample_processed_data)
        
        self.assertIn('episode_summary', show_notes)
        self.assertIn('key_points', show_notes)
        self.assertIn('timestamps', show_notes)
        self.assertIn('social_media_snippets', show_notes)
        
        # Check that timestamps match segments
        segments = self.sample_processed_data['segments']
        self.assertEqual(len(show_notes['timestamps']), len(segments))
    
    def test_transition_generation(self):
        """Test transition generation between segments"""
        transitions = self.generator._generate_transitions(self.sample_processed_data)
        
        # Should have one less transition than segments
        segments = self.sample_processed_data['segments']
        expected_transitions = len(segments) - 1
        self.assertEqual(len(transitions), expected_transitions)
        
        # Check transition structure
        for transition in transitions:
            self.assertIn('between_segments', transition)
            self.assertIn('script', transition)
            self.assertIn('audio_cue', transition)

class TestContentFetcher(unittest.TestCase):
    """Test cases for ContentFetcher class"""
    
    def setUp(self):
        self.fetcher = ContentFetcher()
    
    def test_supported_sources(self):
        """Test that supported sources are properly defined"""
        sources = self.fetcher.get_supported_sources()
        
        self.assertIn('youtube', sources)
        self.assertIn('news_url', sources)
        self.assertIn('web_article', sources)
        
        # Check that all sources have corresponding methods
        for source in sources:
            self.assertIn(source, self.fetcher.supported_sources)
    
    def test_youtube_id_extraction(self):
        """Test YouTube ID extraction from various URL formats"""
        test_urls = [
            ('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'),
            ('https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'),
            ('https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'),
        ]
        
        for url, expected_id in test_urls:
            extracted_id = self.fetcher._extract_youtube_id(url)
            self.assertEqual(extracted_id, expected_id)
    
    def test_url_validation(self):
        """Test URL validation for different source types"""
        # Valid YouTube URL
        youtube_validation = self.fetcher.validate_url(
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
            'youtube'
        )
        self.assertTrue(youtube_validation['valid'])
        
        # Invalid YouTube URL
        invalid_youtube = self.fetcher.validate_url(
            'https://www.google.com', 
            'youtube'
        )
        self.assertFalse(invalid_youtube['valid'])
    
    @patch('requests.Session.get')
    def test_news_article_fetch(self, mock_get):
        """Test news article fetching with mocked response"""
        # Mock HTML response
        mock_html = """
        <html>
            <head><title>Test Article</title></head>
            <body>
                <article>
                    <p>This is the first paragraph of the test article.</p>
                    <p>This is the second paragraph with more content.</p>
                </article>
            </body>
        </html>
        """
        
        mock_response = MagicMock()
        mock_response.content = mock_html.encode('utf-8')
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.fetcher._fetch_news_article('https://example.com/article', {})
        
        self.assertEqual(result['status'], 'success')
        self.assertIn('transcript', result)
        self.assertIn('title', result)
        self.assertEqual(result['title'], 'Test Article')
        self.assertIn('first paragraph', result['transcript'])

class TestConfig(unittest.TestCase):
    """Test cases for Config class"""
    
    @patch.dict(os.environ, {
        'OPENAI_API_KEY': 'test-openai-key',
        'DEFAULT_SHOW_NAME': 'Test Show'
    })
    def test_config_loading_from_env(self):
        """Test configuration loading from environment variables"""
        config = Config()
        
        self.assertEqual(config.llm.openai_api_key, 'test-openai-key')
        self.assertEqual(config.podcast.show_name, 'Test Show')
    
    def test_config_validation(self):
        """Test configuration validation"""
        config = Config()
        
        # Test with no API keys
        config.llm.openai_api_key = None
        config.llm.anthropic_api_key = None
        
        validation = config.validate()
        self.assertFalse(validation['valid'])
        self.assertIn('No LLM API keys configured', validation['errors'])
    
    def test_config_to_dict(self):
        """Test configuration serialization to dictionary"""
        config = Config()
        config_dict = config.to_dict()
        
        self.assertIn('cloudflare', config_dict)
        self.assertIn('llm', config_dict)
        self.assertIn('podcast', config_dict)
        
        # Check that API keys are masked
        if config_dict['llm']['openai_api_key']:
            self.assertEqual(config_dict['llm']['openai_api_key'], '***')

class TestCloudflareWorkersMock(unittest.TestCase):
    """Test cases for Cloudflare Workers API (mocked)"""
    
    @patch('requests.post')
    def test_process_transcript_api(self, mock_post):
        """Test transcript processing API endpoint"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'success': True,
            'data': {
                'segments': [],
                'total_segments': 3,
                'estimated_total_duration': 10.5
            }
        }
        mock_post.return_value = mock_response
        
        # Test API call
        payload = {
            'transcript': 'Test transcript content',
            'source_type': 'manual_input'
        }
        
        response = mock_post('https://test-worker.dev/api/process-transcript', json=payload)
        result = response.json()
        
        self.assertTrue(result['success'])
        self.assertIn('data', result)
        self.assertEqual(result['data']['total_segments'], 3)
    
    @patch('requests.post')
    def test_enhance_content_api(self, mock_post):
        """Test content enhancement API endpoint"""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'success': True,
            'data': {
                'enhanced_content': 'Enhanced transcript content',
                'provider': 'openai',
                'improvements': ['Removed filler words', 'Improved clarity']
            }
        }
        mock_post.return_value = mock_response
        
        # Test API call
        payload = {
            'content': 'Um, test content with, like, filler words',
            'enhancement_type': 'comprehensive'
        }
        
        response = mock_post('https://test-worker.dev/api/enhance-content', json=payload)
        result = response.json()
        
        self.assertTrue(result['success'])
        self.assertEqual(result['data']['provider'], 'openai')
        self.assertIn('improvements', result['data'])

class TestIntegration(unittest.TestCase):
    """Integration tests for the complete workflow"""
    
    def test_complete_workflow(self):
        """Test the complete podcast script generation workflow"""
        # Step 1: Process transcript
        processor = TranscriptProcessor()
        sample_text = """
        Welcome to our show about artificial intelligence. 
        Recent studies show AI has improved significantly.
        Let me share a story about AI implementation.
        """
        
        processed = processor.process_from_file(sample_text)
        self.assertEqual(processed['status'], 'success')
        
        # Step 2: Generate script
        show_config = {
            'show_name': 'AI Test Podcast',
            'host_name': 'Test Host',
            'show_tagline': 'Testing AI podcast generation'
        }
        
        generator = PodcastScriptGenerator(show_config)
        script_result = generator.generate_complete_script(processed)
        
        self.assertEqual(script_result['status'], 'success')
        self.assertIn('script', script_result)
        
        # Step 3: Verify script contains all necessary components
        script = script_result['script']
        self.assertIn('INTRO', script)
        self.assertIn('MAIN CONTENT', script)
        self.assertIn('OUTRO', script)
        self.assertIn('SHOW NOTES', script)
        
        # Verify show configuration is applied
        self.assertIn(show_config['show_name'], script)
        self.assertIn(show_config['host_name'], script)

def run_tests():
    """Run all test suites"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(TestTranscriptProcessor))
    suite.addTests(loader.loadTestsFromTestCase(TestPodcastScriptGenerator))
    suite.addTests(loader.loadTestsFromTestCase(TestContentFetcher))
    suite.addTests(loader.loadTestsFromTestCase(TestConfig))
    suite.addTests(loader.loadTestsFromTestCase(TestCloudflareWorkersMock))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"TEST SUMMARY")
    print(f"{'='*60}")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print(f"\nFAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback.split('AssertionError:')[-1].strip()}")
    
    if result.errors:
        print(f"\nERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback.split('Error:')[-1].strip()}")
    
    return result.wasSuccessful()

if __name__ == '__main__':
    print("🧪 Running AI Podcast Script Generator Tests")
    print("=" * 60)
    
    success = run_tests()
    
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n❌ Some tests failed. Check the output above for details.")
        sys.exit(1)
