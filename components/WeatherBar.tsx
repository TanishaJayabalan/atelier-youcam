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
    <div className="bg-[#FAF9F6] text-[#2C2C2C] rounded-2xl p-4 shadow-sm border border-[#E8E2D9] flex flex-wrap items-center justify-between gap-4">
      {/* Left: Location & Condition */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-center text-amber-500 shadow-sm">
          <CloudSun className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
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
          <div className="text-base font-bold text-[#2C2C2C] flex items-center gap-2 mt-0.5">
            {weather ? (
              <>
                <span>{weather.tempC}°C ({weather.tempF}°F)</span>
                <span className="text-stone-500 font-normal text-xs">• {weather.condition}</span>
              </>
            ) : (
              <span className="text-xs text-stone-500">Loading forecast...</span>
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
            className="bg-white text-[#2C2C2C] text-xs px-3 py-1.5 rounded-lg border border-[#E8E2D9] focus:outline-none focus:border-amber-500 w-48 shadow-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#694A33] hover:bg-[#523926] text-white text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer flex items-center gap-1"
          >
            <Search className="w-3 h-3" /> Find
          </button>
        </form>
      )}

      {/* Right: Weather Metrics Pills */}
      {weather && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-white border border-[#E8E2D9] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-stone-500 shadow-sm">
            <Sun className={`w-3.5 h-3.5 ${weather.uvIndex >= 6 ? 'text-amber-500' : 'text-amber-400'}`} />
            <span>UV Index: <strong className={weather.uvIndex >= 6 ? 'text-amber-600' : 'text-[#2C2C2C]'}>{weather.uvIndex}</strong></span>
          </div>

          <div className="bg-white border border-[#E8E2D9] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-stone-500 shadow-sm">
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
            <span>Humidity: <strong className="text-[#2C2C2C]">{weather.humidity}%</strong></span>
          </div>

          {weather.uvIndex >= 6 && (
            <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-amber-700 text-[11px] font-medium shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              SPF 50+ Required
            </div>
          )}
        </div>
      )}
    </div>
  );
}
