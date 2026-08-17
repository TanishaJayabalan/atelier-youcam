import { NextRequest } from 'next/server';

export interface YouCamCredentials {
  clientId?: string;
  clientSecret?: string;
}

/**
 * Extracts custom user-provided YouCam API credentials from NextRequest headers or JSON body.
 * Falls back to server environment variables if not provided.
 */
export function extractYouCamCredentials(req: NextRequest, body?: any): YouCamCredentials {
  const headerId = req.headers.get('x-youcam-client-id') || undefined;
  const headerSecret = req.headers.get('x-youcam-client-secret') || undefined;

  const bodyId = body?.apiClientId || body?.clientId || undefined;
  const bodySecret = body?.apiSecret || body?.clientSecret || undefined;

  return {
    clientId: headerId || bodyId || process.env.YOUCAM_CLIENT_ID,
    clientSecret: headerSecret || bodySecret || process.env.YOUCAM_CLIENT_SECRET,
  };
}
