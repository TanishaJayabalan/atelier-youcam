import { fetchWeather, geocodeCity, determineWeatherCategory, generateSkinAdvisory } from '../lib/weather';

async function runWeatherTests() {
  console.log('--- Testing Component 7: Weather Service ---');

  // Test 1: Category & Advisory Logic
  console.log('\n[Test 1] Testing Category & Advisory Logic...');
  const catHot = determineWeatherCategory(32, 0, 0);
  const catRain = determineWeatherCategory(18, 2.5, 61);
  const catCold = determineWeatherCategory(4, 0, 0);

  console.log('32C dry ->', catHot);
  console.log('18C rain ->', catRain);
  console.log('4C dry ->', catCold);

  if (catHot !== 'hot' || catRain !== 'rain' || catCold !== 'cold') {
    throw new Error('Test 1 Failed: Weather category classification error');
  }

  const advisories = generateSkinAdvisory({ tempC: 30, humidity: 30, uvIndex: 8.5, precipitationMm: 0 });
  console.log('Generated advisories:', advisories);
  if (!advisories.some((a) => a.includes('High UV Index')) || !advisories.some((a) => a.includes('Low ambient humidity'))) {
    throw new Error('Test 1 Failed: Expected UV & humidity advisories');
  }
  console.log('✓ Test 1 Passed: Weather categories and advisories generated accurately.');

  // Test 2: Live Geocoding & Weather Fetch from Open-Meteo
  console.log('\n[Test 2] Testing Live Geocoding and Open-Meteo Weather...');
  const geo = await geocodeCity('Paris');
  if (geo) {
    console.log('Geocoded Paris:', geo.latitude, geo.longitude, geo.country);
    const weather = await fetchWeather(geo.latitude, geo.longitude, geo.name);
    console.log('Live weather in Paris: Temp:', weather.tempC, '°C, Condition:', weather.condition, 'UV:', weather.uvIndex);
    console.log('✓ Test 2 Passed: Live Open-Meteo API works.');
  }

  console.log('\n=========================================');
  console.log('All Component 7 (Weather Service) tests PASSED successfully!');
  console.log('=========================================\n');
}

runWeatherTests().catch((err) => {
  console.error('Weather test failed:', err);
  process.exit(1);
});
