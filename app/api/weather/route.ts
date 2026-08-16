import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather, geocodeCity } from '@/lib/weather';

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
      return NextResponse.json({ error: `City '${city}' not found.` }, { status: 404 });
    }

    // If lat & lon are provided
    if (typeof lat === 'number' && typeof lon === 'number') {
      const weather = await fetchWeather(lat, lon, city);
      return NextResponse.json(weather);
    }

    // Default to San Francisco coordinates if no parameters are passed
    const defaultWeather = await fetchWeather(37.7749, -122.4194, 'San Francisco');
    return NextResponse.json(defaultWeather);
  } catch (err: any) {
    console.error('Weather route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch weather data.' },
      { status: 502 }
    );
  }
}
