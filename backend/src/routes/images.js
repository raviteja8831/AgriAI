const router = require('express').Router();
const ctrl = require('../controllers/imageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/crop/:crop_id', ctrl.getImages);
router.post('/crop/:crop_id', ctrl.upload.single('image'), ctrl.uploadImage);
router.delete('/:image_id', ctrl.deleteImage);

module.exports = router;
