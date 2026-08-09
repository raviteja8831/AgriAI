import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import * as Location from 'expo-location';
import { colors } from '../utils/theme';

const PRIVACY_POLICY_SECTIONS = [
  {
    title: 'Information we collect',
    body: 'AgriAI collects your phone number for login, and your farm location and crop details to give you personalised weather, soil and crop recommendations.',
  },
  {
    title: 'How we use your data',
    body: 'We never sell your personal data to third parties. Your information is used only to improve your farming recommendations and app experience, and is stored securely.',
  },
  {
    title: 'Your controls',
    body: "You can review, update or delete your data at any time from your Profile page. By continuing, you agree to our data practices as described here.",
  },
];

function PrivacyPolicyModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Privacy Policy</Text>
          <IconButton icon="close" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.modalBody}>
          {PRIVACY_POLICY_SECTIONS.map((section) => (
            <View key={section.title} style={styles.policySection}>
              <Text style={styles.policyHeading}>{section.title}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <Button mode="contained" style={styles.btn} contentStyle={styles.btnContent} onPress={onClose}>
            Close
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function IntroScreen({ onDone }) {
  const [step, setStep] = useState(0); // 0 = welcome/privacy, 1 = location
  const [policyVisible, setPolicyVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const requestLocation = async () => {
    setRequesting(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } finally {
      setRequesting(false);
      onDone();
    }
  };

  return (
    <View style={styles.container}>
      {step === 0 ? (
        <>
          <View style={styles.hero}>
            <Text style={styles.logo}>🌾</Text>
            <Text style={styles.appName}>AgriAI</Text>
            <Text style={styles.tagline}>Smart Farming Platform</Text>
          </View>
          <View style={styles.footer}>
            <Button mode="outlined" style={styles.btn} contentStyle={styles.btnContent} textColor="#fff" onPress={() => setPolicyVisible(true)}>
              Privacy Policy
            </Button>
            <Button mode="contained" style={[styles.btn, { marginTop: 12 }]} contentStyle={styles.btnContent} onPress={() => setStep(1)}>
              Next
            </Button>
          </View>
          <PrivacyPolicyModal visible={policyVisible} onClose={() => setPolicyVisible(false)} />
        </>
      ) : (
        <>
          <View style={styles.hero}>
            <Text style={styles.emoji}>📍</Text>
            <Text style={styles.stepTitle}>Enable your location</Text>
            <Text style={[styles.body, styles.bodyLight]}>
              AgriAI uses your location to show weather, soil and crop recommendations
              specific to your farm's region.
            </Text>
          </View>
          <View style={styles.footer}>
            <Button
              mode="contained"
              style={styles.btn}
              contentStyle={styles.btnContent}
              loading={requesting}
              disabled={requesting}
              onPress={requestLocation}
            >
              Allow Location Access
            </Button>
            <Button mode="text" textColor="#fff" onPress={onDone} disabled={requesting} style={{ marginTop: 4 }}>
              Not now
            </Button>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 72 },
  appName: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 8 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  emoji: { fontSize: 56, marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 10, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 14 },
  bodyLight: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 0 },
  footer: { padding: 24, paddingBottom: 40 },
  btn: { borderRadius: 12, borderColor: '#fff' },
  btnContent: { paddingVertical: 8 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  modalBody: { padding: 20 },
  policySection: { marginBottom: 20 },
  policyHeading: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
});
