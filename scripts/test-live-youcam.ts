import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { transferMakeupLook } from '../lib/youcam/makeup-transfer';

async function testMakeupTransferLive() {
  console.log('--- Testing Live Makeup Transfer ---');
  try {
    const srcUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
    const refUrl = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80';

    const sRes = await fetch(srcUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const srcBuf = Buffer.from(await sRes.arrayBuffer());

    const rRes = await fetch(refUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const refBuf = Buffer.from(await rRes.arrayBuffer());

    console.log('Running transferMakeupLook...');
    const result = await transferMakeupLook({
      srcImage: srcBuf,
      refImage: refBuf,
    });
    console.log('🎉 Makeup Transfer Succeeded:', JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('transferMakeupLook Caught Error:', err.message);
  }
}

testMakeupTransferLive();
