import { API_BASE_URL } from '@/lib/api/config';

/**
 * Thin proxy: forwards the raw image body to the backend /drape/cutout endpoint
 * and mirrors the X-Subject-Box response header back to the client.
 * No ML model code runs here.
 */
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.arrayBuffer();
  if (!body.byteLength) {
    return Response.json({ error: 'Send a JPG, PNG or WebP image under 12 MB.' }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE_URL}/drape/cutout`, {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('Content-Type') ?? 'image/jpeg',
      Authorization: req.headers.get('Authorization') ?? '',
    },
    body,
  });

  const subjectBox = upstream.headers.get('X-Subject-Box');
  const headers: Record<string, string> = {
    'Content-Type': 'image/png',
    'Cache-Control': 'private, max-age=86400',
  };
  if (subjectBox) headers['X-Subject-Box'] = subjectBox;

  return new Response(upstream.body, { status: upstream.status, headers });
}
