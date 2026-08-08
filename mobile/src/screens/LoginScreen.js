import React, { useState, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TextInput as RNTextInput, TouchableOpacity, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { authAPI } from '../api';
import { setCredentials } from '../store/authSlice';
import { useSnackbar } from '../components/SnackbarProvider';
import MESSAGES from '../config/messages.json';
import { colors } from '../utils/theme';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const snack = useSnackbar();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slideToOTP = () => {
    Animated.timing(slideAnim, { toValue: -400, duration: 260, useNativeDriver: true }).start(() => {
      setStep('otp');
      slideAnim.setValue(400);
      Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    });
  };

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      snack.showWarning(MESSAGES.validation.phone);
      return;
    }
    setLoading(true);
    try {
      await authAPI.sendOTP(cleaned);
      snack.showSuccess(MESSAGES.success.otpSent);
      slideToOTP();
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (code) => {
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({ phone: phone.replace(/\D/g, ''), otp: code });
      dispatch(setCredentials(data));
      snack.showSuccess(MESSAGES.success.login);
    } catch {
      setOtp(['', '', '', '']);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (val, idx) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const next = [...otp];
    next[idx] = cleaned;
    setOtp(next);
    if (cleaned && idx < 3) otpRefs[idx + 1].current?.focus();
    if (!cleaned && idx > 0) otpRefs[idx - 1].current?.focus();
    if (next.every((d) => d !== '') && next.join('').length === 4) verifyOTP(next.join(''));
  };

  const otpString = otp.join('');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.appName}>AgriAI</Text>
        <Text style={styles.tagline}>Smart Farming Platform</Text>
      </View>

      <View style={styles.card}>
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {step === 'phone' ? (
            <View>
              <Text style={styles.stepTitle}>Enter Mobile Number</Text>
              <Text style={styles.stepSub}>We'll send a 4-digit OTP to verify</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}><Text style={styles.countryText}>🇮🇳 +91</Text></View>
                <RNTextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                  autoFocus
                />
              </View>
              <Button mode="contained" onPress={handleSendOTP} loading={loading}
                disabled={loading || phone.replace(/\D/g, '').length < 10}
                style={styles.btn} contentStyle={styles.btnContent}>
                Send OTP
              </Button>
            </View>
          ) : (
            <View>
              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['', '', '', '']); }} style={styles.backBtn}>
                <Text style={styles.backText}>← Change number</Text>
              </TouchableOpacity>
              <Text style={styles.stepTitle}>Enter OTP</Text>
              <Text style={styles.stepSub}>Sent to +91 {phone}</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <RNTextInput
                    key={idx}
                    ref={otpRefs[idx]}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={(v) => handleOTPChange(v, idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={idx === 0}
                  />
                ))}
              </View>
              {loading && <Text style={styles.verifying}>Verifying...</Text>}
              <TouchableOpacity style={styles.resendBtn} onPress={() => { setOtp(['', '', '', '']); handleSendOTP(); }}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
              <Button mode="contained" onPress={() => verifyOTP(otpString)} loading={loading}
                disabled={loading || otpString.length < 4} style={styles.btn} contentStyle={styles.btnContent}>
                Verify & Login
              </Button>
              <Button mode="outlined" onPress={() => { setStep('phone'); setOtp(['', '', '', '']); }} style={styles.cancelBtn}>
                Cancel
              </Button>
            </View>
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 72 },
  appName: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 8 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 48, overflow: 'hidden' },
  stepTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  stepSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  countryCode: { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.background, borderRightWidth: 1, borderRightColor: colors.border },
  countryText: { fontSize: 16, fontWeight: '600' },
  phoneInput: { flex: 1, fontSize: 20, fontWeight: '600', paddingHorizontal: 14, paddingVertical: 14, color: colors.textPrimary, letterSpacing: 2 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  otpBox: { width: 64, height: 64, borderRadius: 12, borderWidth: 2, borderColor: colors.border, fontSize: 28, fontWeight: '700', color: colors.textPrimary, backgroundColor: colors.background },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '15' },
  verifying: { textAlign: 'center', color: colors.textSecondary, marginBottom: 8 },
  btn: { borderRadius: 12, marginTop: 8 },
  btnContent: { paddingVertical: 8 },
  cancelBtn: { borderRadius: 12, marginTop: 8 },
  backBtn: { marginBottom: 16 },
  backText: { color: colors.primary, fontWeight: '600' },
  resendBtn: { alignItems: 'center', marginBottom: 12 },
  resendText: { color: colors.primary, fontWeight: '500' },
});
