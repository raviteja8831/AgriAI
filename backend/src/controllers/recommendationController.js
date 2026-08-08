// Rule-based crop & soil recommendation engine for Indian agriculture
// Based on agroclimatic zones, lat/lng bounding boxes, and ICAR data

const REGIONS = [
  {
    name: 'Telangana & Andhra Pradesh',
    latMin: 12.5, latMax: 19.5, lngMin: 76.5, lngMax: 84.0,
    soils: ['black', 'red', 'loamy'],
    primarySoil: 'black',
    climate: 'semi-arid to sub-humid',
  },
  {
    name: 'Tamil Nadu',
    latMin: 8.0, latMax: 13.5, lngMin: 76.0, lngMax: 80.5,
    soils: ['red', 'clay', 'sandy'],
    primarySoil: 'red',
    climate: 'tropical',
  },
  {
    name: 'Kerala & Karnataka Coast',
    latMin: 8.0, latMax: 15.5, lngMin: 74.0, lngMax: 76.5,
    soils: ['loamy', 'clay', 'red'],
    primarySoil: 'loamy',
    climate: 'humid tropical',
  },
  {
    name: 'Karnataka Plateau',
    latMin: 11.5, latMax: 18.5, lngMin: 74.5, lngMax: 78.5,
    soils: ['red', 'black', 'loamy'],
    primarySoil: 'red',
    climate: 'semi-arid',
  },
  {
    name: 'Maharashtra',
    latMin: 15.5, latMax: 22.5, lngMin: 72.5, lngMax: 80.5,
    soils: ['black', 'loamy', 'clay'],
    primarySoil: 'black',
    climate: 'semi-arid',
  },
  {
    name: 'Gujarat',
    latMin: 20.0, latMax: 24.5, lngMin: 68.0, lngMax: 74.5,
    soils: ['sandy', 'loamy', 'black'],
    primarySoil: 'loamy',
    climate: 'arid to semi-arid',
  },
  {
    name: 'Rajasthan',
    latMin: 23.0, latMax: 30.5, lngMin: 69.0, lngMax: 78.0,
    soils: ['sandy', 'loamy'],
    primarySoil: 'sandy',
    climate: 'arid',
  },
  {
    name: 'Madhya Pradesh & Chhattisgarh',
    latMin: 17.5, latMax: 26.5, lngMin: 74.0, lngMax: 84.5,
    soils: ['black', 'red', 'loamy'],
    primarySoil: 'black',
    climate: 'sub-humid',
  },
  {
    name: 'Punjab & Haryana',
    latMin: 27.5, latMax: 32.5, lngMin: 73.5, lngMax: 77.5,
    soils: ['loamy', 'silt', 'sandy'],
    primarySoil: 'loamy',
    climate: 'semi-arid',
  },
  {
    name: 'Uttar Pradesh & Bihar',
    latMin: 23.5, latMax: 30.5, lngMin: 77.0, lngMax: 88.5,
    soils: ['silt', 'loamy', 'clay'],
    primarySoil: 'silt',
    climate: 'sub-humid',
  },
  {
    name: 'West Bengal & Odisha',
    latMin: 18.0, latMax: 27.5, lngMin: 83.5, lngMax: 89.5,
    soils: ['clay', 'loamy', 'silt'],
    primarySoil: 'clay',
    climate: 'humid',
  },
  {
    name: 'North East India',
    latMin: 22.0, latMax: 29.5, lngMin: 89.5, lngMax: 97.5,
    soils: ['loamy', 'clay', 'red'],
    primarySoil: 'loamy',
    climate: 'humid',
  },
];

