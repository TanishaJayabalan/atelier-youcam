import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { upsertClosetItem, getClosetItems, saveLookSession, getLookSession } from '../lib/supabase';

async function runDatabaseTests() {
  console.log('--- Testing Component 8: Live Supabase Database Layer ---');

  // Test 1: Upsert and query closet item
  console.log('\n[Test 1] Testing Closet Item storage in Supabase PostgreSQL...');
  const testItem = await upsertClosetItem({
    category: 'outfit_top',
    name: 'Silk Crepe Blouse',
    brand: 'Reformation',
    image_url: 'https://images.unsplash.com/photo-1551803091-e20673f15770',
    is_owned: true,
    metadata: {
      formality_tag: 'classy',
      color: 'Ivory Cream',
      weather_tags: ['warm', 'cool'],
    },
  });

  console.log('Upserted item ID:', testItem.id, 'Name:', testItem.name);

  const items = await getClosetItems({ category: 'outfit_top' });
  console.log('Retrieved outfit_top count from Supabase:', items.length);

  if (!items.some((i) => i.id === testItem.id && i.name === 'Silk Crepe Blouse')) {
    throw new Error('Test 1 Failed: Closet item retrieval from Supabase failed');
  }
  console.log('✓ Test 1 Passed: Closet item storage and filtering works on live PostgreSQL.');

  // Test 2: Save and retrieve look session
  console.log('\n[Test 2] Testing Look Session persistence in Supabase...');
  const testSession = await saveLookSession({
    vibe: 'classy',
    selfie_url: 'https://example.com/selfie.jpg',
    weather: { tempC: 22, condition: 'Clear' },
    recommendation: { explanation: 'Sample look for a warm day' },
  });

  console.log('Saved session ID:', testSession.id, 'Vibe:', testSession.vibe);

  const fetchedSession = await getLookSession(testSession.id);
  console.log('Fetched session Vibe:', fetchedSession?.vibe, 'Created:', fetchedSession?.created_at);

  if (fetchedSession?.id !== testSession.id || fetchedSession?.vibe !== 'classy') {
    throw new Error('Test 2 Failed: Look session retrieval mismatch');
  }
  console.log('✓ Test 2 Passed: Look session saved and retrieved from live PostgreSQL.');

  console.log('\n=========================================');
  console.log('All Component 8 (Live Database) tests PASSED successfully!');
  console.log('=========================================\n');
}

runDatabaseTests().catch((err) => {
  console.error('Database test failed:', err);
  process.exit(1);
});
