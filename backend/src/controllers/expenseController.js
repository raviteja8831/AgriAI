const { Op } = require('sequelize');
const Expense = require('../models/Expense');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');

const verifyCropOwner = (cropId, userId) =>
  Crop.findOne({ where: { id: cropId }, include: [{ model: Farm, as: 'farm', where: { user_id: userId } }] });

exports.getAll = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const expenses = await Expense.findAll({ where: { crop_id }, order: [['expense_date', 'DESC']] });
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    res.json({ success: true, expenses, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

exports.create = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const expense = await Expense.create({ crop_id: parseInt(crop_id), ...req.body });
    res.status(201).json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
};

exports.update = async (req, res) => {
  const { expense_id } = req.params;
  try {
    const expense = await Expense.findOne({
      where: { id: expense_id },
      include: [{ model: Crop, as: 'crop', include: [{ model: Farm, as: 'farm', where: { user_id: req.user.id } }] }],
    });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await expense.update(req.body);
    res.json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
};

exports.remove = async (req, res) => {
  const { expense_id } = req.params;
  try {
    const expense = await Expense.findOne({
      where: { id: expense_id },
      include: [{ model: Crop, as: 'crop', include: [{ model: Farm, as: 'farm', where: { user_id: req.user.id } }] }],
    });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await expense.destroy();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
};

exports.getSummary = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const expenses = await Expense.findAll({ where: { crop_id } });
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
      return acc;
    }, {});
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

    res.json({ success: true, summary: { total, by_category: byCategory, count: expenses.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
};
