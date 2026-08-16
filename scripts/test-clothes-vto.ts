import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { normalizeGarmentCategory } from '../lib/youcam/clothes-vto';

async function runClothesVTOTests() {
  console.log('--- Testing Component 6: YouCam Clothes Virtual Try-On Service ---');

  // Test 1: Category Normalization
  console.log('\n[Test 1] Testing Category Normalization...');
  if (
    normalizeGarmentCategory('Silk Blouse') !== 'upper_body' ||
    normalizeGarmentCategory('Pleated Trousers') !== 'lower_body' ||
    normalizeGarmentCategory('Evening Maxi Dress') !== 'dress' ||
    normalizeGarmentCategory('Tailored Blazer') !== 'outerwear'
  ) {
    throw new Error('Test 1 Failed: Category normalization mismatch');
  }
  console.log('✓ Test 1 Passed: Garment categories normalized correctly.');

  console.log('\n=========================================');
  console.log('All Component 6 (Clothes VTO) tests PASSED successfully!');
  console.log('=========================================\n');
}

runClothesVTOTests().catch((err) => {
  console.error('Clothes VTO test failed:', err);
  process.exit(1);
});
