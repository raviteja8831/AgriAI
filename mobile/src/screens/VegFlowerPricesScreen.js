import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { marketAPI } from '../api';
import { colors } from '../utils/theme';

const EMOJI = {
  Chilli: '🌶️', Tomato: '🍅', Onion: '🧅', Potato: '🥔', Brinjal: '🍆',
  Cabbage: '🥬', Cauliflower: '🥦', Carrot: '🥕', Okra: '🌿', 'Green Peas': '🫛',
  Cucumber: '🥒', Beans: '🫘',
  Marigold: '🌼', Rose: '🌹', Jasmine: '🌸', Chrysanthemum: '🌻', Gladiolus: '🌷',
};

function PriceGrid({ items }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const up = item.trend === 'rising';
        const down = item.trend === 'falling';
        return (
          <View key={item.crop_name} style={styles.card}>
            <Text style={styles.emoji}>{EMOJI[item.crop_name] || '🌱'}</Text>
            <Text style={styles.name}>{item.crop_name}</Text>
            <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
            <Text style={styles.unit}>per {item.unit}</Text>
            <View style={[styles.changeBadge, { backgroundColor: up ? '#e8f5e9' : down ? '#ffebee' : '#f5f5f5' }]}>
              <Text style={[styles.changeText, { color: up ? colors.success : down ? colors.error : colors.textSecondary }]}>
                {up ? '↑' : down ? '↓' : '→'} {item.change_pct}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function VegFlowerPricesScreen() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['veg-flower-prices'],
    queryFn: () => marketAPI.getVegFlowerPrices().then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>Loading today's prices...</Text>
    </View>
  );

  const vegetables = data?.vegetables || [];
  const flowers = data?.flowers || [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <Text style={styles.dateText}>📅 {data?.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>

      <Text style={styles.sectionTitle}>🥬 Vegetables</Text>
      <PriceGrid items={vegetables} />

      <Text style={styles.sectionTitle}>🌸 Flowers</Text>
      <PriceGrid items={flowers} />

      <Text style={styles.footerNote}>💡 Prices are indicative. Check your local mandi for exact rates.</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 12, color: colors.textSecondary },
  dateText: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  card: { width: '31%', backgroundColor: '#fff', borderRadius: 14, padding: 10, alignItems: 'center', elevation: 2 },
  emoji: { fontSize: 26, marginBottom: 4 },
  name: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '800', color: colors.primary },
  unit: { fontSize: 10, color: colors.textSecondary, marginBottom: 6 },
  changeBadge: { borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  changeText: { fontSize: 10, fontWeight: '700' },
  footerNote: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
