// CORS utilities for Cloudflare Workers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
export function handleCors() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to any response
 */
export function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Create JSON response with CORS headers
 */
export function corsJsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}
