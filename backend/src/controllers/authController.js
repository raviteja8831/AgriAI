const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Hardcoded OTP until SMS gateway is wired up
const HARDCODED_OTP = '1234';

exports.sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });
  try {
    let user = await User.findOne({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      // Create a minimal account — name is filled in during onboarding
      user = await User.create({ name: phone, phone, is_active: true });
    }

    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await user.update({ otp_code: HARDCODED_OTP, otp_expires_at: expires });

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
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, language: user.language },
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
    res.json({ success: true, user: { id: req.user.id, name, phone: req.user.phone, role: req.user.role, language } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Setup failed' });
  }
};

exports.getMe = async (req, res) => {
  const u = req.user;
  res.json({ success: true, user: { id: u.id, name: u.name, phone: u.phone, role: u.role, language: u.language, profile_image: u.profile_image } });
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

exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (user.password_hash) {
      const valid = await user.validatePassword(current_password);
      if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    const hashed = await bcrypt.hash(new_password, 12);
    await user.update({ password_hash: hashed });
    res.json({ success: true, message: 'Password changed' });
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
    res.json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role, language: user.language } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};
