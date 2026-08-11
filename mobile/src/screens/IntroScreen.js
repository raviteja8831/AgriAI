import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import * as Location from 'expo-location';
import { colors } from '../utils/theme';

const TERMS_SECTIONS = [
  {
    title: '1. General',
    body: 'AgriAI is a farming advisory platform that gives you weather, soil and crop recommendations based on the information you provide. AgriAI does not guarantee farming, yield or financial outcomes from following its recommendations.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years old and legally capable of entering into a contract under Indian law to use AgriAI. We may suspend or terminate accounts that violate this requirement.',
  },
  {
    title: '3. Acceptance of Terms',
    body: 'By creating an account or using AgriAI, you agree to be bound by these Terms & Conditions. We may update these terms from time to time; continued use of the app after an update means you accept the revised terms.',
  },
  {
    title: '4. Your Account',
    body: 'You are responsible for keeping your login details and account information accurate and confidential. AgriAI may suspend accounts that contain false or misleading information.',
  },
  {
    title: '5. Privacy',
    body: 'Your phone number, farm location and crop details are collected only to personalise your recommendations and are never sold to third parties. You can review, update or delete this data anytime from your Profile page.',
  },
  {
    title: '6. License and Access',
    body: 'We grant you a limited, non-transferable license to use AgriAI for your own farming needs. Copying, reverse-engineering or commercially exploiting the app or its content is not permitted.',
  },
  {
    title: '7. Advisory Disclaimer',
    body: 'Weather, soil and crop recommendations are generated to assist your decisions and should be used alongside your own judgement and local agricultural guidance. AgriAI is not liable for losses arising from actions taken based on its recommendations.',
  },
  {
    title: '8. Prohibited Uses',
    body: 'You agree not to misuse the app, attempt unauthorised access, scrape data, or use AgriAI for any unlawful purpose. Violations may result in immediate suspension of your account.',
  },
  {
    title: '9. Limitation of Liability',
    body: "AgriAI is provided on an 'as is' and 'as available' basis. To the extent permitted by law, we disclaim liability for indirect damages or service interruptions.",
  },
  {
    title: '10. Governing Law and Grievances',
    body: 'These terms are governed by the laws of India. For any grievance regarding the app, please contact us through the support option in your Profile page.',
  },
];

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

function LocationDialog({ visible, requesting, onAllow, onDismiss }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialogCard}>
          <Text style={styles.emoji}>📍</Text>
          <Text style={styles.stepTitle}>Enable your location</Text>
          <Text style={[styles.body, styles.bodyLight]}>
            AgriAI uses your location to show weather, soil and crop recommendations
            specific to your farm's region.
          </Text>
          <Button
            mode="contained"
            buttonColor={colors.info}
            style={styles.nextBtn}
            contentStyle={styles.btnContent}
            loading={requesting}
            disabled={requesting}
            onPress={onAllow}
          >
            Allow Location Access
          </Button>
          <Button mode="text" textColor={colors.textPrimary} onPress={onDismiss} disabled={requesting} style={{ marginTop: 4 }}>
            Not now
          </Button>
        </View>
      </View>
    </Modal>
  );
}

export default function IntroScreen({ onDone }) {
  const [termsVisible, setTermsVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
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
      <View style={styles.hero}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.appName}>AgriAI</Text>
        <Text style={styles.tagline}>Smart Farming Platform</Text>
      </View>
      <View style={styles.footer}>
        <Button
          mode="contained"
          buttonColor={colors.info}
          style={styles.nextBtn}
          contentStyle={styles.btnContent}
          onPress={() => setLocationVisible(true)}
        >
          Next
        </Button>
        <Text style={styles.termsLink} onPress={() => setTermsVisible(true)}>
          Terms and Conditions
        </Text>
      </View>
      <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
      <LocationDialog
        visible={locationVisible}
        requesting={requesting}
        onAllow={requestLocation}
        onDismiss={() => {
          setLocationVisible(false);
          onDone();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDE7' },
  hero: { flex: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 72 },
  appName: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, marginTop: 8 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  emoji: { fontSize: 56, marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 14 },
  bodyLight: { color: colors.textSecondary, textAlign: 'center', marginBottom: 0 },
  footer: { flex: 4, alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
  btn: { borderRadius: 12, borderColor: '#fff' },
  nextBtn: { borderRadius: 12, width: '70%' },
  btnContent: { paddingVertical: 8 },
  termsLink: { color: colors.info, textDecorationLine: 'underline', marginTop: 16, fontSize: 14 },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialogCard: { width: '100%', backgroundColor: '#FFFDE7', borderRadius: 16, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  modalBody: { padding: 20 },
  policySection: { marginBottom: 20 },
  policyHeading: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
});
