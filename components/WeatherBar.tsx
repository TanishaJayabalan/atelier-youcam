'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CloudSun, MapPin, Sun, Droplets, ShieldAlert, Search } from 'lucide-react';
import { WeatherResult } from '@/lib/weather';

interface WeatherBarProps {
  weather: WeatherResult | null;
  onWeatherLoaded: (w: WeatherResult) => void;
}

export default function WeatherBar({ weather, onWeatherLoaded }: WeatherBarProps) {
  const [cityInput, setCityInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const fetchCurrentWeather = useCallback(async (lat?: number, lon?: number, city?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, city }),
      });
      if (res.ok) {
        const data: WeatherResult = await res.json();
        onWeatherLoaded(data);
      }
    } catch (e) {
      console.error('Weather fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [onWeatherLoaded]);

  // Request browser geolocation on mount
  useEffect(() => {
    if (!weather) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchCurrentWeather(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            // Geolocation denied/fallback to default
            fetchCurrentWeather(37.7749, -122.4194, 'San Francisco');
          }
        );
      } else {
        fetchCurrentWeather(37.7749, -122.4194, 'San Francisco');
      }
    }
  }, [weather, fetchCurrentWeather]);

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    fetchCurrentWeather(undefined, undefined, cityInput.trim());
    setShowSearch(false);
  };

  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 shadow-sm border border-stone-800 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Location & Condition */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400">
          <CloudSun className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500" />
              {weather?.city || 'Detecting location...'}
            </span>
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              {showSearch ? 'Cancel' : 'Change City'}
            </button>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
            {weather ? (
              <>
                <span>{weather.tempC}°C ({weather.tempF}°F)</span>
                <span className="text-stone-400 font-normal text-xs">• {weather.condition}</span>
              </>
            ) : (
              <span className="text-xs text-stone-400">Loading forecast...</span>
            )}
          </div>
        </div>
      </div>

      {/* Center/Search box if open */}
      {showSearch && (
        <form onSubmit={handleCitySearch} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Enter city (e.g. New York, Paris)"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            className="bg-stone-800 text-white text-xs px-3 py-1.5 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-500 w-48"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer flex items-center gap-1"
          >
            <Search className="w-3 h-3" /> Find
          </button>
        </form>
      )}

      {/* Right: Weather Metrics Pills */}
      {weather && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-stone-800/90 border border-stone-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-stone-300">
            <Sun className={`w-3.5 h-3.5 ${weather.uvIndex >= 6 ? 'text-amber-400' : 'text-amber-200'}`} />
            <span>UV Index: <strong className={weather.uvIndex >= 6 ? 'text-amber-400' : 'text-stone-200'}>{weather.uvIndex}</strong></span>
          </div>

          <div className="bg-stone-800/90 border border-stone-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-stone-300">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>Humidity: <strong className="text-stone-200">{weather.humidity}%</strong></span>
          </div>

          {weather.uvIndex >= 6 && (
            <div className="bg-amber-950/80 border border-amber-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-amber-300 text-[11px] font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              SPF 50+ Required
            </div>
          )}
        </div>
      )}
    </div>
  );
}
