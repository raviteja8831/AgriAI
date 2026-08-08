const axios = require('axios');
const WeatherHistory = require('../models/WeatherHistory');
const Farm = require('../models/Farm');

const AI_SUGGESTIONS = {
  Rain: { suggestion: 'Rain expected. Skip irrigation today and delay any spraying activities.', irrigation_advised: false, spray_advised: false },
  Thunderstorm: { suggestion: 'Thunderstorm alert! Avoid field operations. Secure equipment.', irrigation_advised: false, spray_advised: false },
  Drizzle: { suggestion: 'Light rain. No irrigation needed. Postpone pesticide spraying.', irrigation_advised: false, spray_advised: false },
  Clear: { suggestion: 'Clear weather. Good day for spraying and field work. Monitor soil moisture for irrigation needs.', irrigation_advised: true, spray_advised: true },
  Clouds: { suggestion: 'Cloudy day. Moderate conditions for field work.', irrigation_advised: false, spray_advised: true },
  Haze: { suggestion: 'Hazy conditions. Avoid heavy field activity.', irrigation_advised: true, spray_advised: false },
  default: { suggestion: 'Check soil moisture and plan accordingly.', irrigation_advised: false, spray_advised: false },
};

const getAISuggestion = (condition, humidity, rainfall) => {
  if (rainfall > 5) return AI_SUGGESTIONS.Rain;
  return AI_SUGGESTIONS[condition] || AI_SUGGESTIONS.default;
};

exports.getCurrent = async (req, res) => {
  const { farm_id } = req.params;
  try {
    const farm = await Farm.findOne({ where: { id: farm_id, user_id: req.user.id } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    if (!farm.latitude || !farm.longitude) {
      return res.status(400).json({ success: false, message: 'Farm location not set' });
    }

    const url = `${process.env.WEATHER_BASE_URL}/weather`;
    const response = await axios.get(url, {
      params: { lat: farm.latitude, lon: farm.longitude, appid: process.env.WEATHER_API_KEY, units: 'metric' },
    });

    const d = response.data;
    const condition = d.weather[0].main;
    const ai = getAISuggestion(condition, d.main.humidity, d.rain?.['1h'] || 0);

    res.json({
      success: true,
      weather: {
        temperature: d.main.temp,
        feels_like: d.main.feels_like,
        humidity: d.main.humidity,
        pressure: d.main.pressure,
        wind_speed: d.wind.speed * 3.6,
        condition,
        description: d.weather[0].description,
        icon: d.weather[0].icon,
        rainfall: d.rain?.['1h'] || 0,
        uv_index: null,
        city: d.name,
        ...ai,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ success: false, message: 'Weather data unavailable' });
  }
};

exports.getForecast = async (req, res) => {
  const { farm_id } = req.params;
  try {
    const farm = await Farm.findOne({ where: { id: farm_id, user_id: req.user.id } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });

    const url = `${process.env.WEATHER_BASE_URL}/forecast`;
    const response = await axios.get(url, {
      params: { lat: farm.latitude, lon: farm.longitude, appid: process.env.WEATHER_API_KEY, units: 'metric', cnt: 40 },
    });

    const dailyMap = {};
    response.data.list.forEach((item) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap[date]) dailyMap[date] = [];
      dailyMap[date].push(item);
    });

    const forecast = Object.entries(dailyMap).slice(0, 7).map(([date, items]) => {
      const temps = items.map((i) => i.main.temp);
      const condition = items[Math.floor(items.length / 2)].weather[0].main;
      const rainfall = items.reduce((s, i) => s + (i.rain?.['3h'] || 0), 0);
      const ai = getAISuggestion(condition, items[0].main.humidity, rainfall);
      return {
        date,
        temp_max: Math.max(...temps),
        temp_min: Math.min(...temps),
        humidity: Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length),
        condition,
        rainfall,
        ...ai,
      };
    });

    res.json({ success: true, forecast });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Forecast unavailable' });
  }
};

exports.getHistory = async (req, res) => {
  const { farm_id } = req.params;
  const { days = 7 } = req.query;
  try {
    const farm = await Farm.findOne({ where: { id: farm_id, user_id: req.user.id } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });

    const from = new Date();
    from.setDate(from.getDate() - parseInt(days));

    const history = await WeatherHistory.findAll({
      where: { farm_id, recorded_date: { [require('sequelize').Op.gte]: from } },
      order: [['recorded_date', 'DESC']],
    });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};

exports.saveDaily = async (req, res) => {
  const { farm_id } = req.params;
  try {
    const farm = await Farm.findOne({ where: { id: farm_id, user_id: req.user.id } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });

    const record = await WeatherHistory.create({ farm_id, ...req.body });
    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save weather record' });
  }
};
