const { Op } = require('sequelize');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const CropCalendar = require('../models/CropCalendar');
const Expense = require('../models/Expense');
const Harvest = require('../models/Harvest');
const WeatherHistory = require('../models/WeatherHistory');
const { getCurrentWeather } = require('../utils/openMeteo');

// Growth stages by % completion
const getGrowthStage = (cropName, pct) => {
  const stages = {
    rice:    [{ p: 10, label: 'Germination', emoji: '🌱' }, { p: 35, label: 'Tillering', emoji: '🌿' }, { p: 60, label: 'Booting', emoji: '🎋' }, { p: 80, label: 'Heading', emoji: '🌾' }, { p: 100, label: 'Harvest Ready', emoji: '🎉' }],
    wheat:   [{ p: 10, label: 'Germination', emoji: '🌱' }, { p: 40, label: 'Tillering', emoji: '🌿' }, { p: 65, label: 'Jointing', emoji: '🎋' }, { p: 85, label: 'Heading', emoji: '🌾' }, { p: 100, label: 'Harvest Ready', emoji: '🎉' }],
    cotton:  [{ p: 10, label: 'Germination', emoji: '🌱' }, { p: 30, label: 'Seedling', emoji: '🌿' }, { p: 55, label: 'Squaring', emoji: '🌸' }, { p: 75, label: 'Boll Formation', emoji: '🫧' }, { p: 100, label: 'Harvest Ready', emoji: '🎉' }],
    default: [{ p: 10, label: 'Germination', emoji: '🌱' }, { p: 35, label: 'Seedling', emoji: '🌿' }, { p: 65, label: 'Vegetative', emoji: '🎋' }, { p: 85, label: 'Flowering', emoji: '🌸' }, { p: 100, label: 'Harvest Ready', emoji: '🎉' }],
  };
  const key = cropName?.toLowerCase().split(' ')[0];
  const list = stages[key] || stages.default;
  return list.find((s) => pct <= s.p) || list[list.length - 1];
};

// Pest risk based on humidity + temperature
const getPestRisk = (humidity, temp) => {
  if (!humidity || !temp) return null;
  if (humidity > 85 && temp > 24) return { level: 'high', pest: 'Fungal Disease (Blast/Blight)', action: 'Spray Mancozeb 2g per litre water today', color: 'red', emoji: '🔴' };
  if (humidity > 75 && temp > 28) return { level: 'medium', pest: 'Aphids / Whitefly', action: 'Check leaves. Spray Imidacloprid if spotted', color: 'orange', emoji: '🟡' };
  if (humidity < 40 && temp > 35) return { level: 'medium', pest: 'Spider Mites', action: 'Water crops more. Check underside of leaves', color: 'orange', emoji: '🟡' };
  return { level: 'low', pest: 'No major risk today', action: 'Continue normal care', color: 'green', emoji: '🟢' };
};

