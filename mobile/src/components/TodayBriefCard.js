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

export default function TodayBriefCard({ brief = [], weather }) {
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
      {/* Weather strip */}
      {weather && (
        <View style={styles.weatherStrip}>
          <View style={styles.weatherLeft}>
            <Text style={styles.tempBig}>{weather.temperature}°</Text>
            <View>
              <Text style={styles.weatherDesc}>{weather.description}</Text>
              <Text style={styles.weatherFarm}>📍 {weather.farm_name}</Text>
            </View>
          </View>
          <View style={styles.weatherRight}>
            <Text style={styles.weatherStat}>💧 {weather.humidity}%</Text>
            <Text style={styles.weatherStat}>💨 {weather.wind_speed} km/h</Text>
            {weather.rainfall > 0 && <Text style={styles.weatherStat}>🌧️ {weather.rainfall} mm</Text>}
          </View>
        </View>
      )}

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
  weatherStrip: { backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  weatherLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tempBig: { fontSize: 52, fontWeight: '800', color: '#fff' },
  weatherDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, textTransform: 'capitalize', fontWeight: '500' },
  weatherFarm: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  weatherRight: { alignItems: 'flex-end', gap: 4 },
  weatherStat: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
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
