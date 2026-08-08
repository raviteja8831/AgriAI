const { Op } = require('sequelize');
const CropCalendar = require('../models/CropCalendar');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');

const TASK_TEMPLATES = {
  rice: [
    { days: 0, task_name: 'Land Preparation', task_type: 'land_preparation' },
    { days: 7, task_name: 'Seed Sowing / Transplanting', task_type: 'sowing' },
    { days: 21, task_name: 'First Weeding', task_type: 'weeding' },
    { days: 30, task_name: 'Basal Fertilizer Application (NPK)', task_type: 'fertilizer' },
    { days: 45, task_name: 'First Irrigation Check', task_type: 'irrigation' },
    { days: 60, task_name: 'Top Dressing - Urea', task_type: 'fertilizer' },
    { days: 75, task_name: 'Pest/Disease Inspection', task_type: 'pesticide' },
    { days: 90, task_name: 'Second Weeding', task_type: 'weeding' },
    { days: 120, task_name: 'Harvest Readiness Check', task_type: 'harvesting' },
  ],
  wheat: [
    { days: 0, task_name: 'Land Preparation & Leveling', task_type: 'land_preparation' },
    { days: 5, task_name: 'Seed Treatment & Sowing', task_type: 'sowing' },
    { days: 20, task_name: 'First Irrigation', task_type: 'irrigation' },
    { days: 30, task_name: 'Weed Control', task_type: 'weeding' },
    { days: 40, task_name: 'Top Dressing - Nitrogen', task_type: 'fertilizer' },
    { days: 60, task_name: 'Second Irrigation', task_type: 'irrigation' },
    { days: 80, task_name: 'Fungicide Application', task_type: 'pesticide' },
    { days: 110, task_name: 'Harvest Preparation', task_type: 'harvesting' },
  ],
  cotton: [
    { days: 0, task_name: 'Deep Ploughing', task_type: 'land_preparation' },
    { days: 10, task_name: 'Sowing', task_type: 'sowing' },
    { days: 25, task_name: 'Gap Filling', task_type: 'sowing' },
    { days: 35, task_name: 'First Weeding + Fertilizer', task_type: 'fertilizer' },
    { days: 50, task_name: 'Irrigation', task_type: 'irrigation' },
    { days: 65, task_name: 'Pest Management (Bollworm)', task_type: 'pesticide' },
    { days: 80, task_name: 'Second Fertilizer Dose', task_type: 'fertilizer' },
    { days: 120, task_name: 'First Picking', task_type: 'harvesting' },
  ],
  default: [
    { days: 0, task_name: 'Land Preparation', task_type: 'land_preparation' },
    { days: 7, task_name: 'Sowing', task_type: 'sowing' },
    { days: 30, task_name: 'Fertilizer Application', task_type: 'fertilizer' },
    { days: 45, task_name: 'Irrigation', task_type: 'irrigation' },
    { days: 60, task_name: 'Pest Inspection', task_type: 'pesticide' },
    { days: 90, task_name: 'Harvest Preparation', task_type: 'harvesting' },
  ],
};

const verifyCropOwner = async (cropId, userId) => {
  return Crop.findOne({
    where: { id: cropId },
    include: [{ model: Farm, as: 'farm', where: { user_id: userId } }],
  });
};

exports.generateForCrop = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
    if (!crop.sowing_date) return res.status(400).json({ success: false, message: 'Sowing date required' });

    const key = crop.crop_name.toLowerCase();
    const template = TASK_TEMPLATES[key] || TASK_TEMPLATES.default;
    const sowing = new Date(crop.sowing_date);

    await CropCalendar.destroy({ where: { crop_id } });

    const tasks = template.map((t) => {
      const date = new Date(sowing);
      date.setDate(date.getDate() + t.days);
      return { crop_id: parseInt(crop_id), task_name: t.task_name, task_type: t.task_type, scheduled_date: date };
    });

    const created = await CropCalendar.bulkCreate(tasks);
    res.status(201).json({ success: true, tasks: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate calendar' });
  }
};

exports.getForCrop = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const tasks = await CropCalendar.findAll({
      where: { crop_id },
      order: [['scheduled_date', 'ASC']],
    });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch calendar' });
  }
};

exports.getUpcoming = async (req, res) => {
  const { days = 7 } = req.query;
  try {
    const until = new Date();
    until.setDate(until.getDate() + parseInt(days));

    const tasks = await CropCalendar.findAll({
      where: { scheduled_date: { [Op.between]: [new Date(), until] }, status: ['pending', 'in_progress'] },
      include: [{
        model: Crop,
        as: 'crop',
        include: [{ model: Farm, as: 'farm', where: { user_id: req.user.id } }],
      }],
      order: [['scheduled_date', 'ASC']],
    });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming tasks' });
  }
};

exports.updateTask = async (req, res) => {
  const { task_id } = req.params;
  try {
    const task = await CropCalendar.findOne({
      where: { id: task_id },
      include: [{
        model: Crop,
        as: 'crop',
        include: [{ model: Farm, as: 'farm', where: { user_id: req.user.id } }],
      }],
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const { status, notes, completed_date } = req.body;
    await task.update({ status, notes, completed_date: status === 'completed' ? (completed_date || new Date()) : task.completed_date });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

exports.addTask = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
    const task = await CropCalendar.create({ crop_id: parseInt(crop_id), ...req.body });
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add task' });
  }
};
