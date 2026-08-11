const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', [
  body('phone').trim().notEmpty(),
  body('password').notEmpty(),
], ctrl.login);

router.post('/send-otp', body('phone').trim().notEmpty(), ctrl.sendOTP);
router.post('/verify-otp', [
  body('phone').trim().notEmpty(),
  body('otp').trim().notEmpty(),
], ctrl.verifyOTP);
router.post('/setup', authenticate, ctrl.setupProfile);

router.get('/me', authenticate, ctrl.getMe);
router.put('/profile', authenticate, ctrl.updateProfile);
router.put('/profile-image', authenticate, ctrl.avatarUpload.single('avatar'), ctrl.updateAvatar);
router.put('/change-password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 }),
], ctrl.changePassword);

module.exports = router;
