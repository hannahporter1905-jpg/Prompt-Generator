import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getCloudRunIdToken(cloudRunUrl: string, req: VercelRequest): Promise<string> {
  const workloadProvider = process.env.GCP_WORKLOAD_PROVIDER;
  const serviceAccount   = process.env.GCP_SERVICE_ACCOUNT;

  if (!workloadProvider || !serviceAccount) {
    const missing = [
      !workloadProvider && 'GCP_WORKLOAD_PROVIDER',
      !serviceAccount   && 'GCP_SERVICE_ACCOUNT',
    ].filter(Boolean).join(', ');
    throw new Error(`Missing env vars: ${missing}`);
  }

  const oidcToken =
    (req.headers['x-vercel-oidc-token'] as string | undefined) ||
    process.env.VERCEL_OIDC_TOKEN;

  if (!oidcToken) {
    throw new Error('No Vercel OIDC token found. Make sure OIDC is enabled in Vercel project settings.');
  }

  // Step 1: Exchange Vercel OIDC token → Google federated access token
  const stsRes = await fetch('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:           'urn:ietf:params:oauth:grant-type:token-exchange',
      audience:             `//iam.googleapis.com/${workloadProvider}`,
      scope:                'https://www.googleapis.com/auth/cloud-platform',
      requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      subject_token_type:   'urn:ietf:params:oauth:token-type:jwt',
      subject_token:        oidcToken,
    }),
  });

  if (!stsRes.ok) {
    const err = await stsRes.text();
    throw new Error(`Google STS token exchange failed (${stsRes.status}): ${err}`);
  }
  const { access_token: federatedToken } = await stsRes.json();

  // Step 2: Use federated token to generate a Cloud Run ID token
  const idTokenRes = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateIdToken`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${federatedToken}`,
      },
      body: JSON.stringify({ audience: cloudRunUrl, includeEmail: true }),
    }
  );

  if (!idTokenRes.ok) {
    const err = await idTokenRes.text();
    throw new Error(`generateIdToken failed (${idTokenRes.status}): ${err}`);
  }
  const { token } = await idTokenRes.json();
  return token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const baseUrl =
    process.env.GCP_CLOUD_RUN_URL ||
    process.env.CLOUD_RUN_URL ||
    'https://image-generator-69452143295.us-central1.run.app';

  try {
    const { imageUrl, editInstructions, resolution = '1K' } = req.body;

    if (!imageUrl || !editInstructions) {
      return res.status(400).json({ error: 'Image URL and edit instructions are required' });
    }

    const idToken = await getCloudRunIdToken(baseUrl, req);

    console.log('Sending image edit request to Cloud Run:', { imageUrl, editInstructions, resolution });

    const response = await fetch(`${baseUrl}/edit-image`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ imageUrl, editInstructions, resolution }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloud Run edit error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to edit image', details: errorText });
    }

    const data = await response.json();
    console.log('Cloud Run image edit response:', data);
    return res.status(200).json(data);

  } catch (error) {
    console.error('Image edit error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
