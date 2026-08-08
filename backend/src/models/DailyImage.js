const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyImage = sequelize.define('DailyImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  crop_id: { type: DataTypes.INTEGER, allowNull: false },
  image_url: { type: DataTypes.STRING(500), allowNull: false },
  thumbnail_url: { type: DataTypes.STRING(500) },
  captured_at: { type: DataTypes.DATE },
  health_score: { type: DataTypes.DECIMAL(4, 2) },
  ai_prediction: { type: DataTypes.TEXT },
  growth_stage: { type: DataTypes.STRING(100) },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'daily_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = DailyImage;
