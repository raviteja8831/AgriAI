import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import { colors } from '../utils/theme';

const AUTO_ADVANCE_DELAY = 1800;

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
  const [locationVisible, setLocationVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setLocationVisible(true), AUTO_ADVANCE_DELAY);
    return () => clearTimeout(t);
  }, []);

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
      <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.appName}>AgriAI</Text>
        <Text style={styles.tagline}>Smart Farming Platform</Text>
      </Animated.View>
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
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 72 },
  appName: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, marginTop: 8 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  emoji: { fontSize: 56, marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 14 },
  bodyLight: { color: colors.textSecondary, textAlign: 'center', marginBottom: 0 },
  nextBtn: { borderRadius: 12, width: '70%' },
  btnContent: { paddingVertical: 8 },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialogCard: { width: '100%', backgroundColor: '#FFFDE7', borderRadius: 16, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center' },
});
