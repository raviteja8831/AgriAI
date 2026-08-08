const User = require('./User');
const Farm = require('./Farm');
const Crop = require('./Crop');
const SoilReport = require('./SoilReport');
const WeatherHistory = require('./WeatherHistory');
const DailyImage = require('./DailyImage');
const DiseaseReport = require('./DiseaseReport');
const Expense = require('./Expense');
const Harvest = require('./Harvest');
const CropCalendar = require('./CropCalendar');
const Notification = require('./Notification');

User.hasMany(Farm, { foreignKey: 'user_id', as: 'farms' });
Farm.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

Farm.hasMany(Crop, { foreignKey: 'farm_id', as: 'crops' });
Crop.belongsTo(Farm, { foreignKey: 'farm_id', as: 'farm' });

Farm.hasMany(SoilReport, { foreignKey: 'farm_id', as: 'soilReports' });
SoilReport.belongsTo(Farm, { foreignKey: 'farm_id', as: 'farm' });

Farm.hasMany(WeatherHistory, { foreignKey: 'farm_id', as: 'weatherHistory' });
WeatherHistory.belongsTo(Farm, { foreignKey: 'farm_id', as: 'farm' });

Crop.hasMany(DailyImage, { foreignKey: 'crop_id', as: 'images' });
DailyImage.belongsTo(Crop, { foreignKey: 'crop_id', as: 'crop' });

Crop.hasMany(DiseaseReport, { foreignKey: 'crop_id', as: 'diseaseReports' });
DiseaseReport.belongsTo(Crop, { foreignKey: 'crop_id', as: 'crop' });

DailyImage.hasMany(DiseaseReport, { foreignKey: 'image_id', as: 'diseaseReports' });
DiseaseReport.belongsTo(DailyImage, { foreignKey: 'image_id', as: 'image' });

Crop.hasMany(Expense, { foreignKey: 'crop_id', as: 'expenses' });
Expense.belongsTo(Crop, { foreignKey: 'crop_id', as: 'crop' });

Crop.hasOne(Harvest, { foreignKey: 'crop_id', as: 'harvest' });
Harvest.belongsTo(Crop, { foreignKey: 'crop_id', as: 'crop' });

Crop.hasMany(CropCalendar, { foreignKey: 'crop_id', as: 'calendarTasks' });
CropCalendar.belongsTo(Crop, { foreignKey: 'crop_id', as: 'crop' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { User, Farm, Crop, SoilReport, WeatherHistory, DailyImage, DiseaseReport, Expense, Harvest, CropCalendar, Notification };
