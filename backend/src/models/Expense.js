const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  crop_id: { type: DataTypes.INTEGER, allowNull: false },
  category: {
    type: DataTypes.ENUM('seeds', 'fertilizer', 'pesticide', 'labour', 'machinery', 'irrigation', 'transport', 'other'),
    defaultValue: 'other',
  },
  description: { type: DataTypes.STRING(300) },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(10, 2) },
  unit: { type: DataTypes.STRING(50) },
  expense_date: { type: DataTypes.DATEONLY, allowNull: false },
  receipt_url: { type: DataTypes.STRING(500) },
}, {
  tableName: 'expenses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Expense;
