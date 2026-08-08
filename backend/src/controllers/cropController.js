const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const Expense = require('../models/Expense');
const Harvest = require('../models/Harvest');

const ownsFarm = async (farmId, userId) => {
  const farm = await Farm.findOne({ where: { id: farmId, user_id: userId, is_active: true } });
  return !!farm;
};

exports.getAll = async (req, res) => {
  const { farm_id, status } = req.query;
  try {
    const where = {};
    if (farm_id) where.farm_id = farm_id;
    if (status) where.status = status;

    const crops = await Crop.findAll({
      where,
      include: [
        { model: Farm, as: 'farm', where: { user_id: req.user.id }, attributes: ['id', 'name', 'village', 'district'] },
        { model: Expense, as: 'expenses', required: false },
        { model: Harvest, as: 'harvest', required: false },
      ],
    });
    res.json({ success: true, crops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch crops' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const crop = await Crop.findOne({
      where: { id: req.params.id },
      include: [
        { model: Farm, as: 'farm', where: { user_id: req.user.id } },
        { model: Expense, as: 'expenses', required: false },
        { model: Harvest, as: 'harvest', required: false },
      ],
    });
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
    res.json({ success: true, crop });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch crop' });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { farm_id } = req.body;
  try {
    if (!await ownsFarm(farm_id, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Farm not found or access denied' });
    }
    const crop = await Crop.create(req.body);
    res.status(201).json({ success: true, crop });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create crop' });
  }
};

exports.update = async (req, res) => {
  try {
    const crop = await Crop.findOne({
      where: { id: req.params.id },
      include: [{ model: Farm, as: 'farm', where: { user_id: req.user.id } }],
    });
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
    await crop.update(req.body);
    res.json({ success: true, crop });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update crop' });
  }
};

exports.remove = async (req, res) => {
  try {
    const crop = await Crop.findOne({
      where: { id: req.params.id },
      include: [{ model: Farm, as: 'farm', where: { user_id: req.user.id } }],
    });
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
    await crop.destroy();
    res.json({ success: true, message: 'Crop deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete crop' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const crop = await Crop.findOne({
      where: { id: req.params.id },
      include: [
        { model: Farm, as: 'farm', where: { user_id: req.user.id } },
        { model: Expense, as: 'expenses', required: false },
        { model: Harvest, as: 'harvest', required: false },
      ],
    });
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const totalExpenses = crop.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const expensesByCategory = crop.expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
      return acc;
    }, {});

    res.json({
      success: true,
      summary: {
        crop: { id: crop.id, name: crop.crop_name, status: crop.status, sowing_date: crop.sowing_date, expected_harvest_date: crop.expected_harvest_date },
        financials: { total_expenses: totalExpenses, expenses_by_category: expensesByCategory, harvest: crop.harvest || null },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
};
