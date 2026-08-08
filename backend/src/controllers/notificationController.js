const Notification = require('../models/Notification');

exports.getAll = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const unread = notifications.filter((n) => !n.is_read).length;
    res.json({ success: true, notifications, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

exports.markRead = async (req, res) => {
  const { id } = req.params;
  try {
    const n = await Notification.findOne({ where: { id, user_id: req.user.id } });
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
    await n.update({ is_read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const n = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
    await n.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};
