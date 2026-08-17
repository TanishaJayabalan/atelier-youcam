'use server';

import fs from 'fs/promises';
import path from 'path';
import { resetTokenCache } from '@/lib/youcam/auth';

export async function updateEnvSecrets(clientId: string, clientSecret: string) {
  try {
    const cleanId = clientId.trim();
    const cleanSecret = clientSecret.trim();

    // 1. Immediately update in-memory Node process.env
    process.env.YOUCAM_CLIENT_ID = cleanId;
    process.env.YOUCAM_CLIENT_SECRET = cleanSecret;
    resetTokenCache();

    // 2. Persist to both .env and .env.local
    const filesToUpdate = ['.env', '.env.local'];

    for (const fileName of filesToUpdate) {
      const filePath = path.join(process.cwd(), fileName);
      let envContent = '';
      try {
        envContent = await fs.readFile(filePath, 'utf8');
      } catch (e: any) {
        if (e.code !== 'ENOENT') throw e;
      }

      const lines = envContent.split('\n');
      let foundId = false;
      let foundSecret = false;

      const updatedLines = lines.map(line => {
        if (line.startsWith('YOUCAM_CLIENT_ID=')) {
          foundId = true;
          return `YOUCAM_CLIENT_ID=${cleanId}`;
        }
        if (line.startsWith('YOUCAM_CLIENT_SECRET=')) {
          foundSecret = true;
          return `YOUCAM_CLIENT_SECRET=${cleanSecret}`;
        }
        return line;
      });

      if (!foundId) updatedLines.push(`YOUCAM_CLIENT_ID=${cleanId}`);
      if (!foundSecret) updatedLines.push(`YOUCAM_CLIENT_SECRET=${cleanSecret}`);

      const newContent = updatedLines.filter(Boolean).join('\n') + '\n';
      await fs.writeFile(filePath, newContent, 'utf8');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update env:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
