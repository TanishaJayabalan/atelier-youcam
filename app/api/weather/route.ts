import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather, geocodeCity, generateMockWeather } from '@/lib/weather';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { lat, lon, city } = body;

    // If city is provided without coordinates, geocode it
    if (city && (lat === undefined || lon === undefined)) {
      const geo = await geocodeCity(city);
      if (geo) {
        const weather = await fetchWeather(geo.latitude, geo.longitude, geo.name);
        return NextResponse.json(weather);
      }
    }

    // If lat & lon are provided
    if (typeof lat === 'number' && typeof lon === 'number') {
      const weather = await fetchWeather(lat, lon, city);
      return NextResponse.json(weather);
    }

    // Fallback to default/mock weather if no coordinates provided
    const fallbackWeather = generateMockWeather();
    return NextResponse.json(fallbackWeather);
  } catch (err: any) {
    console.error('Weather route error:', err);
    // Return gracefully with mock weather so app never crashes
    return NextResponse.json(generateMockWeather());
  }
}
