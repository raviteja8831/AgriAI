const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiseaseReport = sequelize.define('DiseaseReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  crop_id: { type: DataTypes.INTEGER, allowNull: false },
  image_id: { type: DataTypes.INTEGER },
  disease_name: { type: DataTypes.STRING(200) },
  confidence_score: { type: DataTypes.DECIMAL(5, 2) },
  severity: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'low' },
  affected_area_percent: { type: DataTypes.DECIMAL(5, 2) },
  medicine_recommendation: { type: DataTypes.TEXT },
  dosage_details: { type: DataTypes.TEXT },
  recovery_estimate_days: { type: DataTypes.INTEGER },
  is_treated: { type: DataTypes.BOOLEAN, defaultValue: false },
  treatment_date: { type: DataTypes.DATEONLY },
}, {
  tableName: 'disease_reports',
  timestamps: true,
  createdAt: 'detected_at',
  updatedAt: false,
});

module.exports = DiseaseReport;
