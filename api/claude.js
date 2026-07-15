// Vercel serverless function: POST /api/claude
// Keeps the Anthropic API key on the server. The frontend (js/app.js) only
// ever talks to this endpoint — never to api.anthropic.com directly.
//
// Deploy: push this repo to GitHub, import into Vercel, set the
// ANTHROPIC_API_KEY environment variable in the Vercel project settings.
// No other config needed — Vercel auto-detects this /api folder.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not configured on the server. Add it in your Vercel project\'s Environment Variables.'
    });
    return;
  }

  try {
    const { system, messages, max_tokens } = req.body || {};
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Request body must include a non-empty "messages" array.' });
      return;
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: max_tokens || 1000,
        system,
        messages
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: (data && data.error && data.error.message) || 'Anthropic API error' });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
};
