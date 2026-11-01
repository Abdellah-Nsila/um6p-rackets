export function safeReturnTo(v: unknown): string {
  if (typeof v !== 'string' || v.length > 200) return '/';
  // must be a relative path: one leading slash, no "//host", no backslashes, no control chars
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\') || /[\x00-\x1f]/.test(v)) return '/';
  return v;
}