const axios = require('axios');

// Open-Meteo is free, open-source and needs no API key — see https://open-meteo.com
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO weather codes (https://open-meteo.com/en/docs) mapped to the
// condition/description shape the rest of the app already expects
// (WeatherCard's WEATHER_EMOJI keys, weatherController's AI_SUGGESTIONS keys).
const WMO_CODES = {
  0: { condition: 'Clear', description: 'clear sky' },
  1: { condition: 'Clouds', description: 'mainly clear' },
  2: { condition: 'Clouds', description: 'partly cloudy' },
  3: { condition: 'Clouds', description: 'overcast' },
  45: { condition: 'Mist', description: 'fog' },
  48: { condition: 'Mist', description: 'depositing rime fog' },
  51: { condition: 'Drizzle', description: 'light drizzle' },
  53: { condition: 'Drizzle', description: 'moderate drizzle' },
  55: { condition: 'Drizzle', description: 'dense drizzle' },
  56: { condition: 'Drizzle', description: 'light freezing drizzle' },
  57: { condition: 'Drizzle', description: 'dense freezing drizzle' },
  61: { condition: 'Rain', description: 'slight rain' },
  63: { condition: 'Rain', description: 'moderate rain' },
  65: { condition: 'Rain', description: 'heavy rain' },
  66: { condition: 'Rain', description: 'light freezing rain' },
  67: { condition: 'Rain', description: 'heavy freezing rain' },
  71: { condition: 'Snow', description: 'slight snow fall' },
  73: { condition: 'Snow', description: 'moderate snow fall' },
  75: { condition: 'Snow', description: 'heavy snow fall' },
  77: { condition: 'Snow', description: 'snow grains' },
  80: { condition: 'Rain', description: 'slight rain showers' },
  81: { condition: 'Rain', description: 'moderate rain showers' },
  82: { condition: 'Rain', description: 'violent rain showers' },
  85: { condition: 'Snow', description: 'slight snow showers' },
  86: { condition: 'Snow', description: 'heavy snow showers' },
  95: { condition: 'Thunderstorm', description: 'thunderstorm' },
  96: { condition: 'Thunderstorm', description: 'thunderstorm with slight hail' },
  99: { condition: 'Thunderstorm', description: 'thunderstorm with heavy hail' },
};

const describeCode = (code) => WMO_CODES[code] || { condition: 'Clouds', description: 'overcast' };

exports.getCurrentWeather = async (lat, lon) => {
  const { data } = await axios.get(BASE_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,uv_index,surface_pressure',
      timezone: 'auto',
    },
    timeout: 5000,
  });
  const c = data.current;
  const { condition, description } = describeCode(c.weather_code);
  return {
    temperature: c.temperature_2m,
    feels_like: c.apparent_temperature,
    pressure: c.surface_pressure,
    humidity: c.relative_humidity_2m,
    condition,
    description,
    wind_speed: c.wind_speed_10m, // already km/h, unlike OpenWeatherMap's m/s
    rainfall: c.rain ?? c.precipitation ?? 0,
    uv_index: c.uv_index ?? null,
  };
};

exports.getDailyForecast = async (lat, lon, days = 7) => {
  const { data } = await axios.get(BASE_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum,weather_code',
      timezone: 'auto',
      forecast_days: days,
    },
    timeout: 5000,
  });
  const d = data.daily;
  return d.time.map((date, i) => ({
    date,
    temp_max: d.temperature_2m_max[i],
    temp_min: d.temperature_2m_min[i],
    humidity: d.relative_humidity_2m_mean?.[i] != null ? Math.round(d.relative_humidity_2m_mean[i]) : null,
    condition: describeCode(d.weather_code[i]).condition,
    rainfall: d.precipitation_sum[i] || 0,
  }));
};
