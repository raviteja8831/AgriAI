import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

export default function CategoryPreviewCard({ emoji, title, items = [], onSeeAll }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{emoji} {title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Nothing here yet</Text>
      ) : (
        items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemDot}>•</Text>
            <Text style={styles.itemText} numberOfLines={1}>{item}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  seeAll: { fontSize: 12, fontWeight: '600', color: colors.info },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  itemDot: { color: colors.primary, fontSize: 14 },
  itemText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  emptyText: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
});
