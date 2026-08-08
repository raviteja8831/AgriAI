const Harvest = require('../models/Harvest');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const Expense = require('../models/Expense');

const verifyCropOwner = (cropId, userId) =>
  Crop.findOne({ where: { id: cropId }, include: [{ model: Farm, as: 'farm', where: { user_id: userId } }] });

exports.get = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const harvest = await Harvest.findOne({ where: { crop_id } });
    res.json({ success: true, harvest });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch harvest' });
  }
};

exports.createOrUpdate = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const expenses = await Expense.findAll({ where: { crop_id } });
    const total_expenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

    const data = { ...req.body, crop_id: parseInt(crop_id), total_expenses };
    if (data.yield_kg && data.market_price_per_kg) {
      data.total_revenue = parseFloat(data.yield_kg) * parseFloat(data.market_price_per_kg);
      data.profit_loss = data.total_revenue - total_expenses;
    }

    const [harvest, created] = await Harvest.findOrCreate({
      where: { crop_id },
      defaults: data,
    });
    if (!created) await harvest.update(data);

    await crop.update({ status: 'harvested', actual_harvest_date: data.harvest_date || new Date() });

    res.status(created ? 201 : 200).json({ success: true, harvest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save harvest' });
  }
};
