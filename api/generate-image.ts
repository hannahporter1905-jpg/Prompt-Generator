import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSign } from 'crypto';

// Uses a Google Service Account JSON key to get a short-lived ID token for Cloud Run.
// The service account JSON is stored as a single env var — no refresh tokens needed.
async function getCloudRunIdToken(cloudRunUrl: string): Promise<string> {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set');

  let sa: { client_email: string; private_key: string };
  try {
    sa = JSON.parse(saJson);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }

  // Build a JWT that asks Google to issue an ID token scoped to our Cloud Run URL
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    target_audience: cloudRunUrl, // tells Google which service we want to call
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${header}.${payload}.${signature}`;

  // Exchange the signed JWT for a Google-issued ID token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Google token endpoint error:', response.status, errorBody);
    throw new Error(`Failed to get Cloud Run ID token (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  if (data.id_token) return data.id_token;
  throw new Error('No id_token returned from Google token endpoint');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, provider, aspectRatio, imageSize, backend, resolution } = req.body;

    if (!prompt || !provider) {
      return res.status(400).json({ error: 'Prompt and provider are required' });
    }

    // ── Cloud Run backend (high-res 1K/2K/3K/4K) ───────────────────────────
    if (backend === 'cloud-run') {
      const cloudRunUrl = process.env.CLOUD_RUN_URL || process.env.NEXT_PUBLIC_IMAGE_API_URL;
      if (!cloudRunUrl) {
        return res.status(500).json({ error: 'CLOUD_RUN_URL is not configured' });
      }

      const idToken = await getCloudRunIdToken(cloudRunUrl);

      console.log('Sending to Cloud Run backend:', { prompt, provider, aspectRatio, resolution });

      const response = await fetch(`${cloudRunUrl}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt,
          provider,
          aspectRatio: aspectRatio || '1:1',
          resolution: resolution || '1K',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloud Run error:', response.status, errorText);
        return res.status(500).json({
          error: `Cloud Run failed (${response.status}): ${errorText || 'No details returned'}`
        });
      }

      const data = await response.json();
      console.log('Cloud Run RAW response:', JSON.stringify(data));
      const result = Array.isArray(data) ? data[0] : data;
      return res.status(200).json(result);
    }

    // ── n8n backend (default) ──────────────────────────────────────────────
    const webhookUrl = process.env.N8N_WEBHOOK_GENERATE_IMAGE;
    if (!webhookUrl) {
      return res.status(500).json({ error: 'Image generation webhook URL is not configured' });
    }

    console.log('Sending image generation request to n8n:', { prompt, provider, aspectRatio, imageSize });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider,
        aspectRatio: aspectRatio || '1:1',
        imageSize: imageSize || 'default',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Failed to generate image', details: errorText });
    }

    const data = await response.json();
    console.log('n8n RAW response:', JSON.stringify(data));
    const result = Array.isArray(data) ? data[0] : data;
    return res.status(200).json(result);

  } catch (error) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
