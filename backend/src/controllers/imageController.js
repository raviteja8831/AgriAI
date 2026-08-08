const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DailyImage = require('../models/DailyImage');
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `crop_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
};

exports.upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const verifyCropOwner = (cropId, userId) =>
  Crop.findOne({
    where: { id: cropId },
    include: [{ model: Farm, as: 'farm', where: { user_id: userId } }],
  });

exports.uploadImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const image = await DailyImage.create({
      crop_id: parseInt(crop_id),
      image_url: imageUrl,
      captured_at: new Date(),
      notes: req.body.notes,
    });

    res.status(201).json({ success: true, image });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save image' });
  }
};

exports.getImages = async (req, res) => {
  const { crop_id } = req.params;
  try {
    const crop = await verifyCropOwner(crop_id, req.user.id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    const images = await DailyImage.findAll({
      where: { crop_id },
      order: [['captured_at', 'DESC']],
    });
    res.json({ success: true, images });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch images' });
  }
};

exports.deleteImage = async (req, res) => {
  const { image_id } = req.params;
  try {
    const image = await DailyImage.findOne({
      where: { id: image_id },
      include: [{
        model: Crop,
        as: 'crop',
        include: [{ model: Farm, as: 'farm', where: { user_id: req.user.id } }],
      }],
    });
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    const filePath = path.join(__dirname, '../../', image.image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await image.destroy();
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};
