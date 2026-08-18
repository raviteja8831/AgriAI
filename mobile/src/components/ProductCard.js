import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

export default function ProductCard({ product, added, onToggleAdd }) {
  const discount = Math.round((1 - product.price / product.mrp) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.imageBox}>
        <Text style={styles.emoji}>{product.emoji}</Text>
      </View>
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <View style={styles.ratingRow}>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{product.rating} ★</Text>
        </View>
        <Text style={styles.ratingCount}>({product.ratingCount})</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
        <Text style={styles.mrp}>₹{product.mrp.toLocaleString('en-IN')}</Text>
      </View>
      <Text style={styles.discount}>{discount}% off</Text>
      <Text style={styles.unit} numberOfLines={1}>{product.unit}</Text>
      <TouchableOpacity
        style={[styles.addBtn, added && styles.addedBtn]}
        onPress={() => onToggleAdd(product)}
        activeOpacity={0.8}
      >
        <Text style={[styles.addBtnText, added && styles.addedBtnText]}>{added ? 'Added ✓' : 'Add'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border, elevation: 2 },
  imageBox: { height: 84, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emoji: { fontSize: 40 },
  name: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, minHeight: 34 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  ratingBadge: { backgroundColor: colors.success, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  ratingCount: { fontSize: 11, color: colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  mrp: { fontSize: 12, color: colors.textSecondary, textDecorationLine: 'line-through' },
  discount: { fontSize: 12, fontWeight: '700', color: colors.success, marginTop: 2 },
  unit: { fontSize: 11, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  addBtn: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10, paddingVertical: 6, alignItems: 'center' },
  addedBtn: { backgroundColor: colors.primary },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  addedBtnText: { color: '#fff' },
});
