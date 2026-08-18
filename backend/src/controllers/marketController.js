const { Op } = require('sequelize');

// Base mandi prices (₹/quintal, flowers ₹/kg) with MSP — updated periodically
const BASE_PRICES = {
  'Rice':       { base: 2180, msp: 2183, unit: 'quintal', category: 'grain' },
  'Wheat':      { base: 2275, msp: 2275, unit: 'quintal', category: 'grain' },
  'Cotton':     { base: 7150, msp: 6620, unit: 'quintal', category: 'cash_crop' },
  'Maize':      { base: 1890, msp: 2090, unit: 'quintal', category: 'grain' },
  'Soybean':    { base: 4600, msp: 4892, unit: 'quintal', category: 'cash_crop' },
  'Groundnut':  { base: 5550, msp: 6377, unit: 'quintal', category: 'cash_crop' },
  'Sugarcane':  { base: 340,  msp: 340,  unit: 'quintal', category: 'cash_crop' },
  'Turmeric':   { base: 8000, msp: 0,    unit: 'quintal', category: 'cash_crop' },
  'Chilli':     { base: 9000, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Tomato':     { base: 1200, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Onion':      { base: 1500, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Potato':     { base: 1100, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Brinjal':    { base: 1400, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Cabbage':    { base: 900,  msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Cauliflower':{ base: 1300, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Carrot':     { base: 1600, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Okra':       { base: 2200, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Green Peas': { base: 2800, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Cucumber':   { base: 1000, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Beans':      { base: 2400, msp: 0,    unit: 'quintal', category: 'vegetable' },
  'Banana':     { base: 1800, msp: 0,    unit: 'quintal', category: 'fruit' },
  'Marigold':   { base: 60,   msp: 0,    unit: 'kg',      category: 'flower' },
  'Rose':       { base: 120,  msp: 0,    unit: 'kg',      category: 'flower' },
  'Jasmine':    { base: 450,  msp: 0,    unit: 'kg',      category: 'flower' },
  'Chrysanthemum': { base: 90, msp: 0,   unit: 'kg',      category: 'flower' },
  'Gladiolus':  { base: 150,  msp: 0,    unit: 'kg',      category: 'flower' },
  'Jowar (Sorghum)': { base: 2900, msp: 3180, unit: 'quintal', category: 'grain' },
  'Bajra (Pearl Millet)': { base: 2500, msp: 2625, unit: 'quintal', category: 'grain' },
  'Mustard':    { base: 5500, msp: 5650, unit: 'quintal', category: 'cash_crop' },
};

// Pseudo-random daily variation seeded by date — consistent within same day.
// Scaled to ±10% of the crop's base price so low-value items (flowers, ₹/kg)
// don't swing by the same flat amount as high-value ones (grains, ₹/quintal).
function getDailyVariation(cropName, date, base) {
  const dateNum = parseInt(date.toISOString().split('T')[0].replace(/-/g, ''));
  const cropSeed = cropName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = (dateNum * 7 + cropSeed * 13) % 1000;
  const pct = ((seed % 201) - 100) / 1000; // −0.1 to +0.1
  return Math.round(base * pct);
}

function getPriceData(cropName, date) {
  const key = Object.keys(BASE_PRICES).find((k) => k.toLowerCase() === cropName.toLowerCase());
  if (!key) return null;
  const { base, msp, unit, category } = BASE_PRICES[key];
  const todayVariation = getDailyVariation(cropName, date, base);
  const yesterVariation = getDailyVariation(cropName, new Date(date - 864e5), base);
  const todayPrice = Math.round(base + todayVariation);
  const yesterdayPrice = Math.round(base + yesterVariation);
  const change = todayPrice - yesterdayPrice;
  const changePct = (change / yesterdayPrice) * 100;
  const aboveMSP = msp > 0 && todayPrice >= msp;
  return {
    crop_name: key,
    category,
    price: todayPrice,
    yesterday_price: yesterdayPrice,
    change,
    change_pct: changePct.toFixed(1),
    msp: msp || null,
    above_msp: msp > 0 ? aboveMSP : null,
    unit,
    trend: changePct > 3 ? 'rising' : changePct < -3 ? 'falling' : 'stable',
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

exports.getVegFlowerPrices = async (req, res) => {
  const today = new Date();
  const cropList = Object.keys(BASE_PRICES).filter((k) =>
    ['vegetable', 'flower'].includes(BASE_PRICES[k].category)
  );
  const all = cropList.map((c) => getPriceData(c, today)).filter(Boolean);
  res.json({
    success: true,
    date: today.toISOString().split('T')[0],
    vegetables: all.filter((p) => p.category === 'vegetable'),
    flowers: all.filter((p) => p.category === 'flower'),
  });
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
