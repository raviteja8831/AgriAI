const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CropCalendar = sequelize.define('CropCalendar', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  crop_id: { type: DataTypes.INTEGER, allowNull: false },
  task_name: { type: DataTypes.STRING(200), allowNull: false },
  task_type: {
    type: DataTypes.ENUM('land_preparation', 'sowing', 'fertilizer', 'irrigation', 'pesticide', 'weeding', 'harvesting', 'other'),
    defaultValue: 'other',
  },
  scheduled_date: { type: DataTypes.DATEONLY, allowNull: false },
  completed_date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'skipped'), defaultValue: 'pending' },
  notes: { type: DataTypes.TEXT },
  reminder_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'crop_calendar',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = CropCalendar;
