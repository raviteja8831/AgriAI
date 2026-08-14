import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TextInput as RNTextInput, TouchableOpacity, Pressable, Animated, Modal, SafeAreaView } from 'react-native';
import { Text, Button, Checkbox, IconButton } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';
import { setCredentials, loginSuccess } from '../store/authSlice';
import { useSnackbar } from '../components/SnackbarProvider';
import MESSAGES from '../config/messages.json';
import { colors } from '../utils/theme';
import { TERMS_SECTIONS } from '../constants/terms';

// Once a login has ever completed on this device, the referral prompt is
// permanently hidden — it's only meant to be offered on the very first login.
const HAS_LOGGED_IN_KEY = 'hasLoggedInBefore';

function TermsModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Terms and Conditions</Text>
          <IconButton icon="close" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.modalBody}>
          {TERMS_SECTIONS.map((section) => (
            <View key={section.title} style={styles.policySection}>
              <Text style={styles.policyHeading}>{section.title}</Text>
              <Text style={styles.policyBody}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.modalFooter}>
          <Button mode="contained" buttonColor={colors.info} style={styles.verifyBtn} contentStyle={styles.btnContent} onPress={onClose}>
            Close
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function LoginScreen() {
  const dispatch = useDispatch();
  const snack = useSnackbar();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendHovered, setResendHovered] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [termsVisible, setTermsVisible] = useState(false);
  const [canOfferReferral, setCanOfferReferral] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(HAS_LOGGED_IN_KEY)
      .then((val) => setCanOfferReferral(!val))
      .catch(() => setCanOfferReferral(true));
  }, []);

  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendTimer]);

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
    if (!agreedToTerms) {
      snack.showWarning('Please accept the Terms and Conditions and Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      await authAPI.sendOTP(cleaned, referralCode.trim());
      snack.showSuccess(MESSAGES.success.otpSent);
      setResendTimer(60);
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
      dispatch(loginSuccess());
      AsyncStorage.setItem(HAS_LOGGED_IN_KEY, 'true').catch(() => {});
      snack.showSuccess(MESSAGES.success.login);
    } catch {
      setOtp(['', '', '', '']);
      setResendTimer(0);
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
  };

  const otpString = otp.join('');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {step === 'phone' ? (
            <View>
              <Text style={styles.stepTitle}>Enter Mobile Number</Text>
              <Text style={styles.stepSub}>Get weather, crop and farming updates</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}><Text style={styles.countryText}>🇮🇳 +91</Text></View>
                <RNTextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
                  placeholder="9876543210"
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                  autoFocus
                />
              </View>
              <Text style={styles.otpHint}>You will receive an OTP to verify this number</Text>

              {canOfferReferral && (
                <>
                  <TouchableOpacity onPress={() => setShowReferral((v) => !v)} style={styles.referralToggle}>
                    <Text style={styles.referralToggleText}>{showReferral ? 'Enter referral code: ' : 'Have a referral code?'}</Text>
                  </TouchableOpacity>
                  {showReferral && (
                    <RNTextInput
                      style={styles.referralInput}
                      value={referralCode}
                      onChangeText={setReferralCode}
                      placeholder="Enter referral code"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="characters"
                    />
                  )}
                </>
              )}

              <View style={styles.termsRow}>
                <Checkbox
                  status={agreedToTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAgreedToTerms((v) => !v)}
                  color={colors.primary}
                />
                <Text style={styles.termsText} onPress={() => setAgreedToTerms((v) => !v)}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={() => setTermsVisible(true)}>Terms and Conditions</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink} onPress={() => setTermsVisible(true)}>Privacy Policy</Text>
                </Text>
              </View>

              <Button mode="contained" buttonColor={colors.info}
                rippleColor="transparent" onPress={phone.length === 10 && agreedToTerms ? handleSendOTP : undefined} loading={loading}
                disabled={loading}
                style={[styles.verifyBtn, (phone.length < 10 || !agreedToTerms) && styles.btnDisabled]} contentStyle={styles.btnContent}>
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
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>Resend OTP in {resendTimer}s</Text>
              ) : (
                <Pressable
                  style={styles.resendBtn}
                  onHoverIn={() => setResendHovered(true)}
                  onHoverOut={() => setResendHovered(false)}
                  onPress={() => { setOtp(['', '', '', '']); handleSendOTP(); }}
                >
                  <Text style={[styles.resendText, resendHovered && styles.resendTextHovered]}>Resend OTP</Text>
                </Pressable>
              )}
              <Button mode="contained" buttonColor={colors.info}
                rippleColor="transparent" onPress={otpString.length === 4 ? () => verifyOTP(otpString) : undefined} loading={loading}
                disabled={loading} style={[styles.verifyBtn, otpString.length < 4 && styles.btnDisabled]} contentStyle={styles.btnContent}>
                Verify & Login
              </Button>
            </View>
          )}
        </Animated.View>
      </View>
      <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { flex: 1, backgroundColor: '#fff', paddingTop: '10%', paddingHorizontal: 32, paddingBottom: 32, overflow: 'hidden' },
  stepTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  stepSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  countryCode: { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.background, borderRightWidth: 1, borderRightColor: colors.border },
  countryText: { fontSize: 16, fontWeight: '600' },
  phoneInput: { flex: 1, fontSize: 20, fontWeight: '600', paddingHorizontal: 14, paddingVertical: 14, color: colors.textPrimary, letterSpacing: 2 },
  otpHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  referralToggle: { marginTop: 12, marginBottom: 4, alignSelf: 'flex-start' },
  referralToggleText: { color: colors.info, fontWeight: '600', fontSize: 13 },
  referralInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginTop: 8, marginBottom: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 4, marginLeft: -8 },
  termsText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  termsLink: { color: colors.info, fontWeight: '600', textDecorationLine: 'underline' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  modalBody: { padding: 20 },
  modalFooter: { paddingHorizontal: 20, paddingBottom: 20 },
  policySection: { marginBottom: 20 },
  policyHeading: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  policyBody: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  otpBox: { width: 64, height: 64, borderRadius: 12, borderWidth: 2, borderColor: colors.border, fontSize: 28, fontWeight: '700', color: colors.textPrimary, backgroundColor: colors.background, padding: 0, lineHeight: 28, textAlignVertical: 'center', includeFontPadding: false },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '15' },
  verifying: { textAlign: 'center', color: colors.textSecondary, marginBottom: 8 },
  btn: { borderRadius: 12, marginTop: 8 },
  verifyBtn: { borderRadius: 12, marginTop: 8, alignSelf: 'flex-end' },
  btnDisabled: { opacity: 0.5 },
  btnContent: { paddingVertical: 8 },
  backBtn: { marginBottom: 16 },
  backText: { color: colors.primary, fontWeight: '600' },
  resendBtn: { alignItems: 'center', marginBottom: 12 },
  resendText: { color: colors.info, fontWeight: '500' },
  resendTextHovered: { color: colors.info, textDecorationLine: 'underline' },
  resendTimer: { textAlign: 'center', color: colors.textSecondary, marginBottom: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  socialBtn: { borderRadius: 12, borderColor: colors.border, marginBottom: 12 },
});