// Simple weather advisory in farmer language
const getWeatherAdvice = (weather) => {
  if (!weather) return [];
  const tips = [];
  if (weather.rainfall > 5 || weather.condition === 'Rain' || weather.condition === 'Thunderstorm') {
    tips.push({ icon: '🌧️', text: 'Rain today — no need to water your crops', type: 'info' });
    tips.push({ icon: '🚫', text: 'Do not spray pesticides today — rain will wash them off', type: 'warning' });
  } else if (weather.irrigation_advised) {
    tips.push({ icon: '💧', text: 'Water your crops today — soil may be dry', type: 'action' });
  }
  if (weather.spray_advised && weather.rainfall < 2) {
    tips.push({ icon: '✅', text: 'Good weather for spraying today', type: 'success' });
  }
  if (weather.wind_speed > 30) {
    tips.push({ icon: '💨', text: 'Strong winds — avoid spraying today', type: 'warning' });
  }
  if (weather.temperature > 40) {
    tips.push({ icon: '🌡️', text: 'Very hot today — water crops in the evening', type: 'warning' });
  }
  if (weather.uv_index > 8) {
    tips.push({ icon: '☀️', text: 'Very strong sun — crops may wilt. Keep soil moist', type: 'warning' });
  }
  return tips;
};

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in14Days = new Date(today);
    in14Days.setDate(in14Days.getDate() + 14);
    const thisSeasonStart = new Date(today);
    thisSeasonStart.setMonth(thisSeasonStart.getMonth() - 6);

    // Farms
    const farms = await Farm.findAll({ where: { user_id: userId, is_active: true } });
    const farmIds = farms.map((f) => f.id);
    const totalArea = farms.reduce((s, f) => s + parseFloat(f.area_acres || 0), 0);

    // Active crops with expenses and harvest
    const crops = await Crop.findAll({
      where: { farm_id: farmIds, status: { [Op.notIn]: ['failed'] } },
      include: [
        { model: Farm, as: 'farm', attributes: ['id', 'name', 'latitude', 'longitude'] },
        { model: Expense, as: 'expenses', required: false },
        { model: Harvest, as: 'harvest', required: false },
      ],
    });

    const activeCrops = crops.filter((c) => !['harvested'].includes(c.status));

    // Crop progress cards
    const cropProgress = activeCrops.map((crop) => {
      const sown = crop.sowing_date ? new Date(crop.sowing_date) : null;
      const harvest = crop.expected_harvest_date ? new Date(crop.expected_harvest_date) : null;
      const totalDays = sown && harvest ? Math.round((harvest - sown) / 864e5) : null;
      const daysIn = sown ? Math.max(0, Math.round((new Date() - sown) / 864e5)) : null;
      const daysLeft = harvest ? Math.max(0, Math.round((harvest - new Date()) / 864e5)) : null;
      const pct = totalDays && daysIn ? Math.min(100, Math.round((daysIn / totalDays) * 100)) : null;
      const stage = pct !== null ? getGrowthStage(crop.crop_name, pct) : null;
      const totalExpenses = crop.expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
      const nearHarvest = daysLeft !== null && daysLeft <= 14;
      return {
        id: crop.id,
        name: crop.crop_name,
        variety: crop.crop_variety,
        farm: crop.farm?.name,
        area: crop.area_acres,
        status: crop.status,
        sowing_date: crop.sowing_date,
        expected_harvest_date: crop.expected_harvest_date,
        days_in: daysIn,
        days_left: daysLeft,
        total_days: totalDays,
        progress_pct: pct,
        stage,
        total_expenses: totalExpenses,
        near_harvest: nearHarvest,
        alert: nearHarvest ? `Harvest in ${daysLeft} days — get your bags ready!` : null,
      };
    });

    // Tasks due today
    const todayTasks = await CropCalendar.findAll({
      where: {
        scheduled_date: { [Op.between]: [today, tomorrow] },
        status: { [Op.in]: ['pending', 'in_progress'] },
      },
      include: [{ model: Crop, as: 'crop', where: { farm_id: farmIds }, include: [{ model: Farm, as: 'farm', attributes: ['name'] }] }],
    });

    // Overdue tasks
    const overdueTasks = await CropCalendar.findAll({
      where: {
        scheduled_date: { [Op.lt]: today },
        status: { [Op.in]: ['pending'] },
      },
      include: [{ model: Crop, as: 'crop', where: { farm_id: farmIds } }],
      limit: 3,
    });

    // Season P&L
    const seasonExpenses = crops.reduce((s, c) => s + c.expenses.reduce((es, e) => es + parseFloat(e.amount), 0), 0);
    const seasonRevenue = crops.filter((c) => c.harvest).reduce((s, c) => s + parseFloat(c.harvest.total_revenue || 0), 0);

    // Weather for first farm that has coords — falls back to the device's current
    // location (passed as ?lat=&lng= by the app when it has location permission)
    // so weather works before the user has registered any farm.
    let weather = null;
    const farmWithCoords = farms.find((f) => f.latitude && f.longitude);
    const deviceLat = parseFloat(req.query.lat);
    const deviceLng = parseFloat(req.query.lng);
    const source = farmWithCoords
      ? { lat: farmWithCoords.latitude, lng: farmWithCoords.longitude, name: farmWithCoords.name }
      : (Number.isFinite(deviceLat) && Number.isFinite(deviceLng))
        ? { lat: deviceLat, lng: deviceLng, name: 'Your location' }
        : null;
    if (source) {
      try {
        const w = await getCurrentWeather(source.lat, source.lng);
        weather = {
          temperature: Math.round(w.temperature),
          humidity: w.humidity,
          condition: w.condition,
          description: w.description,
          wind_speed: Math.round(w.wind_speed),
          rainfall: w.rainfall,
          irrigation_advised: !['Rain', 'Thunderstorm', 'Drizzle'].includes(w.condition) && w.humidity < 70,
          spray_advised: !['Rain', 'Thunderstorm', 'Drizzle'].includes(w.condition) && w.wind_speed < 28.8,
          farm_name: source.name,
        };
      } catch { /* weather service unreachable */ }
    }

    // Pest risk from weather
    const pestRisk = weather ? getPestRisk(weather.humidity, weather.temperature) : null;

    // Weather action tips
    const weatherTips = getWeatherAdvice(weather);

    // Today's brief — merged actions
    const brief = [];
    weatherTips.forEach((t) => brief.push(t));
    if (todayTasks.length > 0) {
      brief.push({ icon: '📅', text: `${todayTasks.length} farm task${todayTasks.length > 1 ? 's' : ''} due today`, type: 'action', tasks: todayTasks.map((t) => ({ id: t.id, name: t.task_name, crop: t.crop?.crop_name, farm: t.crop?.farm?.name })) });
    }
    if (overdueTasks.length > 0) {
      brief.push({ icon: '⚠️', text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} — please complete soon`, type: 'warning' });
    }
    cropProgress.filter((c) => c.near_harvest).forEach((c) => {
      brief.push({ icon: '🌾', text: c.alert, type: 'harvest', crop_id: c.id });
    });
    if (pestRisk?.level !== 'low' && pestRisk) {
      brief.push({ icon: pestRisk.emoji, text: `${pestRisk.pest} risk — ${pestRisk.action}`, type: 'pest' });
    }

    res.json({
      success: true,
      summary: {
        farms: farms.length,
        total_area: totalArea.toFixed(1),
        active_crops: activeCrops.length,
        today_tasks: todayTasks.length,
        overdue_tasks: overdueTasks.length,
        season_expenses: Math.round(seasonExpenses),
        season_revenue: Math.round(seasonRevenue),
        season_profit: Math.round(seasonRevenue - seasonExpenses),
      },
      weather,
      today_brief: brief,
      crop_progress: cropProgress,
      pest_risk: pestRisk,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};
