export type WeatherCategory = 'hot' | 'warm' | 'cool' | 'cold' | 'rain' | 'snow';

export interface WeatherResult {
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  tempC: number;
  tempF: number;
  apparentTempC: number;
  humidity: number; // percentage 0 - 100
  uvIndex: number; // 0 - 12+
  precipitationMm: number;
  isDay: boolean;
  weatherCode: number;
  condition: string;
  conditionCategory: WeatherCategory;
  skinAdvisory: string[];
}

const WMO_CODE_MAP: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  71: 'Slight Snow Fall',
  73: 'Moderate Snow Fall',
  75: 'Heavy Snow Fall',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  95: 'Thunderstorm',
};

/**
 * Maps WMO code, temperature, and precipitation to a unified weather category.
 */
export function determineWeatherCategory(
  tempC: number,
  precipitationMm: number,
  weatherCode: number
): WeatherCategory {
  if (weatherCode >= 71 && weatherCode <= 77) return 'snow';
  if (precipitationMm > 0.5 || (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return 'rain';
  }
  if (tempC >= 28) return 'hot';
  if (tempC >= 19) return 'warm';
  if (tempC >= 10) return 'cool';
  return 'cold';
}

/**
 * Generates skincare and styling advisories based on meteorological metrics.
 */
export function generateSkinAdvisory(metrics: {
  tempC: number;
  humidity: number;
  uvIndex: number;
  precipitationMm: number;
}): string[] {
  const advisories: string[] = [];

  if (metrics.uvIndex >= 6) {
    advisories.push(`High UV Index (${metrics.uvIndex.toFixed(1)}) — Broad-spectrum SPF 50+ and antioxidant defense are essential today.`);
  } else if (metrics.uvIndex >= 3) {
    advisories.push(`Moderate UV Index (${metrics.uvIndex.toFixed(1)}) — Daily SPF 30+ recommended.`);
  } else {
    advisories.push(`Low UV Index (${metrics.uvIndex.toFixed(1)}) — Standard daytime SPF.`);
  }

  if (metrics.humidity < 35) {
    advisories.push(`Low ambient humidity (${metrics.humidity}%) — Prioritize hyaluronic acid or ceramide barrier protection.`);
  } else if (metrics.humidity > 70) {
    advisories.push(`High humidity (${metrics.humidity}%) — Opt for lightweight, non-comedogenic and mattifying textures.`);
  }

  if (metrics.tempC >= 28) {
    advisories.push('Hot weather — Sweat-resistant, breathable makeup finishes and light natural fabrics.');
  } else if (metrics.tempC <= 10) {
    advisories.push('Cold temperatures — Rich moisture barrier cream and wind-protecting outerwear.');
  }

  if (metrics.precipitationMm > 0.5) {
    advisories.push('Rain expected — Waterproof mascara and water-resistant outerwear suggested.');
  }

  return advisories;
}

/**
 * Fetches current weather for given latitude and longitude from Open-Meteo (free, no API key).
 */
export async function fetchWeather(lat: number, lon: number, cityName?: string): Promise<WeatherResult> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,uv_index',
    timezone: 'auto',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  let current: any = {};
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.warn(`Open-Meteo Weather API failed [HTTP ${res.status}], falling back to default weather metrics.`);
    } else {
      const data = await res.json();
      current = data.current || {};
    }
  } catch (err: any) {
    console.warn(`Open-Meteo Weather API error (${err.message}), falling back to default weather metrics.`);
  }

  const tempC = Math.round((current.temperature_2m ?? 22) * 10) / 10;
  const tempF = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
  const apparentTempC = Math.round((current.apparent_temperature ?? tempC) * 10) / 10;
  const humidity = Math.round(current.relative_humidity_2m ?? 50);
  const uvIndex = Math.round((current.uv_index ?? 5) * 10) / 10;
  const precipitationMm = Math.round((current.precipitation ?? 0) * 10) / 10;
  const isDay = current.is_day === 1;
  const weatherCode = current.weather_code ?? 0;
  const condition = WMO_CODE_MAP[weatherCode] || 'Clear';

  const conditionCategory = determineWeatherCategory(tempC, precipitationMm, weatherCode);
  const skinAdvisory = generateSkinAdvisory({ tempC, humidity, uvIndex, precipitationMm });

  return {
    city: cityName || 'Current Location',
    latitude: lat,
    longitude: lon,
    tempC,
    tempF,
    apparentTempC,
    humidity,
    uvIndex,
    precipitationMm,
    isDay,
    weatherCode,
    condition,
    conditionCategory,
    skinAdvisory,
  };
}

/**
 * Geocodes a city name to latitude / longitude coordinates using Open-Meteo Geocoding.
 */
export async function geocodeCity(query: string): Promise<{
  name: string;
  country: string;
  latitude: number;
  longitude: number;
} | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const first = data?.results?.[0];
  if (!first) return null;

  return {
    name: first.name,
    country: first.country || '',
    latitude: first.latitude,
    longitude: first.longitude,
  };
}
