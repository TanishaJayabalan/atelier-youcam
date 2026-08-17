import fs from 'fs';
import path from 'path';

/**
 * Converts a Base64 data URL or raw Base64 string into a binary Buffer and content type.
 */
export function base64ToBuffer(base64OrDataUrl: string): { buffer: Buffer; contentType: string } {
  let cleanBase64 = base64OrDataUrl;
  let contentType = 'image/jpeg';

  const match = base64OrDataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    contentType = match[1];
    cleanBase64 = match[2];
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  return { buffer, contentType };
}

/**
 * Robustly converts any image representation (remote URL, data URL, base64, or local /public path)
 * into a binary Buffer and Content-Type.
 */
export async function resolveImageBuffer(input: string | Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  if (!input) {
    throw new Error('Image input is required.');
  }

  if (Buffer.isBuffer(input)) {
    return { buffer: input, contentType: 'image/jpeg' };
  }

  const str = String(input).trim();

  // 1. Remote HTTP / HTTPS URL
  if (str.startsWith('http://') || str.startsWith('https://')) {
    const res = await fetch(str);
    if (!res.ok) {
      throw new Error(`Failed to download image from URL (${res.status}): ${str}`);
    }
    const arrayBuf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return { buffer: Buffer.from(arrayBuf), contentType };
  }

  // 2. Local public file path (e.g. /images/model-1.jpg)
  if (str.startsWith('/')) {
    const localPath = path.join(process.cwd(), 'public', str.replace(/^\//, ''));
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const ext = path.extname(localPath).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      return { buffer, contentType };
    }
  }

  // 3. Data URL (e.g. data:image/jpeg;base64,...)
  const match = str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    return { buffer, contentType };
  }

  // 4. Raw Base64 string
  const buffer = Buffer.from(str, 'base64');
  return { buffer, contentType: 'image/jpeg' };
}
