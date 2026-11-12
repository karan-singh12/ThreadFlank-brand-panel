const PRIVATE_HOST = [
  /^localhost$/i,
  /\.local(host)?$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
];

/**
 * Parses a user-supplied URL the server is about to fetch and rejects anything
 * that isn't public http(s), so the API can't be pointed at internal services.
 * Hostname checks only — it doesn't resolve DNS.
 */
export function parsePublicUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (PRIVATE_HOST.some((re) => re.test(url.hostname))) return null;
  return url;
}
