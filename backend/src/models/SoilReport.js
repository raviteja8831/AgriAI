const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SoilReport = sequelize.define('SoilReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  farm_id: { type: DataTypes.INTEGER, allowNull: false },
  ph: { type: DataTypes.DECIMAL(4, 2) },
  nitrogen_kg_ha: { type: DataTypes.DECIMAL(8, 2) },
  phosphorus_kg_ha: { type: DataTypes.DECIMAL(8, 2) },
  potassium_kg_ha: { type: DataTypes.DECIMAL(8, 2) },
  organic_carbon_percent: { type: DataTypes.DECIMAL(5, 2) },
  moisture_percent: { type: DataTypes.DECIMAL(5, 2) },
  ec_ds_m: { type: DataTypes.DECIMAL(6, 3) },
  boron: { type: DataTypes.DECIMAL(6, 3) },
  zinc: { type: DataTypes.DECIMAL(6, 3) },
  report_date: { type: DataTypes.DATEONLY },
  lab_name: { type: DataTypes.STRING(100) },
  ai_recommendation: { type: DataTypes.TEXT },
  suitable_crops: { type: DataTypes.JSON },
}, {
  tableName: 'soil_reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = SoilReport;
