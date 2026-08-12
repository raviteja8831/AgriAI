import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

const FEATURES = [
  { emoji: '🌤️', text: 'Weather forecasts tailored to your farm location' },
  { emoji: '🧪', text: 'Soil analysis and health tracking' },
  { emoji: '🌿', text: 'Crop progress, expenses and harvest records' },
  { emoji: '📅', text: 'A season-long crop calendar with task reminders' },
  { emoji: '📈', text: 'Local market prices for your crops' },
];

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.appName}>AgriAI</Text>
        <Text style={styles.tagline}>Smart Farming Platform</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <Text style={styles.body}>
        AgriAI helps farmers make better decisions with weather, soil and crop
        recommendations built around their own farm data.
      </Text>

      <View style={styles.featureList}>
        {FEATURES.map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>Made for farmers, with 💚</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, alignItems: 'center' },
  hero: { alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 64 },
  appName: { fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: 6 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  version: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  body: { fontSize: 14, lineHeight: 21, color: colors.textPrimary, textAlign: 'center', marginBottom: 24 },
  featureList: { width: '100%', backgroundColor: colors.surface, borderRadius: 14, padding: 16, elevation: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  featureEmoji: { fontSize: 20, marginRight: 12 },
  featureText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  footer: { fontSize: 13, color: colors.textSecondary, marginTop: 28 },
});
