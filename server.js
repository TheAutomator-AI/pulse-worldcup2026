// Local / traditional Node hosting entry point.
// Serves the static frontend and exposes the same POST /api/claude route
// used by js/app.js, so the app behaves identically here and on Vercel.
//
// Usage:
//   npm install
//   cp .env.example .env      (then add your ANTHROPIC_API_KEY)
//   npm start
//   open http://localhost:3000

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.'
    });
  }

  try {
    const { system, messages, max_tokens } = req.body || {};
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Request body must include a non-empty "messages" array.' });
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
      return res.status(upstream.status).json({ error: (data && data.error && data.error.message) || 'Anthropic API error' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  PULSE is running → http://localhost:${PORT}\n`);
});
