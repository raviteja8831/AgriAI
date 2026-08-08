const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeatherHistory = sequelize.define('WeatherHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  farm_id: { type: DataTypes.INTEGER, allowNull: false },
  recorded_date: { type: DataTypes.DATEONLY, allowNull: false },
  temperature_max: { type: DataTypes.DECIMAL(5, 2) },
  temperature_min: { type: DataTypes.DECIMAL(5, 2) },
  rainfall_mm: { type: DataTypes.DECIMAL(7, 2) },
  humidity_percent: { type: DataTypes.DECIMAL(5, 2) },
  wind_speed_kmh: { type: DataTypes.DECIMAL(6, 2) },
  uv_index: { type: DataTypes.DECIMAL(4, 2) },
  weather_condition: { type: DataTypes.STRING(100) },
  ai_suggestion: { type: DataTypes.TEXT },
  irrigation_advised: { type: DataTypes.BOOLEAN, defaultValue: false },
  spray_advised: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'weather_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = WeatherHistory;
