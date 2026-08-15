import { applyOutfit, normalizeGarmentCategory } from '../lib/youcam/clothes-vto';

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

  // Test 2: Full applyOutfit execution with mock buffers
  console.log('\n[Test 2] Testing full applyOutfit service call with buffer inputs...');
  const dummyPerson = Buffer.from('mock-person-selfie');
  const dummyGarment = Buffer.from('mock-garment-photo');

  const result = await applyOutfit(dummyPerson, dummyGarment, {
    garmentName: 'Cream Silk Button-Down',
    category: 'outfit_top',
  });

  console.log('applyOutfit result:');
  console.log('- Result Image URL:', result.resultImageUrl);
  console.log('- Garment Name:', result.garmentName);
  console.log('- Category:', result.garmentCategory);

  if (!result.resultImageUrl || result.garmentCategory !== 'upper_body') {
    throw new Error('Test 2 Failed: applyOutfit returned invalid result');
  }
  console.log('✓ Test 2 Passed: applyOutfit runs end-to-end.');

  console.log('\n=========================================');
  console.log('All Component 6 (Clothes VTO) tests PASSED successfully!');
  console.log('=========================================\n');
}

runClothesVTOTests().catch((err) => {
  console.error('Clothes VTO test failed:', err);
  process.exit(1);
});
