'use server';

import fs from 'fs/promises';
import path from 'path';

export async function updateEnvSecrets(clientId: string, clientSecret: string) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    
    // Check if .env exists, if not create it
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }

    const lines = envContent.split('\n');
    let foundId = false;
    let foundSecret = false;

    const updatedLines = lines.map(line => {
      if (line.startsWith('YOUCAM_CLIENT_ID=')) {
        foundId = true;
        return `YOUCAM_CLIENT_ID=${clientId}`;
      }
      if (line.startsWith('YOUCAM_CLIENT_SECRET=')) {
        foundSecret = true;
        return `YOUCAM_CLIENT_SECRET=${clientSecret}`;
      }
      return line;
    });

    if (!foundId) updatedLines.push(`YOUCAM_CLIENT_ID=${clientId}`);
    if (!foundSecret) updatedLines.push(`YOUCAM_CLIENT_SECRET=${clientSecret}`);

    // Ensure trailing newline
    const newContent = updatedLines.join('\n') + (updatedLines[updatedLines.length - 1] === '' ? '' : '\n');
    
    await fs.writeFile(envPath, newContent, 'utf8');
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update .env:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
