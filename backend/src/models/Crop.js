const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Crop = sequelize.define('Crop', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  farm_id: { type: DataTypes.INTEGER, allowNull: false },
  crop_name: { type: DataTypes.STRING(100), allowNull: false },
  crop_variety: { type: DataTypes.STRING(100) },
  season: { type: DataTypes.ENUM('kharif', 'rabi', 'zaid', 'annual'), defaultValue: 'kharif' },
  sowing_date: { type: DataTypes.DATEONLY },
  expected_harvest_date: { type: DataTypes.DATEONLY },
  actual_harvest_date: { type: DataTypes.DATEONLY },
  area_acres: { type: DataTypes.DECIMAL(10, 2) },
  seed_quantity_kg: { type: DataTypes.DECIMAL(10, 2) },
  status: {
    type: DataTypes.ENUM('planned', 'sowing', 'growing', 'flowering', 'harvesting', 'harvested', 'failed'),
    defaultValue: 'planned',
  },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'crops',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Crop;
