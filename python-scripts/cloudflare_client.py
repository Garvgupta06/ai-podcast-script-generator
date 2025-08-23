"""
Cloudflare Workers API client for AI Podcast Script Generator

This module provides an interface to interact with the Cloudflare Workers API
that handles transcript processing, AI enhancement, and script generation.
"""

import requests
import json
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class CloudflareWorkersClient:
    """Client for interacting with the Cloudflare Workers API"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        """
        Initialize the Cloudflare Workers client
        
        Args:
            base_url: Base URL of the Cloudflare Worker (e.g., https://your-worker.workers.dev)
            api_key: Optional API key for authentication
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        # Set default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Podcast-Generator-Python/1.0'
        })
        
        if self.api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_key}'
            })
    
    def health_check(self) -> Dict[str, Any]:
        """Check if the API is healthy"""
        try:
            response = self.session.get(f'{self.base_url}/api/health')
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def process_transcript(self, transcript: str, source_type: str = 'manual', 
                         options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a raw transcript
        
        Args:
            transcript: Raw transcript text
            source_type: Type of source (manual, youtube, web_article, etc.)
            options: Additional processing options
            
        Returns:
            Processed transcript data
        """
        try:
            payload = {
                'transcript': transcript,
                'source_type': source_type,
                'options': options or {}
            }
            
            response = self.session.post(f'{self.base_url}/api/process-transcript', 
                                       json=payload)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                return result['data']
            else:
                raise Exception(result.get('error', 'Unknown error'))
                
        except Exception as e:
            logger.error(f"Transcript processing failed: {e}")
            raise
    
    def enhance_content(self, content: str, enhancement_type: str = 'comprehensive',
                       provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Enhance content using AI
        
        Args:
            content: Content to enhance
            enhancement_type: Type of enhancement (comprehensive, minimal)
            provider: LLM provider (openai, anthropic)
            
        Returns:
            Enhanced content data
        """
        try:
            payload = {
                'content': content,
                'enhancement_type': enhancement_type
            }
            
            if provider:
                payload['provider'] = provider
            
            response = self.session.post(f'{self.base_url}/api/enhance-content', 
                                       json=payload)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                return result['data']
            else:
                raise Exception(result.get('error', 'Unknown error'))
                
        except Exception as e:
            logger.error(f"Content enhancement failed: {e}")
            raise
    
    def generate_script(self, processed_transcript: Dict[str, Any],
                       show_config: Optional[Dict[str, Any]] = None,
                       use_llm: bool = True) -> Dict[str, Any]:
        """
        Generate a complete podcast script
        
        Args:
            processed_transcript: Output from process_transcript
            show_config: Podcast show configuration
            use_llm: Whether to use LLM for enhanced script generation
            
        Returns:
            Complete podcast script data
        """
        try:
            payload = {
                'processed_transcript': processed_transcript,
                'show_config': show_config or {},
                'use_llm': use_llm
            }
            
            response = self.session.post(f'{self.base_url}/api/generate-script', 
                                       json=payload)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                return result['data']
            else:
                raise Exception(result.get('error', 'Unknown error'))
                
        except Exception as e:
            logger.error(f"Script generation failed: {e}")
            raise
    
    def fetch_content(self, source_url: str, source_type: str,
                     options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Fetch content from external sources
        
        Args:
            source_url: URL to fetch content from
            source_type: Type of source (youtube, web_article, news_url, etc.)
            options: Additional fetching options
            
        Returns:
            Fetched content data
        """
        try:
            payload = {
                'source_url': source_url,
                'source_type': source_type,
                'options': options or {}
            }
            
            response = self.session.post(f'{self.base_url}/api/fetch-transcript', 
                                       json=payload)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                return result['data']
            else:
                raise Exception(result.get('error', 'Unknown error'))
                
        except Exception as e:
            logger.error(f"Content fetching failed: {e}")
            raise
    
    def create_complete_podcast_script(self, source_input: str, 
                                     source_type: str = 'manual',
                                     show_config: Optional[Dict[str, Any]] = None,
                                     enhancement_type: str = 'comprehensive',
                                     use_llm: bool = True) -> Dict[str, Any]:
        """
        End-to-end podcast script creation
        
        Args:
            source_input: Either raw transcript text or URL to fetch content
            source_type: Type of source (manual, youtube, web_article, etc.)
            show_config: Podcast show configuration
            enhancement_type: Level of AI enhancement
            use_llm: Whether to use LLM for enhancement and generation
            
        Returns:
            Complete workflow result with all intermediate steps
        """
        workflow_result = {
            'started_at': datetime.now().isoformat(),
            'steps_completed': [],
            'errors': []
        }
        
        try:
            # Step 1: Fetch content if URL provided
            if source_type != 'manual':
                logger.info(f"Fetching content from {source_type}: {source_input}")
                fetched_content = self.fetch_content(source_input, source_type)
                transcript_text = fetched_content['transcript']
                workflow_result['fetched_content'] = fetched_content
                workflow_result['steps_completed'].append('fetch_content')
            else:
                transcript_text = source_input
            
            # Step 2: Process transcript
            logger.info("Processing transcript...")
            processed_transcript = self.process_transcript(transcript_text, source_type)
            workflow_result['processed_transcript'] = processed_transcript
            workflow_result['steps_completed'].append('process_transcript')
            
            # Step 3: Enhance content (if using LLM)
            if use_llm and enhancement_type != 'skip':
                logger.info(f"Enhancing content with {enhancement_type} enhancement...")
                try:
                    enhanced_content = self.enhance_content(
                        transcript_text, 
                        enhancement_type
                    )
                    workflow_result['enhanced_content'] = enhanced_content
                    workflow_result['steps_completed'].append('enhance_content')
                    
                    # Update processed transcript with enhanced content
                    if 'enhanced_content' in enhanced_content:
                        # Re-process the enhanced content
                        processed_transcript = self.process_transcript(
                            enhanced_content['enhanced_content'], 
                            source_type
                        )
                        workflow_result['processed_transcript'] = processed_transcript
                        
                except Exception as e:
                    logger.warning(f"Content enhancement failed, continuing with original: {e}")
                    workflow_result['errors'].append(f"Enhancement failed: {str(e)}")
            
            # Step 4: Generate script
            logger.info("Generating podcast script...")
            script_data = self.generate_script(
                processed_transcript, 
                show_config or {}, 
                use_llm
            )
            workflow_result['script'] = script_data
            workflow_result['steps_completed'].append('generate_script')
            
            # Final workflow metadata
            workflow_result['completed_at'] = datetime.now().isoformat()
            workflow_result['success'] = True
            workflow_result['total_duration'] = script_data.get('metadata', {}).get('total_duration', 0)
            
            logger.info("Complete podcast script creation finished successfully")
            return workflow_result
            
        except Exception as e:
            logger.error(f"Workflow failed at step {len(workflow_result['steps_completed']) + 1}: {e}")
            workflow_result['success'] = False
            workflow_result['final_error'] = str(e)
            workflow_result['completed_at'] = datetime.now().isoformat()
            raise


def create_client_from_config(config) -> CloudflareWorkersClient:
    """
    Create a CloudflareWorkersClient from a Config object
    
    Args:
        config: Config object with cloudflare settings
        
    Returns:
        Configured CloudflareWorkersClient
    """
    return CloudflareWorkersClient(
        base_url=config.cloudflare.worker_url,
        api_key=config.cloudflare.api_key
    )


# Example usage
if __name__ == "__main__":
    # Initialize client
    client = CloudflareWorkersClient(
        base_url="https://ai-podcast-script-api-prod.your-subdomain.workers.dev",
        api_key="your-api-key"  # Optional
    )
    
    # Test health check
    health = client.health_check()
    print("Health check:", health)
    
    # Complete workflow example
    try:
        result = client.create_complete_podcast_script(
            source_input="This is a sample transcript for testing the AI podcast script generator system.",
            source_type="manual",
            show_config={
                "show_name": "AI Test Podcast",
                "host_name": "Test Host",
                "show_tagline": "Testing AI capabilities"
            },
            enhancement_type="comprehensive",
            use_llm=True
        )
        
        print("Workflow completed successfully!")
        print(f"Total duration: {result.get('total_duration', 0)} minutes")
        print(f"Steps completed: {result.get('steps_completed', [])}")
        
        if 'script' in result:
            print(f"Script generated with {len(result['script'].get('main_content', []))} segments")
            
    except Exception as e:
        print(f"Workflow failed: {e}")
