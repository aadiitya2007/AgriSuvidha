import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Card } from './ui/Card';
import {
  Sun,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface WeatherWidgetProps {
  district?: string;
  className?: string;
}

interface DayForecast {
  day: string;
  tempMax: number;
  tempMin: number;
  condition: 'Sunny' | 'Partly Cloudy' | 'Chance of Rain';
  rainChance: number;
  icon: any;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  district = 'Nagpur',
  className = '',
}) => {
  const { t, language } = useLanguage();
  const [selectedDistrict, setSelectedDistrict] = useState(district);

  // Weather profiles for typical Maharashtra/Central India Mandi regions
  const weatherData: Record<
    string,
    {
      currentTemp: number;
      feelsLike: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      rainChance: number;
      advisoryType: 'safe' | 'alert';
      advisoryText: string;
      forecast: DayForecast[];
    }
  > = {
    Nagpur: {
      currentTemp: 32,
      feelsLike: 34,
      condition: 'Clear & Sunny',
      humidity: 48,
      windSpeed: 12,
      rainChance: 8,
      advisoryType: 'safe',
      advisoryText:
        language === 'mr'
          ? 'धान्य उघड्यावर वाळवण्यासाठी हवामान उत्तम आहे. पुढील ४८ तासांत पावसाची शक्यता नाही.'
          : language === 'hi'
          ? 'फसल को खुले यार्ड में सुखाने के लिए मौसम अनुकूल है। अगले ४८ घंटों में बारिश की संभावना नहीं है।'
          : 'Ideal dry conditions across Nagpur APMC yard. Low precipitation risk (<10%) over next 48 hours.',
      forecast: [
        { day: 'Today', tempMax: 34, tempMin: 22, condition: 'Sunny', rainChance: 8, icon: Sun },
        { day: 'Tomorrow', tempMax: 33, tempMin: 21, condition: 'Partly Cloudy', rainChance: 15, icon: CloudSun },
        { day: 'Day 3', tempMax: 35, tempMin: 23, condition: 'Sunny', rainChance: 5, icon: Sun },
      ],
    },
    Pune: {
      currentTemp: 28,
      feelsLike: 29,
      condition: 'Partly Cloudy',
      humidity: 62,
      windSpeed: 16,
      rainChance: 25,
      advisoryType: 'safe',
      advisoryText:
        language === 'mr'
          ? 'हवामान मध्यम सुखद आहे. संध्याकाळी हलक्या सरींची शक्यता असल्याने रात्री धान्य झाकून ठेवावे.'
          : language === 'hi'
          ? 'मौसम सामान्य है। शाम को हल्की बूंदाबांदी संभव है, रात में अनाज को तिरपाल से ढक कर रखें।'
          : 'Mildly humid. Light localized showers possible late evening; keep tarpaulins on hand.',
      forecast: [
        { day: 'Today', tempMax: 29, tempMin: 19, condition: 'Partly Cloudy', rainChance: 25, icon: CloudSun },
        { day: 'Tomorrow', tempMax: 28, tempMin: 18, condition: 'Chance of Rain', rainChance: 40, icon: CloudRain },
        { day: 'Day 3', tempMax: 30, tempMin: 20, condition: 'Sunny', rainChance: 12, icon: Sun },
      ],
    },
    Nashik: {
      currentTemp: 29,
      feelsLike: 30,
      condition: 'Breezy & Clear',
      humidity: 55,
      windSpeed: 18,
      rainChance: 10,
      advisoryType: 'safe',
      advisoryText:
        language === 'mr'
          ? 'कांदा व सोयाबीन मालाची वाहतूक करण्यास उत्तम हवामान. रस्ते कोरडे व सुरक्षित आहेत.'
          : language === 'hi'
          ? 'प्याज व सोयाबीन आवक के लिए मौसम उत्तम। रास्ते सूखे और परिवहन के अनुकूल हैं।'
          : 'Clear skies. Optimal conditions for onion and oilseed transport to Mandi.',
      forecast: [
        { day: 'Today', tempMax: 30, tempMin: 18, condition: 'Sunny', rainChance: 10, icon: Sun },
        { day: 'Tomorrow', tempMax: 31, tempMin: 19, condition: 'Sunny', rainChance: 8, icon: Sun },
        { day: 'Day 3', tempMax: 29, tempMin: 17, condition: 'Partly Cloudy', rainChance: 20, icon: CloudSun },
      ],
    },
    Amravati: {
      currentTemp: 33,
      feelsLike: 35,
      condition: 'Sunny & Hot',
      humidity: 42,
      windSpeed: 11,
      rainChance: 5,
      advisoryType: 'safe',
      advisoryText:
        language === 'mr'
          ? 'कपाशी व तूर खरेदीसाठी कोरडे वातावरण. ओलावा चाचणीत अतिरिक्त कपात होणार नाही.'
          : language === 'hi'
          ? 'कपास व दलहन खरीद हेतु एकदम शुष्क वातावरण। नमी परीक्षण अनुकूल रहेगा।'
          : 'Dry weather. Moisture content readings expected to remain well within Grade-A limits.',
      forecast: [
        { day: 'Today', tempMax: 35, tempMin: 23, condition: 'Sunny', rainChance: 5, icon: Sun },
        { day: 'Tomorrow', tempMax: 36, tempMin: 24, condition: 'Sunny', rainChance: 4, icon: Sun },
        { day: 'Day 3', tempMax: 34, tempMin: 22, condition: 'Sunny', rainChance: 6, icon: Sun },
      ],
    },
  };

  const currentData = weatherData[selectedDistrict] || weatherData['Nagpur'];

  return (
    <Card className={`overflow-hidden border-sky-100 bg-gradient-to-br from-sky-50/70 via-white to-emerald-50/40 shadow-sm ${className}`}>
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header with district dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                {t.weather?.title || 'Mandi Area Weather Forecast'}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
                  Live Ag-Weather
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                District Real-Time Meteorological & Crop Moisture Guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-semibold text-slate-500">Mandi District:</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="Nagpur">Nagpur (नागपूर)</option>
              <option value="Pune">Pune (पुणे)</option>
              <option value="Nashik">Nashik (नाशिक)</option>
              <option value="Amravati">Amravati (अमरावती)</option>
            </select>
          </div>
        </div>

        {/* Current Weather Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Main Temperature */}
          <div className="flex items-center gap-4 bg-white/80 p-4 rounded-2xl border border-sky-100/60 shadow-2xs">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-500">
              <Sun className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {currentData.currentTemp}°C
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  / Feels {currentData.feelsLike}°C
                </span>
              </div>
              <p className="text-xs font-semibold text-sky-700">{currentData.condition}</p>
            </div>
          </div>

          {/* Environmental metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <Droplets className="w-3 h-3 text-sky-500" />
                {t.weather?.humidity || 'Humidity'}
              </span>
              <span className="text-base font-bold font-mono text-slate-800">{currentData.humidity}%</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <CloudRain className="w-3 h-3 text-blue-500" />
                {t.weather?.rainChance || 'Rain Chance'}
              </span>
              <span className="text-base font-bold font-mono text-slate-800">{currentData.rainChance}%</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <Wind className="w-3 h-3 text-teal-500" />
                {t.weather?.wind || 'Wind'}
              </span>
              <span className="text-base font-bold font-mono text-slate-800">{currentData.windSpeed} km/h</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Drying Index</span>
              <span className="text-base font-bold text-emerald-700">Excellent</span>
            </div>
          </div>

          {/* 3-Day Mini Forecast */}
          <div className="bg-white/80 p-3 rounded-2xl border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              3-Day Procurement Outlook
            </span>
            <div className="divide-y divide-slate-100 text-xs">
              {currentData.forecast.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="py-1.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-700 w-16">{f.day}</span>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Icon className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px]">{f.condition}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      {f.tempMax}° / {f.tempMin}°
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agricultural Mandi Advisory Banner */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-900 block mb-0.5">
              🌾 {t.weather?.advisory || 'Harvest & Yard Drying Advisory'}:
            </span>
            <p className="text-emerald-800 leading-relaxed font-medium">
              {currentData.advisoryText}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
