const Update = require('../models/Update');

exports.getAll = async (req, res) => {
  try {
    const updates = await Update.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      limit: 20,
    });
    res.json({ success: true, updates });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch updates' });
  }
};
