const { validationResult } = require('express-validator');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');

exports.getAll = async (req, res) => {
  try {
    const farms = await Farm.findAll({
      where: { user_id: req.user.id, is_active: true },
      include: [{ model: Crop, as: 'crops', where: { status: ['planned', 'sowing', 'growing', 'flowering', 'harvesting'] }, required: false }],
    });
    res.json({ success: true, farms });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch farms' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const farm = await Farm.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{ model: Crop, as: 'crops', required: false }],
    });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true, farm });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch farm' });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const farm = await Farm.create({ ...req.body, user_id: req.user.id });
    res.status(201).json({ success: true, farm });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create farm' });
  }
};

exports.update = async (req, res) => {
  try {
    const farm = await Farm.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    await farm.update(req.body);
    res.json({ success: true, farm });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update farm' });
  }
};

exports.remove = async (req, res) => {
  try {
    const farm = await Farm.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    await farm.update({ is_active: false });
    res.json({ success: true, message: 'Farm removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove farm' });
  }
};
