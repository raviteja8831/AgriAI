import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

const CROP_EMOJI = {
  Rice: '🌾', Wheat: '🌿', Cotton: '🌸', Maize: '🌽', Soybean: '🫘',
  Groundnut: '🥜', Sugarcane: '🎋', Turmeric: '🟡', Chilli: '🌶️',
  Tomato: '🍅', Onion: '🧅', Banana: '🍌', Mustard: '🌼',
  'Jowar (Sorghum)': '🌾', 'Bajra (Pearl Millet)': '🌾',
};

export default function MarketPriceCard({ prices = [], date }) {
  if (prices.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Today's Mandi Prices</Text>
        <Text style={styles.date}>{date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {prices.map((item) => {
          const up = item.change > 50;
          const down = item.change < -50;
          const stable = !up && !down;
          return (
            <View key={item.crop_name} style={styles.priceCard}>
              <Text style={styles.cropEmoji}>{CROP_EMOJI[item.crop_name] || '🌱'}</Text>
              <Text style={styles.cropName}>{item.crop_name}</Text>
              <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
              <Text style={styles.unit}>per {item.unit}</Text>
              <View style={[styles.changeBadge, { backgroundColor: up ? '#e8f5e9' : down ? '#ffebee' : '#f5f5f5' }]}>
                <Text style={[styles.changeText, { color: up ? colors.success : down ? colors.error : colors.textSecondary }]}>
                  {up ? '↑' : down ? '↓' : '→'} ₹{Math.abs(item.change)}
                </Text>
              </View>
              {item.msp && (
                <View style={[styles.mspBadge, { backgroundColor: item.above_msp ? '#e8f5e9' : '#fff8e1' }]}>
                  <Text style={[styles.mspText, { color: item.above_msp ? colors.success : colors.warning }]}>
                    {item.above_msp ? '✅ Above MSP' : '⚠️ Below MSP'}
                  </Text>
                </View>
              )}
              <Text style={styles.advice} numberOfLines={2}>{item.sell_advice}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>💡 Prices are indicative. Check your local mandi for exact rates.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 3, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 12, color: colors.textSecondary },
  scroll: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
  priceCard: { width: 140, backgroundColor: colors.background, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cropEmoji: { fontSize: 32, marginBottom: 4 },
  cropName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  price: { fontSize: 20, fontWeight: '800', color: colors.primary },
  unit: { fontSize: 11, color: colors.textSecondary, marginBottom: 6 },
  changeBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  changeText: { fontSize: 12, fontWeight: '700' },
  mspBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  mspText: { fontSize: 10, fontWeight: '600' },
  advice: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', lineHeight: 14 },
  footer: { backgroundColor: '#f9fbe7', padding: 10, borderTopWidth: 1, borderTopColor: colors.border },
  footerNote: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
});
