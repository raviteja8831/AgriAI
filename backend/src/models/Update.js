const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Update = sequelize.define('Update', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  emoji: { type: DataTypes.STRING(8), defaultValue: '📰' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  body: { type: DataTypes.STRING(300), allowNull: false },
  screen: { type: DataTypes.STRING(100), allowNull: false },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'updates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Update;
