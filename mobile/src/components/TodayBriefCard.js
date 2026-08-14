import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

const TYPE_STYLE = {
  action:  { bg: '#e8f5e9', border: colors.success,  icon_bg: colors.success },
  warning: { bg: '#fff8e1', border: colors.warning,  icon_bg: colors.warning },
  info:    { bg: '#e3f2fd', border: colors.info,     icon_bg: colors.info },
  success: { bg: '#e8f5e9', border: colors.success,  icon_bg: colors.success },
  pest:    { bg: '#fce4ec', border: colors.error,    icon_bg: colors.error },
  harvest: { bg: '#f3e5f5', border: '#7b1fa2',       icon_bg: '#7b1fa2' },
};

export default function TodayBriefCard({ brief = [] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? brief : brief.slice(0, 3);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good Morning', emoji: '🌅' };
    if (h < 17) return { text: 'Good Afternoon', emoji: '☀️' };
    return { text: 'Good Evening', emoji: '🌙' };
  };
  const { text: greet, emoji: greetEmoji } = getGreeting();

  return (
    <View style={styles.card}>
      {/* Today's actions */}
      <View style={styles.briefHeader}>
        <Text style={styles.briefTitle}>{greetEmoji} {greet} — Here's your plan today</Text>
      </View>

      {brief.length === 0 ? (
        <View style={styles.allGood}>
          <Text style={styles.allGoodEmoji}>✅</Text>
          <Text style={styles.allGoodText}>All good today! No urgent tasks.</Text>
        </View>
      ) : (
        <>
          {visible.map((item, idx) => {
            const s = TYPE_STYLE[item.type] || TYPE_STYLE.info;
            return (
              <View key={idx} style={[styles.briefItem, { backgroundColor: s.bg, borderLeftColor: s.border }]}>
                <View style={[styles.iconBox, { backgroundColor: s.border }]}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <Text style={styles.briefText}>{item.text}</Text>
              </View>
            );
          })}
          {brief.length > 3 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.moreBtn}>
              <Text style={styles.moreText}>{expanded ? '▲ Show less' : `▼ ${brief.length - 3} more tips`}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', elevation: 3 },
  briefHeader: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 },
  briefTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  briefItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8, borderRadius: 10, borderLeftWidth: 4, paddingVertical: 10, paddingRight: 12, gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  iconText: { fontSize: 16 },
  briefText: { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  allGood: { alignItems: 'center', paddingVertical: 20 },
  allGoodEmoji: { fontSize: 40 },
  allGoodText: { color: colors.success, fontWeight: '600', marginTop: 8 },
  moreBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 4 },
  moreText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
