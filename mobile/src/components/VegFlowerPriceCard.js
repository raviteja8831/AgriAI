import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { marketAPI } from '../api';
import { colors } from '../utils/theme';

const EMOJI = {
  Chilli: '🌶️', Tomato: '🍅', Onion: '🧅', Potato: '🥔', Brinjal: '🍆',
  Cabbage: '🥬', Cauliflower: '🥦', Carrot: '🥕', Okra: '🌿', 'Green Peas': '🫛',
  Cucumber: '🥒', Beans: '🫘',
  Marigold: '🌼', Rose: '🌹', Jasmine: '🌸', Chrysanthemum: '🌻', Gladiolus: '🌷',
};

export default function VegFlowerPriceCard({ navigation }) {
  const { data } = useQuery({
    queryKey: ['veg-flower-prices'],
    queryFn: () => marketAPI.getVegFlowerPrices().then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const items = [...(data?.vegetables || []), ...(data?.flowers || [])];
  if (items.length === 0) return null;

  const goToPrices = () => navigation?.navigate('VegFlowerPrices');

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={goToPrices} activeOpacity={0.7}>
        <Text style={styles.title}>🥬 Vegetable & Flower Prices</Text>
        <Text style={styles.date}>{data?.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {items.map((item) => {
          const up = item.trend === 'rising';
          const down = item.trend === 'falling';
          return (
            <TouchableOpacity key={item.crop_name} style={styles.priceCard} onPress={goToPrices} activeOpacity={0.8}>
              <Text style={styles.cropEmoji}>{EMOJI[item.crop_name] || '🌱'}</Text>
              <Text style={styles.cropName}>{item.crop_name}</Text>
              <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
              <Text style={styles.unit}>per {item.unit}</Text>
              <View style={[styles.changeBadge, { backgroundColor: up ? '#e8f5e9' : down ? '#ffebee' : '#f5f5f5' }]}>
                <Text style={[styles.changeText, { color: up ? colors.success : down ? colors.error : colors.textSecondary }]}>
                  {up ? '↑' : down ? '↓' : '→'} {item.change_pct}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.footer} onPress={goToPrices}>
        <Text style={styles.footerNote}>See all vegetable & flower prices →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, elevation: 3, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 12, color: colors.textSecondary },
  scroll: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
  priceCard: { width: 120, backgroundColor: colors.background, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cropEmoji: { fontSize: 28, marginBottom: 4 },
  cropName: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  price: { fontSize: 17, fontWeight: '800', color: colors.primary },
  unit: { fontSize: 10, color: colors.textSecondary, marginBottom: 6 },
  changeBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  changeText: { fontSize: 11, fontWeight: '700' },
  footer: { backgroundColor: '#f9fbe7', padding: 10, borderTopWidth: 1, borderTopColor: colors.border },
  footerNote: { fontSize: 12, color: colors.primary, fontWeight: '600', textAlign: 'center' },
});
