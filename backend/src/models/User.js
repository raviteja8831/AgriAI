const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(15), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100) },
  password_hash: { type: DataTypes.STRING(255) },
  role: { type: DataTypes.ENUM('farmer', 'admin', 'expert'), defaultValue: 'farmer' },
  language: { type: DataTypes.ENUM('en', 'hi', 'te'), defaultValue: 'en' },
  profile_image: { type: DataTypes.STRING(500) },
  otp_code: { type: DataTypes.STRING(6) },
  otp_expires_at: { type: DataTypes.DATE },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  fcm_token: { type: DataTypes.STRING(500) },
  last_login: { type: DataTypes.DATE },
  referred_by: { type: DataTypes.INTEGER },
  whatsapp_opt_in: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

User.beforeCreate(async (user) => {
  if (user.password_hash) {
    user.password_hash = await bcrypt.hash(user.password_hash, 12);
  }
});

module.exports = User;