// Crops database: season, soil compatibility, budget (₹/acre), yield (kg/acre), risk
const CROPS = [
  { name: 'Rice', season: ['kharif'], soils: ['clay', 'loamy', 'silt'], minBudget: 12000, maxBudget: 20000, yieldMin: 1500, yieldMax: 2500, pricePerKg: 20, risk: 'low', duration_days: 110, regions: ['Telangana & Andhra Pradesh', 'Tamil Nadu', 'West Bengal & Odisha', 'Uttar Pradesh & Bihar', 'North East India', 'Kerala & Karnataka Coast'] },
  { name: 'Wheat', season: ['rabi'], soils: ['loamy', 'silt', 'clay'], minBudget: 10000, maxBudget: 18000, yieldMin: 1800, yieldMax: 3000, pricePerKg: 22, risk: 'low', duration_days: 120, regions: ['Punjab & Haryana', 'Uttar Pradesh & Bihar', 'Madhya Pradesh & Chhattisgarh'] },
  { name: 'Cotton', season: ['kharif'], soils: ['black', 'loamy'], minBudget: 20000, maxBudget: 35000, yieldMin: 600, yieldMax: 1200, pricePerKg: 65, risk: 'medium', duration_days: 150, regions: ['Telangana & Andhra Pradesh', 'Maharashtra', 'Gujarat', 'Karnataka Plateau'] },
  { name: 'Sugarcane', season: ['annual'], soils: ['loamy', 'clay', 'black'], minBudget: 25000, maxBudget: 45000, yieldMin: 30000, yieldMax: 50000, pricePerKg: 3.5, risk: 'low', duration_days: 360, regions: ['Telangana & Andhra Pradesh', 'Tamil Nadu', 'Maharashtra', 'Uttar Pradesh & Bihar'] },
  { name: 'Maize', season: ['kharif', 'rabi'], soils: ['loamy', 'sandy', 'red'], minBudget: 8000, maxBudget: 15000, yieldMin: 2000, yieldMax: 4000, pricePerKg: 18, risk: 'low', duration_days: 90, regions: ['Telangana & Andhra Pradesh', 'Karnataka Plateau', 'Madhya Pradesh & Chhattisgarh'] },
  { name: 'Groundnut', season: ['kharif', 'rabi'], soils: ['sandy', 'loamy', 'red'], minBudget: 14000, maxBudget: 22000, yieldMin: 800, yieldMax: 1500, pricePerKg: 55, risk: 'medium', duration_days: 100, regions: ['Telangana & Andhra Pradesh', 'Tamil Nadu', 'Gujarat', 'Karnataka Plateau'] },
  { name: 'Soybean', season: ['kharif'], soils: ['black', 'loamy', 'clay'], minBudget: 10000, maxBudget: 18000, yieldMin: 800, yieldMax: 1500, pricePerKg: 40, risk: 'low', duration_days: 95, regions: ['Madhya Pradesh & Chhattisgarh', 'Maharashtra', 'Telangana & Andhra Pradesh'] },
  { name: 'Turmeric', season: ['kharif'], soils: ['loamy', 'clay', 'red'], minBudget: 30000, maxBudget: 50000, yieldMin: 5000, yieldMax: 8000, pricePerKg: 80, risk: 'medium', duration_days: 270, regions: ['Telangana & Andhra Pradesh', 'Tamil Nadu', 'Kerala & Karnataka Coast'] },
  { name: 'Chilli', season: ['rabi', 'kharif'], soils: ['loamy', 'sandy', 'red'], minBudget: 25000, maxBudget: 40000, yieldMin: 2000, yieldMax: 4000, pricePerKg: 90, risk: 'high', duration_days: 150, regions: ['Telangana & Andhra Pradesh', 'Karnataka Plateau', 'Tamil Nadu'] },
  { name: 'Banana', season: ['annual'], soils: ['loamy', 'clay'], minBudget: 40000, maxBudget: 70000, yieldMin: 20000, yieldMax: 35000, pricePerKg: 15, risk: 'medium', duration_days: 300, regions: ['Tamil Nadu', 'Kerala & Karnataka Coast', 'Telangana & Andhra Pradesh'] },
  { name: 'Tomato', season: ['rabi', 'kharif'], soils: ['loamy', 'sandy', 'red'], minBudget: 20000, maxBudget: 35000, yieldMin: 10000, yieldMax: 25000, pricePerKg: 12, risk: 'high', duration_days: 90, regions: ['Telangana & Andhra Pradesh', 'Karnataka Plateau', 'Tamil Nadu', 'Maharashtra'] },
  { name: 'Bajra (Pearl Millet)', season: ['kharif'], soils: ['sandy', 'loamy'], minBudget: 5000, maxBudget: 10000, yieldMin: 800, yieldMax: 1500, pricePerKg: 20, risk: 'low', duration_days: 75, regions: ['Rajasthan', 'Gujarat', 'Maharashtra'] },
  { name: 'Jowar (Sorghum)', season: ['kharif', 'rabi'], soils: ['black', 'loamy', 'red'], minBudget: 5000, maxBudget: 10000, yieldMin: 1000, yieldMax: 2000, pricePerKg: 22, risk: 'low', duration_days: 100, regions: ['Telangana & Andhra Pradesh', 'Maharashtra', 'Karnataka Plateau'] },
  { name: 'Mustard', season: ['rabi'], soils: ['loamy', 'sandy', 'silt'], minBudget: 8000, maxBudget: 14000, yieldMin: 600, yieldMax: 1200, pricePerKg: 55, risk: 'low', duration_days: 110, regions: ['Rajasthan', 'Punjab & Haryana', 'Uttar Pradesh & Bihar'] },
  { name: 'Onion', season: ['rabi'], soils: ['loamy', 'sandy', 'black'], minBudget: 30000, maxBudget: 50000, yieldMin: 8000, yieldMax: 15000, pricePerKg: 15, risk: 'high', duration_days: 120, regions: ['Maharashtra', 'Karnataka Plateau', 'Gujarat'] },
];

