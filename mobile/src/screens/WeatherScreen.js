import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { farmsAPI, weatherAPI } from '../api';
import { colors } from '../utils/theme';

const WEATHER_EMOJI = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Thunderstorm: '⛈️', Drizzle: '🌦️', Snow: '❄️', Haze: '🌫️', Mist: '🌫️' };

export default function WeatherScreen() {
  const [farmId, setFarmId] = useState('');

  const { data: farmsData, isLoading: farmsLoading } = useQuery({ queryKey: ['farms'], queryFn: () => farmsAPI.getAll().then((r) => r.data) });
  const farms = farmsData?.farms || [];

  useEffect(() => { if (farms.length > 0 && !farmId) setFarmId(String(farms[0].id)); }, [farms]);

  const { data: currentData, isLoading, refetch } = useQuery({
    queryKey: ['weather-current', farmId],
    queryFn: () => weatherAPI.getCurrent(farmId).then((r) => r.data),
    enabled: !!farmId,
    retry: false,
  });

  const { data: forecastData, isLoading: fl } = useQuery({
    queryKey: ['weather-forecast', farmId],
    queryFn: () => weatherAPI.getForecast(farmId).then((r) => r.data),
    enabled: !!farmId,
    retry: false,
  });

  const weather = currentData?.weather;
  const forecast = forecastData?.forecast || [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.primary]} />}>
      {farms.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.farmPicker}>
          {farms.map((f) => (
            <View key={f.id} style={[styles.farmChip, String(farmId) === String(f.id) && styles.farmChipActive]}>
              <Text onPress={() => setFarmId(String(f.id))} style={{ color: String(farmId) === String(f.id) ? '#fff' : colors.textPrimary, fontSize: 13 }}>{f.name}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {farmsLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : farms.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content><Text style={styles.empty}>No farms yet. Add a farm with a location to see weather.</Text></Card.Content>
        </Card>
      ) : !farmId || isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : !weather ? (
        <Card style={styles.card}>
          <Card.Content><Text style={styles.empty}>Weather unavailable. Make sure this farm has GPS coordinates set, then pull down to refresh.</Text></Card.Content>
        </Card>
      ) : (
        <>
          <View style={styles.currentBox}>
            <Text style={styles.weatherEmoji}>{WEATHER_EMOJI[weather.condition] || '🌤️'}</Text>
            <Text style={styles.tempText}>{Math.round(weather.temperature)}°C</Text>
            <Text style={styles.condText}>{weather.description}</Text>
            <Text style={styles.cityText}>📍 {weather.city}</Text>
            <View style={styles.statsRow}>
              {[['💧', `${weather.humidity}%`, 'Humidity'], ['💨', `${Math.round(weather.wind_speed)} km/h`, 'Wind'], ['🌡️', `${Math.round(weather.feels_like)}°C`, 'Feels like'], ['🌧️', `${weather.rainfall} mm`, 'Rainfall']].map(([emoji, val, label]) => (
                <View key={label} style={styles.statBox}>
                  <Text style={styles.statEmoji}>{emoji}</Text>
                  <Text style={styles.statVal}>{val}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.aiBox}>
              <Text style={styles.aiText}>{weather.suggestion}</Text>
              <View style={styles.chipRow}>
                <Chip compact icon={weather.irrigation_advised ? 'water' : 'water-off'} style={{ backgroundColor: weather.irrigation_advised ? '#1565c020' : '#43a04720' }}>
                  {weather.irrigation_advised ? 'Irrigate Today' : 'No Irrigation'}
                </Chip>
                <Chip compact icon={weather.spray_advised ? 'spray' : 'cancel'} style={{ backgroundColor: weather.spray_advised ? '#43a04720' : '#f57f1720' }}>
                  {weather.spray_advised ? 'OK to Spray' : 'No Spray'}
                </Chip>
              </View>
            </View>
          </View>

          <Card style={styles.card}>
            <Card.Title title="7-Day Forecast" />
            <Card.Content>
              {fl ? <ActivityIndicator color={colors.primary} /> : (
                forecast.map((day) => (
                  <View key={day.date} style={styles.forecastRow}>
                    <Text style={styles.forecastDate}>{new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
                    <Text style={styles.forecastEmoji}>{WEATHER_EMOJI[day.condition] || '🌤️'}</Text>
                    <Text style={styles.forecastTemp}>{Math.round(day.temp_min)}° – {Math.round(day.temp_max)}°C</Text>
                    {day.rainfall > 1 && <Chip compact style={{ marginLeft: 4 }} textStyle={{ fontSize: 10 }}>{Math.round(day.rainfall)}mm</Chip>}
                    {!day.spray_advised && <Chip compact style={{ marginLeft: 4, backgroundColor: '#f57f1720' }} textStyle={{ fontSize: 10 }}>No Spray</Chip>}
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        </>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  farmPicker: { padding: 12, maxHeight: 60 },
  farmChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.surface },
  farmChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  currentBox: { backgroundColor: colors.primary, padding: 24, alignItems: 'center' },
  weatherEmoji: { fontSize: 64, marginBottom: 8 },
  tempText: { fontSize: 64, fontWeight: '700', color: '#fff' },
  condText: { fontSize: 18, color: 'rgba(255,255,255,0.85)', textTransform: 'capitalize' },
  cityText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
  statBox: { alignItems: 'center' },
  statEmoji: { fontSize: 20 },
  statVal: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  aiBox: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, width: '100%' },
  aiText: { color: '#fff', textAlign: 'center', marginBottom: 10 },
  chipRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  card: { margin: 12, marginTop: 12, borderRadius: 12 },
  forecastRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  forecastDate: { width: 90, fontSize: 12, color: colors.textSecondary },
  forecastEmoji: { fontSize: 20, marginRight: 8 },
  forecastTemp: { flex: 1, fontWeight: '500' },
  empty: { color: colors.textSecondary, textAlign: 'center' },
});
