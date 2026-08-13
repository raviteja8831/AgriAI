const WeatherHistory = require('../models/WeatherHistory');
const Farm = require('../models/Farm');
const { getCurrentWeather, getDailyForecast } = require('../utils/openMeteo');

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

    const w = await getCurrentWeather(farm.latitude, farm.longitude);
    const ai = getAISuggestion(w.condition, w.humidity, w.rainfall);

    res.json({
      success: true,
      weather: {
        ...w,
        city: farm.village || farm.name,
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

    const days = await getDailyForecast(farm.latitude, farm.longitude, 7);
    const forecast = days.map((day) => ({
      ...day,
      ...getAISuggestion(day.condition, day.humidity, day.rainfall),
    }));

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