const getRegion = (lat, lng) => {
  const match = REGIONS.find((r) => lat >= r.latMin && lat <= r.latMax && lng >= r.lngMin && lng <= r.lngMax);
  return match || { name: 'Central India', soils: ['loamy', 'black'], primarySoil: 'loamy', climate: 'sub-humid' };
};

const estimateProfit = (crop, area, budget) => {
  const midYield = (crop.yieldMin + crop.yieldMax) / 2;
  const totalYield = midYield * area;
  const totalRevenue = totalYield * crop.pricePerKg;
  const totalCost = ((crop.minBudget + crop.maxBudget) / 2) * area;
  const profit = totalRevenue - totalCost;
  return { totalYield: Math.round(totalYield), totalRevenue: Math.round(totalRevenue), totalCost: Math.round(totalCost), profit: Math.round(profit) };
};

exports.getRecommendations = async (req, res) => {
  const { lat, lng, season, budget_per_acre = 20000, area_acres = 1 } = req.query;

  if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const budgetNum = parseFloat(budget_per_acre);
  const areaNum = parseFloat(area_acres);

  const region = getRegion(latitude, longitude);

  let candidates = CROPS.filter((crop) => {
    const seasonMatch = !season || crop.season.includes(season) || crop.season.includes('annual');
    const budgetMatch = crop.minBudget <= budgetNum * 1.3; // allow 30% over budget
    const soilMatch = crop.soils.some((s) => region.soils.includes(s));
    const regionMatch = crop.regions.some((r) => r === region.name) || crop.regions.length === 0;
    return seasonMatch && budgetMatch && soilMatch;
  });

  // Sort: region-preferred crops first, then by profit potential
  candidates.sort((a, b) => {
    const aRegion = a.regions.includes(region.name) ? 1 : 0;
    const bRegion = b.regions.includes(region.name) ? 1 : 0;
    if (aRegion !== bRegion) return bRegion - aRegion;
    const aProfit = estimateProfit(a, areaNum, budgetNum).profit;
    const bProfit = estimateProfit(b, areaNum, budgetNum).profit;
    return bProfit - aProfit;
  });

  const recommendations = candidates.slice(0, 8).map((crop) => ({
    crop_name: crop.name,
    season: crop.season,
    suitable_soils: crop.soils,
    risk_level: crop.risk,
    duration_days: crop.duration_days,
    budget_range: { min: crop.minBudget, max: crop.maxBudget, unit: '₹/acre' },
    yield_range: { min: crop.yieldMin, max: crop.yieldMax, unit: 'kg/acre' },
    market_price: `₹${crop.pricePerKg}/kg`,
    financials: estimateProfit(crop, areaNum, budgetNum),
    fits_budget: crop.minBudget <= budgetNum,
    preferred_for_region: crop.regions.includes(region.name),
  }));

  res.json({
    success: true,
    region: { name: region.name, climate: region.climate, primary_soil: region.primarySoil, available_soils: region.soils },
    recommendations,
    filters_applied: { season: season || 'all', budget_per_acre: budgetNum, area_acres: areaNum },
  });
};

exports.getSeasonsCalendar = async (req, res) => {
  const { lat, lng } = req.query;
  const region = getRegion(parseFloat(lat || 17), parseFloat(lng || 79));

  const calendar = {
    kharif: { name: 'Kharif (Monsoon)', months: 'June – October', sowingPeriod: 'June – July', harvestPeriod: 'September – November', crops: CROPS.filter((c) => c.season.includes('kharif') && c.soils.some((s) => region.soils.includes(s))).map((c) => c.name) },
    rabi: { name: 'Rabi (Winter)', months: 'November – April', sowingPeriod: 'October – November', harvestPeriod: 'February – April', crops: CROPS.filter((c) => c.season.includes('rabi') && c.soils.some((s) => region.soils.includes(s))).map((c) => c.name) },
    zaid: { name: 'Zaid (Summer)', months: 'March – June', sowingPeriod: 'March – April', harvestPeriod: 'May – June', crops: ['Watermelon', 'Cucumber', 'Bitter Gourd', 'Pumpkin', 'Moong Dal'] },
    annual: { name: 'Annual Crops', crops: CROPS.filter((c) => c.season.includes('annual') && c.soils.some((s) => region.soils.includes(s))).map((c) => c.name) },
  };

  res.json({ success: true, region: region.name, calendar });
};
