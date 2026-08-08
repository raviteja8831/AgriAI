const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Farm = sequelize.define('Farm', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  survey_number: { type: DataTypes.STRING(50) },
  village: { type: DataTypes.STRING(100) },
  district: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  area_acres: { type: DataTypes.DECIMAL(10, 2) },
  irrigation_type: {
    type: DataTypes.ENUM('rain_fed', 'canal', 'borewell', 'drip', 'sprinkler'),
    defaultValue: 'rain_fed',
  },
  soil_type: {
    type: DataTypes.ENUM('clay', 'sandy', 'loamy', 'silt', 'black', 'red'),
    defaultValue: 'loamy',
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'farms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Farm;
