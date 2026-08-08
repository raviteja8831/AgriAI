import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

const STAGE_COLOR = {
  'Germination':    '#81c784',
  'Tillering':      '#4caf50',
  'Seedling':       '#66bb6a',
  'Booting':        '#2e7d32',
  'Heading':        '#f57f17',
  'Flowering':      '#e91e63',
  'Squaring':       '#9c27b0',
  'Boll Formation': '#795548',
  'Vegetative':     '#388e3c',
  'Harvest Ready':  '#d32f2f',
  'default':        colors.primary,
};

function ProgressBar({ pct }) {
  const segments = 20;
  const filled = Math.round((pct / 100) * segments);
  return (
    <View style={pb.row}>
      {Array.from({ length: segments }).map((_, i) => (
        <View key={i} style={[pb.seg, { backgroundColor: i < filled ? colors.primary : colors.border }]} />
      ))}
    </View>
  );
}

export default function CropProgressCard({ crops = [], onCropPress }) {
  if (crops.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🌿 Your Crop Progress</Text>
      {crops.map((crop) => {
        const stageColor = STAGE_COLOR[crop.stage?.label] || STAGE_COLOR.default;
        const pct = crop.progress_pct ?? 0;
        const urgent = crop.near_harvest;
        return (
          <TouchableOpacity
            key={crop.id}
            style={[styles.cropRow, urgent && styles.cropRowUrgent]}
            onPress={() => onCropPress?.(crop.id)}
            activeOpacity={0.75}
          >
            {/* Crop name + stage */}
            <View style={styles.cropTop}>
              <View style={styles.cropLeft}>
                <Text style={styles.cropName}>{crop.name}</Text>
                <Text style={styles.cropFarm}>{crop.farm} · {crop.area} acres</Text>
              </View>
              <View style={[styles.stageBadge, { backgroundColor: stageColor + '20', borderColor: stageColor }]}>
                <Text style={styles.stageEmoji}>{crop.stage?.emoji || '🌱'}</Text>
                <Text style={[styles.stageLabel, { color: stageColor }]}>{crop.stage?.label || 'Growing'}</Text>
              </View>
            </View>

            {/* Progress bar */}
            {crop.progress_pct !== null && (
              <View style={styles.progressSection}>
                <ProgressBar pct={pct} />
                <View style={styles.progressStats}>
                  <Text style={styles.progressStat}>Day {crop.days_in} of {crop.total_days}</Text>
                  <Text style={[styles.progressStat, { fontWeight: '700', color: urgent ? colors.error : colors.primary }]}>
                    {crop.days_left === 0 ? '🎉 Harvest Now!' : `${crop.days_left} days to harvest`}
                  </Text>
                </View>
              </View>
            )}

            {/* Financials */}
            <View style={styles.finRow}>
              <View style={styles.finItem}>
                <Text style={styles.finLabel}>Spent</Text>
                <Text style={styles.finVal}>₹{crop.total_expenses.toLocaleString('en-IN')}</Text>
              </View>
              {crop.sowing_date && (
                <View style={styles.finItem}>
                  <Text style={styles.finLabel}>Sown on</Text>
                  <Text style={styles.finVal}>{new Date(crop.sowing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
              )}
              {crop.expected_harvest_date && (
                <View style={styles.finItem}>
                  <Text style={styles.finLabel}>Harvest by</Text>
                  <Text style={styles.finVal}>{new Date(crop.expected_harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
              )}
            </View>

            {/* Harvest alert */}
            {urgent && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>🌾 {crop.alert}</Text>
              </View>
            )}

            <Text style={styles.tapHint}>Tap to manage →</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pb = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  seg: { flex: 1, height: 8, borderRadius: 4 },
});

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, padding: 16, elevation: 3 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  cropRow: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10, backgroundColor: colors.background },
  cropRowUrgent: { borderColor: '#d32f2f', borderWidth: 2, backgroundColor: '#fff8f8' },
  cropTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cropLeft: { flex: 1 },
  cropName: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  cropFarm: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  stageBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  stageEmoji: { fontSize: 14 },
  stageLabel: { fontSize: 12, fontWeight: '700' },
  progressSection: { marginBottom: 8 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between' },
  progressStat: { fontSize: 12, color: colors.textSecondary },
  finRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  finItem: { flex: 1 },
  finLabel: { fontSize: 10, color: colors.textSecondary },
  finVal: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  alertBox: { backgroundColor: '#ffebee', borderRadius: 8, padding: 8, marginBottom: 6 },
  alertText: { fontSize: 13, color: '#c62828', fontWeight: '600' },
  tapHint: { fontSize: 11, color: colors.textSecondary, textAlign: 'right' },
});
