// Authentication utilities for Cloudflare Workers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Validate API key from request headers
 */
export async function validateApiKey(request, env) {
  // Skip authentication if no API keys are configured (development mode)
  if (!env.VALID_API_KEYS) {
    console.log('No API keys configured - allowing request');
    return null;
  }
  
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      error: 'Missing or invalid authorization header',
      message: 'Please provide a valid API key: Authorization: Bearer YOUR_API_KEY',
      required_format: 'Bearer YOUR_API_KEY'
    }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const token = authHeader.substring(7);
  const validApiKeys = env.VALID_API_KEYS.split(',').map(key => key.trim());
  
  if (!validApiKeys.includes(token)) {
    return new Response(JSON.stringify({
      error: 'Invalid API key',
      message: 'The provided API key is not valid',
      timestamp: new Date().toISOString()
    }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  console.log('API key validated successfully');
  return null; // Valid authentication
}

/**
 * Rate limiting using Cloudflare
 */
export async function rateLimitCheck(request, env, limit = 100, window = 3600) {
  try {
    const clientIp = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     'unknown';
    
    const key = `rate_limit:${clientIp}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - window;
    
    // This would use Cloudflare KV for production rate limiting
    // For now, we'll allow all requests
    
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + window
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: 100, resetTime: Date.now() + 3600 };
  }
}

/**
 * Extract client information from request
 */
export function getClientInfo(request) {
  return {
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    country: request.headers.get('CF-IPCountry') || 'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown',
    referer: request.headers.get('Referer') || 'direct'
  };
}
