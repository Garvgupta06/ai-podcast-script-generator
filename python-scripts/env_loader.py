"""
Simple .env file loader for Python scripts
Loads environment variables from .env file in the root directory
"""

import os
from pathlib import Path
from typing import Dict, Optional

def load_env_file(env_file_path: Optional[str] = None) -> Dict[str, str]:
    """
    Load environment variables from .env file
    
    Args:
        env_file_path: Path to .env file. If None, looks for .env in parent directories
    
    Returns:
        Dictionary of environment variables loaded from file
    """
    if env_file_path is None:
        # Look for .env file in current directory and parent directories
        current_path = Path(__file__).resolve()
        for parent in [current_path.parent] + list(current_path.parents):
            potential_env = parent / '.env'
            if potential_env.exists():
                env_file_path = str(potential_env)
                break
        
        if env_file_path is None:
            print("Warning: No .env file found")
            return {}
    
    env_vars = {}
    
    try:
        with open(env_file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                
                # Parse key=value pairs
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Remove quotes if present
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    
                    env_vars[key] = value
                    
                    # Also set in os.environ if not already set
                    if key not in os.environ:
                        os.environ[key] = value
                else:
                    print(f"Warning: Invalid line {line_num} in .env file: {line}")
    
    except FileNotFoundError:
        print(f"Warning: .env file not found at {env_file_path}")
    except Exception as e:
        print(f"Error reading .env file: {e}")
    
    return env_vars

def get_env_var(key: str, default: Optional[str] = None) -> Optional[str]:
    """
    Get environment variable with .env file support
    
    Args:
        key: Environment variable name
        default: Default value if not found
    
    Returns:
        Environment variable value or default
    """
    # First check system environment
    value = os.getenv(key)
    
    if value is None:
        # Load .env file if not already loaded
        if not hasattr(get_env_var, '_env_loaded'):
            load_env_file()
            get_env_var._env_loaded = True
        
        # Check again after loading .env
        value = os.getenv(key, default)
    
    return value

# Auto-load .env on import
load_env_file()

if __name__ == "__main__":
    # Test the env loader
    print("Testing .env loader...")
    
    env_vars = load_env_file()
    print(f"Loaded {len(env_vars)} variables from .env file")
    
    # Test some common variables
    test_vars = [
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'SHOW_NAME',
        'HOST_NAME'
    ]
    
    for var in test_vars:
        value = get_env_var(var)
        if value:
            print(f"{var}: {'*' * min(len(value), 20)} (loaded)")
        else:
            print(f"{var}: Not set")
