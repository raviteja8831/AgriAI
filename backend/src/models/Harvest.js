const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Harvest = sequelize.define('Harvest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  crop_id: { type: DataTypes.INTEGER, allowNull: false },
  yield_kg: { type: DataTypes.DECIMAL(12, 2) },
  yield_per_acre: { type: DataTypes.DECIMAL(10, 2) },
  quality_grade: { type: DataTypes.ENUM('A', 'B', 'C', 'rejected'), defaultValue: 'A' },
  market_price_per_kg: { type: DataTypes.DECIMAL(10, 2) },
  total_revenue: { type: DataTypes.DECIMAL(14, 2) },
  total_expenses: { type: DataTypes.DECIMAL(14, 2) },
  profit_loss: { type: DataTypes.DECIMAL(14, 2) },
  harvest_date: { type: DataTypes.DATEONLY },
  sold_to: { type: DataTypes.STRING(200) },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'harvests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Harvest;
