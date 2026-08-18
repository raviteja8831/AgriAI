import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

const TILES = [
  { emoji: '🏡', label: 'My Farms', screen: 'Farms' },
  { emoji: '🌿', label: 'Crops', screen: 'Crops' },
  { emoji: '🌤️', label: 'Weather', screen: 'Weather' },
  { emoji: '📅', label: 'Crop Calendar', screen: 'Calendar' },
  { emoji: '🧪', label: 'Soil Analysis', screen: 'Soil' },
  { emoji: '🎬', label: 'Videos', screen: 'Videos' },
  { emoji: '🥬', label: 'Veg & Flower Prices', screen: 'VegFlowerPrices' },
  { emoji: '💬', label: 'Communication', screen: 'Communication' },
  { emoji: '🔔', label: 'Notifications', screen: 'Notifications' },
  { emoji: '📄', label: 'Terms & Conditions', screen: 'Terms' },
  { emoji: '📩', label: 'Contact Us', screen: 'Contact' },
  { emoji: 'ℹ️', label: 'About App', screen: 'About' },
];

export default function CategoriesScreen({ navigation }) {
  const goToDrawerScreen = (screen) => navigation.navigate('HomeTab', { screen });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>All Categories</Text>
      <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('ArhaTab')}>
        <Text style={styles.emoji}>🤖</Text>
        <Text style={styles.label} numberOfLines={2}>Arha AI Assistant</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tile} onPress={() => goToDrawerScreen('Dashboard')}>
        <Text style={styles.emoji}>🏠</Text>
        <Text style={styles.label} numberOfLines={2}>Home</Text>
      </TouchableOpacity>
      {TILES.map((t) => (
        <TouchableOpacity key={t.screen} style={styles.tile} onPress={() => goToDrawerScreen(t.screen)}>
          <Text style={styles.emoji}>{t.emoji}</Text>
          <Text style={styles.label} numberOfLines={2}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sectionTitle: { width: '100%', fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  tile: { width: '30%', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 2 },
  emoji: { fontSize: 30, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', paddingHorizontal: 4 },
});
