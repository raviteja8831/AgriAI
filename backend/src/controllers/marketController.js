const { Op } = require('sequelize');

// Base mandi prices (₹/quintal) with MSP — updated periodically
const BASE_PRICES = {
  'Rice':       { base: 2180, msp: 2183, unit: 'quintal' },
  'Wheat':      { base: 2275, msp: 2275, unit: 'quintal' },
  'Cotton':     { base: 7150, msp: 6620, unit: 'quintal' },
  'Maize':      { base: 1890, msp: 2090, unit: 'quintal' },
  'Soybean':    { base: 4600, msp: 4892, unit: 'quintal' },
  'Groundnut':  { base: 5550, msp: 6377, unit: 'quintal' },
  'Sugarcane':  { base: 340,  msp: 340,  unit: 'quintal' },
  'Turmeric':   { base: 8000, msp: 0,    unit: 'quintal' },
  'Chilli':     { base: 9000, msp: 0,    unit: 'quintal' },
  'Tomato':     { base: 1200, msp: 0,    unit: 'quintal' },
  'Onion':      { base: 1500, msp: 0,    unit: 'quintal' },
  'Banana':     { base: 1800, msp: 0,    unit: 'quintal' },
  'Jowar (Sorghum)': { base: 2900, msp: 3180, unit: 'quintal' },
  'Bajra (Pearl Millet)': { base: 2500, msp: 2625, unit: 'quintal' },
  'Mustard':    { base: 5500, msp: 5650, unit: 'quintal' },
};

// Pseudo-random daily variation seeded by date — consistent within same day
function getDailyVariation(cropName, date) {
  const dateNum = parseInt(date.toISOString().split('T')[0].replace(/-/g, ''));
  const cropSeed = cropName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = (dateNum * 7 + cropSeed * 13) % 1000;
  return (seed % 201) - 100; // −100 to +100 per quintal
}

function getPriceData(cropName, date) {
  const key = Object.keys(BASE_PRICES).find((k) => k.toLowerCase() === cropName.toLowerCase());
  if (!key) return null;
  const { base, msp, unit } = BASE_PRICES[key];
  const todayVariation = getDailyVariation(cropName, date);
  const yesterVariation = getDailyVariation(cropName, new Date(date - 864e5));
  const todayPrice = Math.round(base + todayVariation);
  const yesterdayPrice = Math.round(base + yesterVariation);
  const change = todayPrice - yesterdayPrice;
  const aboveMSP = msp > 0 && todayPrice >= msp;
  return {
    crop_name: key,
    price: todayPrice,
    yesterday_price: yesterdayPrice,
    change,
    change_pct: ((change / yesterdayPrice) * 100).toFixed(1),
    msp: msp || null,
    above_msp: msp > 0 ? aboveMSP : null,
    unit,
    trend: change > 50 ? 'rising' : change < -50 ? 'falling' : 'stable',
    sell_advice: msp > 0
      ? (aboveMSP ? 'Good time to sell — price above MSP' : 'Hold if possible — price below MSP')
      : (change > 0 ? 'Price rising — consider selling soon' : 'Price dipping — wait a few days'),
  };
}

exports.getPrices = async (req, res) => {
  const { crops } = req.query; // comma-separated: "Rice,Cotton,Maize"
  const today = new Date();

  let cropList = crops
    ? crops.split(',').map((c) => c.trim())
    : Object.keys(BASE_PRICES);

  const prices = cropList
    .map((c) => getPriceData(c, today))
    .filter(Boolean);

  res.json({ success: true, date: today.toISOString().split('T')[0], prices });
};

exports.getForFarmer = async (req, res) => {
  const Farm = require('../models/Farm');
  const Crop = require('../models/Crop');
  const today = new Date();

  try {
    const farms = await Farm.findAll({ where: { user_id: req.user.id, is_active: true } });
    const farmIds = farms.map((f) => f.id);
    const crops = await Crop.findAll({ where: { farm_id: farmIds, status: { [Op.notIn]: ['failed'] } } });
    const cropNames = [...new Set(crops.map((c) => c.crop_name))];

    // Always show at least top regional crops if farmer has none
    if (cropNames.length === 0) cropNames.push('Rice', 'Cotton', 'Maize');

    const prices = cropNames.map((c) => getPriceData(c, today)).filter(Boolean);
    res.json({ success: true, date: today.toISOString().split('T')[0], prices, your_crops: cropNames });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch prices' });
  }
};
