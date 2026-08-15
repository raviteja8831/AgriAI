const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { decodeReferralCode } = require('../utils/referral');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
});

const avatarFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
};

exports.avatarUpload = multer({ storage: avatarStorage, fileFilter: avatarFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Hardcoded OTP until SMS gateway is wired up
const HARDCODED_OTP = '1234';

exports.sendOTP = async (req, res) => {
  const { phone, referralCode, whatsappUpdates } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });
  try {
    let user = await User.findOne({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      // Create a minimal account — name is filled in during onboarding
      let referredBy = null;
      if (referralCode) {
        const referrerId = decodeReferralCode(referralCode);
        if (referrerId) {
          const referrer = await User.findByPk(referrerId);
          if (referrer) referredBy = referrer.id;
        }
      }
      user = await User.create({ name: phone, phone, is_active: true, referred_by: referredBy, whatsapp_opt_in: whatsappUpdates !== false });
    }

    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await user.update({ otp_code: HARDCODED_OTP, otp_expires_at: expires, whatsapp_opt_in: whatsappUpdates !== false });

    // TODO: replace with Twilio/SMS gateway
    console.log(`[OTP] ${phone} → ${HARDCODED_OTP}`);

    res.json({ success: true, message: 'OTP sent', isNewUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });
  try {
    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ success: false, message: 'Phone not registered' });
    if (user.otp_code !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (new Date() > user.otp_expires_at) return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });

    await user.update({ otp_code: null, otp_expires_at: null, last_login: new Date() });
    const token = signToken(user.id);

    // isNewUser = name was never set (still equals the phone number placeholder)
    const isNewUser = user.name === phone;

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, language: user.language, has_password: !!user.password_hash },
      isNewUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};

exports.setupProfile = async (req, res) => {
  const { name, language } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  try {
    await req.user.update({ name, language: language || 'en' });
    res.json({ success: true, user: { id: req.user.id, name, phone: req.user.phone, role: req.user.role, language, has_password: !!req.user.password_hash } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Setup failed' });
  }
};

exports.getMe = async (req, res) => {
  const u = req.user;
  res.json({ success: true, user: { id: u.id, name: u.name, phone: u.phone, role: u.role, language: u.language, profile_image: u.profile_image, has_password: !!u.password_hash } });
};

exports.updateProfile = async (req, res) => {
  const { name, email, language } = req.body;
  try {
    await req.user.update({ name, email, language });
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

exports.updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    await req.user.update({ profile_image: imageUrl });
    res.json({ success: true, profile_image: imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile photo' });
  }
};

exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (user.password_hash) {
      if (!current_password) return res.status(400).json({ success: false, message: 'Current password required' });
      const valid = await user.validatePassword(current_password);
      if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    const hashed = await bcrypt.hash(new_password, 12);
    await user.update({ password_hash: hashed });
    res.json({ success: true, message: 'Password changed', has_password: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// Legacy password login kept for admin/web access
exports.login = async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ where: { phone } });
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.password_hash) return res.status(400).json({ success: false, message: 'This account uses OTP login' });
    const valid = await user.validatePassword(password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    await user.update({ last_login: new Date() });
    const token = signToken(user.id);
    res.json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role, language: user.language, has_password: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};
