/**
 * Converts a Supabase Storage public URL to a resized thumbnail URL
 * using Supabase's built-in image transformation API.
 *
 * Original:    .../storage/v1/object/public/bucket/file.png
 * Transformed: .../storage/v1/render/image/public/bucket/file.png?width=W&quality=Q&format=webp
 *
 * Non-Supabase URLs (e.g. Google Drive) are returned unchanged.
 */
export function supabaseThumbnail(url: string, width = 400, quality = 70): string {
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) return url;
  const transformed = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  );
  return `${transformed}?width=${width}&quality=${quality}&format=webp`;
}
