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
