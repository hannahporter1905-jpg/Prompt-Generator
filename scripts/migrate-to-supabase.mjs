/**
 * Migration script: Airtable → Supabase
 *
 * HOW TO RUN:
 *   1. Open a terminal in the project root
 *   2. Set your credentials as env vars, then run:
 *
 *      SUPABASE_URL=https://hggcgloqujgqvtswstlf.supabase.co \
 *      SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *      AIRTABLE_PAT=patbaRXTVDaXqBb61... \
 *      node scripts/migrate-to-supabase.mjs
 *
 * This script is safe to run multiple times — it uses upsert so it won't
 * create duplicates if you run it again.
 */

// ── Config — reads from environment variables ─────────────────────────────
// Set these before running:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AIRTABLE_PAT
// Or create a scripts/.env.migration file (see README comment below).
const SUPABASE_URL               = process.env.SUPABASE_URL               || '';
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY  || '';
const AIRTABLE_PAT               = process.env.AIRTABLE_PAT               || '';
const AIRTABLE_BASE_ID           = 'appp9iLlSQTlnfytA';

// ─────────────────────────────────────────────────────────────────────────

/** Fetch ALL records from an Airtable table (handles pagination automatically) */
async function fetchAllAirtableRecords(tableName) {
  const records = [];
  let offset = null;

  console.log(`\nFetching from Airtable table: "${tableName}"...`);

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`
    );
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable error for "${tableName}" (${res.status}): ${err}`);
    }

    const data = await res.json();
    records.push(...data.records);
    offset = data.offset || null;
    console.log(`  Fetched ${records.length} records so far...`);
  } while (offset);

  console.log(`  Done — total: ${records.length} records`);
  return records;
}

/** POST to Supabase REST API (upsert) */
async function supabaseUpsert(table, rows, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey':        SUPABASE_SERVICE_ROLE_KEY,
      'Prefer':        'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upsert into "${table}" failed (${res.status}): ${err}`);
  }
}

async function main() {

  const missing = [
    !SUPABASE_URL              && 'SUPABASE_URL',
    !SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
    !AIRTABLE_PAT              && 'AIRTABLE_PAT',
  ].filter(Boolean);
  if (missing.length) {
    console.error(`\n❌  Missing env vars: ${missing.join(', ')}\n`);
    console.error('Set them before running — see the HOW TO RUN comment at the top of this file.\n');
    process.exit(1);
  }

  console.log('Starting migration: Airtable → Supabase\n');

  // ── 1. Migrate "Web Image Analysis" → web_image_analysis ───────────────
  const promptRecords = await fetchAllAirtableRecords('Web Image Analysis');

  const promptRows = promptRecords.map(r => ({
    airtable_id:     r.id,
    image_name:      r.fields.image_name      || null,
    prompt_name:     r.fields.prompt_name     || null,
    brand_name:      r.fields.brand_name      || null,
    format_layout:   r.fields.format_layout   || null,
    primary_object:  r.fields.primary_object  || null,
    subject:         r.fields.subject         || null,
    lighting:        r.fields.lighting        || null,
    mood:            r.fields.mood            || null,
    background:      r.fields.Background      || r.fields.background || null, // Airtable uses capital B
    positive_prompt: r.fields.positive_prompt || null,
    negative_prompt: r.fields.negative_prompt || null,
  }));

  console.log(`\nUploading ${promptRows.length} prompt records to Supabase...`);
  // Upload in batches of 50 to stay well under limits
  for (let i = 0; i < promptRows.length; i += 50) {
    const batch = promptRows.slice(i, i + 50);
    await supabaseUpsert('web_image_analysis', batch, 'airtable_id');
    console.log(`  Uploaded batch ${Math.floor(i / 50) + 1} (${i + batch.length}/${promptRows.length})`);
  }
  console.log('  ✅  web_image_analysis done');

  // ── 2. Migrate "Liked Images" → liked_images ────────────────────────────
  let likedRecords = [];
  try {
    likedRecords = await fetchAllAirtableRecords('Liked Images');
  } catch (e) {
    console.warn(`  ⚠️  Could not fetch "Liked Images" table: ${e.message}`);
    console.warn('  Skipping liked images migration — that table may be empty or named differently.');
  }

  if (likedRecords.length > 0) {
    const likedRows = likedRecords
      .map(r => ({
        record_id:  r.fields.record_id || r.fields.Record_ID || r.fields.name || r.id,
        img_url:    r.fields.image_from_url || r.fields['Direct Link'] || r.fields.img_url
                    || r.fields['Image URL'] || r.fields.url || null,
        brand_name: r.fields.brand_name || null,
      }))
      .filter(row => row.img_url); // skip rows with no image URL

    console.log(`\nUploading ${likedRows.length} liked images to Supabase...`);
    for (let i = 0; i < likedRows.length; i += 50) {
      const batch = likedRows.slice(i, i + 50);
      await supabaseUpsert('liked_images', batch, 'record_id');
      console.log(`  Uploaded batch ${Math.floor(i / 50) + 1} (${i + batch.length}/${likedRows.length})`);
    }
    console.log('  ✅  liked_images done');
  }

  console.log('\n🎉  Migration complete!\n');
  console.log('Next steps:');
  console.log('  1. Add these to Vercel env vars:');
  console.log(`       VITE_SUPABASE_URL  = ${SUPABASE_URL}`);
  console.log('       VITE_SUPABASE_ANON_KEY = eyJhbGci... (your anon key)');
  console.log('       SUPABASE_SERVICE_ROLE_KEY = eyJhbGci... (your service role key — for n8n)');
  console.log('  2. Update your n8n workflows (see instructions in SUPABASE_N8N_GUIDE.md)');
}

main().catch(err => {
  console.error('\n❌  Migration failed:', err.message);
  process.exit(1);
});
