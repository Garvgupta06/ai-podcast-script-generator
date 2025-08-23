import os
from typing import Dict, Any, Optional
import json
from dataclasses import dataclass

@dataclass
class CloudflareConfig:
    """Cloudflare Workers configuration"""
    worker_url: str
    api_key: Optional[str] = None
    account_id: Optional[str] = None
    zone_id: Optional[str] = None

@dataclass
class LLMConfig:
    """LLM provider configuration"""
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    default_provider: str = 'openai'
    default_model: str = 'gpt-3.5-turbo'
    max_tokens: int = 2000
    temperature: float = 0.3

@dataclass
class PodcastConfig:
    """Default podcast show configuration"""
    show_name: str = 'AI Insights Podcast'
    host_name: str = 'Your Host'
    tagline: str = 'Exploring the future of AI'
    intro_music_duration: int = 10
    outro_music_duration: int = 15
    target_duration: int = 30
    sponsor_segments: bool = False
    call_to_action: bool = True

class Config:
    """Main configuration manager for the AI podcast script generator"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file or os.path.join(os.path.dirname(__file__), 'config.json')
        self._load_config()
    
    def _load_config(self):
        """Load configuration from environment variables and config file"""
        # Load from environment first
        self.cloudflare = CloudflareConfig(
            worker_url=os.getenv('CLOUDFLARE_WORKER_URL', 'https://ai-podcast-script-api.your-domain.workers.dev'),
            api_key=os.getenv('CLOUDFLARE_API_KEY'),
            account_id=os.getenv('CLOUDFLARE_ACCOUNT_ID'),
            zone_id=os.getenv('CLOUDFLARE_ZONE_ID')
        )
        
        self.llm = LLMConfig(
            openai_api_key=os.getenv('OPENAI_API_KEY'),
            anthropic_api_key=os.getenv('ANTHROPIC_API_KEY'),
            default_provider=os.getenv('DEFAULT_LLM_PROVIDER', 'openai'),
            default_model=os.getenv('DEFAULT_LLM_MODEL', 'gpt-3.5-turbo'),
            max_tokens=int(os.getenv('LLM_MAX_TOKENS', '2000')),
            temperature=float(os.getenv('LLM_TEMPERATURE', '0.3'))
        )
        
        self.podcast = PodcastConfig(
            show_name=os.getenv('DEFAULT_SHOW_NAME', 'AI Insights Podcast'),
            host_name=os.getenv('DEFAULT_HOST_NAME', 'Your Host'),
            tagline=os.getenv('DEFAULT_TAGLINE', 'Exploring the future of AI'),
            intro_music_duration=int(os.getenv('INTRO_MUSIC_DURATION', '10')),
            outro_music_duration=int(os.getenv('OUTRO_MUSIC_DURATION', '15')),
            target_duration=int(os.getenv('TARGET_DURATION', '30')),
            sponsor_segments=os.getenv('SPONSOR_SEGMENTS', 'false').lower() == 'true',
            call_to_action=os.getenv('CALL_TO_ACTION', 'true').lower() == 'true'
        )
        
        # Override with config file if it exists
        if os.path.exists(self.config_file):
            self._load_from_file()
    
    def _load_from_file(self):
        """Load additional configuration from JSON file"""
        try:
            with open(self.config_file, 'r') as f:
                config_data = json.load(f)
            
            # Update configurations with file data
            if 'cloudflare' in config_data:
                for key, value in config_data['cloudflare'].items():
                    if hasattr(self.cloudflare, key):
                        setattr(self.cloudflare, key, value)
            
            if 'llm' in config_data:
                for key, value in config_data['llm'].items():
                    if hasattr(self.llm, key):
                        setattr(self.llm, key, value)
            
            if 'podcast' in config_data:
                for key, value in config_data['podcast'].items():
                    if hasattr(self.podcast, key):
                        setattr(self.podcast, key, value)
        
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Warning: Could not load config file {self.config_file}: {e}")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            'cloudflare': {
                'worker_url': self.cloudflare.worker_url,
                'api_key': '***' if self.cloudflare.api_key else None,
                'account_id': self.cloudflare.account_id,
                'zone_id': self.cloudflare.zone_id
            },
            'llm': {
                'openai_api_key': '***' if self.llm.openai_api_key else None,
                'anthropic_api_key': '***' if self.llm.anthropic_api_key else None,
                'default_provider': self.llm.default_provider,
                'default_model': self.llm.default_model,
                'max_tokens': self.llm.max_tokens,
                'temperature': self.llm.temperature
            },
            'podcast': {
                'show_name': self.podcast.show_name,
                'host_name': self.podcast.host_name,
                'tagline': self.podcast.tagline,
                'intro_music_duration': self.podcast.intro_music_duration,
                'outro_music_duration': self.podcast.outro_music_duration,
                'target_duration': self.podcast.target_duration,
                'sponsor_segments': self.podcast.sponsor_segments,
                'call_to_action': self.podcast.call_to_action
            }
        }
    
    def save_to_file(self, file_path: Optional[str] = None):
        """Save current configuration to file"""
        file_path = file_path or self.config_file
        
        config_dict = {
            'cloudflare': {
                'worker_url': self.cloudflare.worker_url,
                'account_id': self.cloudflare.account_id,
                'zone_id': self.cloudflare.zone_id
            },
            'llm': {
                'default_provider': self.llm.default_provider,
                'default_model': self.llm.default_model,
                'max_tokens': self.llm.max_tokens,
                'temperature': self.llm.temperature
            },
            'podcast': {
                'show_name': self.podcast.show_name,
                'host_name': self.podcast.host_name,
                'tagline': self.podcast.tagline,
                'intro_music_duration': self.podcast.intro_music_duration,
                'outro_music_duration': self.podcast.outro_music_duration,
                'target_duration': self.podcast.target_duration,
                'sponsor_segments': self.podcast.sponsor_segments,
                'call_to_action': self.podcast.call_to_action
            }
        }
        
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            json.dump(config_dict, f, indent=2)
    
    def validate(self) -> Dict[str, Any]:
        """Validate configuration and return validation results"""
        validation_results = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        # Check required API keys
        if not self.llm.openai_api_key and not self.llm.anthropic_api_key:
            validation_results['errors'].append('No LLM API keys configured')
            validation_results['valid'] = False
        
        # Check Cloudflare configuration
        if not self.cloudflare.worker_url:
            validation_results['errors'].append('Cloudflare Worker URL not configured')
            validation_results['valid'] = False
        
        # Check podcast configuration
        if not self.podcast.show_name.strip():
            validation_results['warnings'].append('Show name is empty or whitespace')
        
        if not self.podcast.host_name.strip():
            validation_results['warnings'].append('Host name is empty or whitespace')
        
        # Check LLM model configuration
        if self.llm.default_provider == 'openai' and not self.llm.openai_api_key:
            validation_results['errors'].append('OpenAI provider selected but no API key provided')
            validation_results['valid'] = False
        
        if self.llm.default_provider == 'anthropic' and not self.llm.anthropic_api_key:
            validation_results['errors'].append('Anthropic provider selected but no API key provided')
            validation_results['valid'] = False
        
        return validation_results

# Singleton instance for global access
_config_instance = None

def get_config() -> Config:
    """Get global configuration instance"""
    global _config_instance
    if _config_instance is None:
        _config_instance = Config()
    return _config_instance

def load_config(config_file: Optional[str] = None) -> Config:
    """Load configuration from specific file"""
    global _config_instance
    _config_instance = Config(config_file)
    return _config_instance

# Example usage and testing
if __name__ == "__main__":
    # Test configuration loading
    config = get_config()
    
    print("Configuration loaded:")
    print(json.dumps(config.to_dict(), indent=2))
    
    # Validate configuration
    validation = config.validate()
    print(f"\nConfiguration valid: {validation['valid']}")
    
    if validation['errors']:
        print("Errors:")
        for error in validation['errors']:
            print(f"  - {error}")
    
    if validation['warnings']:
        print("Warnings:")
        for warning in validation['warnings']:
            print(f"  - {warning}")
