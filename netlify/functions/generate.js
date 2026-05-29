// netlify/functions/generate.js
// Proxies requests from Worvane tool pages to the Anthropic API.
// Store ANTHROPIC_API_KEY as a Netlify environment variable — never expose it client-side.
 
exports.handler = async function(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }
 
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
 
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }
 
  if (!body.messages || !Array.isArray(body.messages)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'messages array required' }) };
  }
 
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }
 
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-5-20250929',
        max_tokens: body.max_tokens || 4000,
        messages: body.messages
      })
    });
 
    const data = await response.json();
 
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
 
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API call failed', detail: err.message })
    };
  }
};
 
