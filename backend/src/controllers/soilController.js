const SoilReport = require('../models/SoilReport');
const Farm = require('../models/Farm');

const verifyFarmOwner = (farmId, userId) =>
  Farm.findOne({ where: { id: farmId, user_id: userId } });

const getCropRecommendations = (ph, nitrogen, phosphorus, potassium) => {
  const crops = [];
  if (ph >= 6.0 && ph <= 7.5 && nitrogen > 200) crops.push('Rice', 'Wheat', 'Maize');
  if (ph >= 6.5 && ph <= 8.0) crops.push('Cotton', 'Sugarcane');
  if (ph >= 5.5 && ph <= 7.0) crops.push('Groundnut', 'Soybean', 'Turmeric');
  if (ph >= 6.0 && ph <= 7.5 && phosphorus > 10) crops.push('Tomato', 'Brinjal', 'Chilli');
  if (crops.length === 0) crops.push('Millets', 'Sorghum');
  return [...new Set(crops)];
};

const getFertilizerAdvice = (nitrogen, phosphorus, potassium, ph) => {
  const recs = [];
  if (nitrogen < 200) recs.push('Apply Urea (46% N) at 50 kg/acre or DAP at 25 kg/acre');
  if (phosphorus < 10) recs.push('Apply Single Super Phosphate (SSP) at 50 kg/acre');
  if (potassium < 100) recs.push('Apply Muriate of Potash (MOP) at 25 kg/acre');
  if (ph < 6.0) recs.push('Apply agricultural lime at 200 kg/acre to raise pH');
  if (ph > 8.0) recs.push('Apply gypsum or sulfur to reduce pH');
  if (recs.length === 0) recs.push('Soil nutrients are adequate. Maintain with organic compost.');
  return recs.join('. ');
};

exports.getAll = async (req, res) => {
  const { farm_id } = req.params;
  try {
    const farm = await verifyFarmOwner(farm_id, req.user.id);
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });

    const reports = await SoilReport.findAll({ where: { farm_id }, order: [['report_date', 'DESC']] });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch soil reports' });
  }
};

exports.create = async (req, res) => {
  const { farm_id } = req.params;
  try {
    const farm = await verifyFarmOwner(farm_id, req.user.id);
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });

    const { ph, nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha } = req.body;
    const suitable_crops = getCropRecommendations(ph, nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha);
    const ai_recommendation = getFertilizerAdvice(nitrogen_kg_ha, phosphorus_kg_ha, potassium_kg_ha, ph);

    const report = await SoilReport.create({
      farm_id: parseInt(farm_id),
      ...req.body,
      suitable_crops: JSON.stringify(suitable_crops),
      ai_recommendation,
    });

    await farm.update({ soil_type: req.body.soil_type || farm.soil_type });

    res.status(201).json({ success: true, report: { ...report.toJSON(), suitable_crops } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save soil report' });
  }
};

exports.getLatest = async (req, res) => {
  const { farm_id } = req.params;
  try {
    const farm = await verifyFarmOwner(farm_id, req.user.id);
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });

    const report = await SoilReport.findOne({ where: { farm_id }, order: [['report_date', 'DESC']] });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch soil report' });
  }
};
