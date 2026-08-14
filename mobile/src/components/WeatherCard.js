import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { colors } from '../utils/theme';

const WEATHER_EMOJI = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Thunderstorm: '⛈️', Drizzle: '🌦️', Snow: '❄️', Haze: '🌫️', Mist: '🌫️' };

export default function WeatherCard({ weather }) {
  if (!weather || !Number.isFinite(weather.temperature)) {
    return (
      <View style={styles.fallbackCard}>
        <Text style={styles.fallbackEmoji}>🌦️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.fallbackTitle}>Weather unavailable</Text>
          <Text style={styles.fallbackSub}>Couldn't fetch today's weather. Pull down to refresh.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.emoji}>{WEATHER_EMOJI[weather.condition] || '🌤️'}</Text>
        <View style={styles.tempBlock}>
          <Text style={styles.temp}>{Math.round(weather.temperature)}°</Text>
          <Text style={styles.desc}>{weather.description}</Text>
          <Text style={styles.farm}>📍 {weather.farm_name}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>💧</Text>
          <Text style={styles.statVal}>{weather.humidity}%</Text>
          <Text style={styles.statLabel}>Humidity</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>💨</Text>
          <Text style={styles.statVal}>{weather.wind_speed} km/h</Text>
          <Text style={styles.statLabel}>Wind</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>🌧️</Text>
          <Text style={styles.statVal}>{weather.rainfall} mm</Text>
          <Text style={styles.statLabel}>Rainfall</Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <Chip compact icon={weather.irrigation_advised ? 'water' : 'water-off'} style={{ backgroundColor: weather.irrigation_advised ? '#1565c020' : '#43a04720' }}>
          {weather.irrigation_advised ? 'Irrigate Today' : 'No Irrigation'}
        </Chip>
        <Chip compact icon={weather.spray_advised ? 'spray' : 'cancel'} style={{ backgroundColor: weather.spray_advised ? '#43a04720' : '#f57f1720' }}>
          {weather.spray_advised ? 'OK to Spray' : 'No Spray'}
        </Chip>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  fallbackEmoji: { fontSize: 32 },
  fallbackTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  fallbackSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.primary, borderRadius: 16, marginBottom: 12, padding: 16, elevation: 3 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  emoji: { fontSize: 44 },
  tempBlock: { flex: 1 },
  temp: { fontSize: 40, fontWeight: '800', color: '#fff', lineHeight: 44 },
  desc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, textTransform: 'capitalize', fontWeight: '500' },
  farm: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 10, marginBottom: 12 },
  statBox: { alignItems: 'center' },
  statEmoji: { fontSize: 16, marginBottom: 2 },
  statVal: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 1 },
  chipRow: { flexDirection: 'row', gap: 8 },
});
