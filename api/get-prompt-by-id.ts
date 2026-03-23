import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL             = process.env.SUPABASE_URL             || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function sbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey':        SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!res.ok) throw new Error(`Supabase GET failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { recordId } = req.body;
    if (!recordId) return res.status(400).json({ error: 'recordId is required' });

    const rows = await sbGet(`web_image_analysis?id=eq.${recordId}&select=*`);
    const result = Array.isArray(rows) ? rows[0] : rows;

    if (!result) return res.status(404).json({ error: 'Prompt not found' });

    return res.status(200).json({
      format_layout:   result.format_layout   || '',
      primary_object:  result.primary_object  || '',
      subject:         result.subject         || '',
      lighting:        result.lighting        || '',
      mood:            result.mood            || '',
      background:      result.background      || '',
      positive_prompt: result.positive_prompt || '',
      negative_prompt: result.negative_prompt || '',
    });

  } catch (error) {
    console.error('Error in get-prompt-by-id:', error);
    return res.status(500).json({
      error: 'Failed to fetch prompt',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
