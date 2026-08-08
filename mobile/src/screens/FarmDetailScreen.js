import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { MapView, Marker } from '../components/PlatformMap';
import { useQuery } from '@tanstack/react-query';
import { farmsAPI, soilAPI, weatherAPI } from '../api';
import { colors } from '../utils/theme';

export default function FarmDetailScreen({ route, navigation }) {
  const { farmId } = route.params;

  const { data: farmData, isLoading } = useQuery({ queryKey: ['farm', farmId], queryFn: () => farmsAPI.getOne(farmId).then((r) => r.data) });
  const { data: soilData } = useQuery({ queryKey: ['soil-latest', farmId], queryFn: () => soilAPI.getLatest(farmId).then((r) => r.data) });
  const { data: weatherData } = useQuery({
    queryKey: ['weather-current', farmId],
    queryFn: () => weatherAPI.getCurrent(farmId).then((r) => r.data),
    enabled: !!farmData?.farm?.latitude,
    retry: false,
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  const farm = farmData?.farm;
  if (!farm) return <Text style={styles.error}>Farm not found</Text>;

  const weather = weatherData?.weather;
  const soil = soilData?.report;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.farmName}>{farm.name}</Text>
        <Text variant="bodyMedium" style={styles.farmLoc}>📍 {[farm.village, farm.district, farm.state].filter(Boolean).join(', ')}</Text>
        <View style={styles.badges}>
          <Chip icon="resize">{farm.area_acres} acres</Chip>
          <Chip icon="terrain" style={styles.chip}>{farm.soil_type}</Chip>
          <Chip icon="water" style={styles.chip}>{farm.irrigation_type?.replace('_', ' ')}</Chip>
        </View>
      </View>

      {farm.latitude && farm.longitude && (
        <Card style={styles.card}>
          <Card.Title title="Farm Location" />
          <Card.Content style={{ padding: 0 }}>
            <MapView
              style={styles.map}
              initialRegion={{ latitude: parseFloat(farm.latitude), longitude: parseFloat(farm.longitude), latitudeDelta: 0.02, longitudeDelta: 0.02 }}
              mapType="hybrid"
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker coordinate={{ latitude: parseFloat(farm.latitude), longitude: parseFloat(farm.longitude) }} title={farm.name} pinColor={colors.primary} />
            </MapView>
          </Card.Content>
        </Card>
      )}

      <View style={styles.row}>
        <Card style={[styles.halfCard, { marginRight: 8 }]}>
          <Card.Title title="🌤️ Weather" titleVariant="titleSmall" />
          <Card.Content>
            {weather ? (
              <>
                <Text variant="headlineMedium" style={styles.temp}>{Math.round(weather.temperature)}°C</Text>
                <Text style={styles.sub}>{weather.description}</Text>
                <Text style={styles.sub}>💧 {weather.humidity}%  💨 {Math.round(weather.wind_speed)} km/h</Text>
                <Chip compact style={styles.mt} textStyle={{ fontSize: 10 }}>{weather.irrigation_advised ? '💧 Irrigate' : '✅ No Irrigation'}</Chip>
              </>
            ) : <Text style={styles.sub}>Set GPS location to view</Text>}
          </Card.Content>
          <Card.Actions><Button compact onPress={() => navigation.navigate('Weather')}>Details</Button></Card.Actions>
        </Card>

        <Card style={styles.halfCard}>
          <Card.Title title="🧪 Soil" titleVariant="titleSmall" />
          <Card.Content>
            {soil ? (
              <>
                {[['pH', soil.ph], ['N (kg/ha)', soil.nitrogen_kg_ha], ['P (kg/ha)', soil.phosphorus_kg_ha], ['K (kg/ha)', soil.potassium_kg_ha]].map(([label, val]) => (
                  <View key={label} style={styles.soilRow}>
                    <Text style={styles.soilLabel}>{label}</Text>
                    <Text style={styles.soilVal}>{val ?? 'N/A'}</Text>
                  </View>
                ))}
              </>
            ) : <Text style={styles.sub}>No report yet</Text>}
          </Card.Content>
          <Card.Actions><Button compact onPress={() => navigation.navigate('Soil')}>Details</Button></Card.Actions>
        </Card>
      </View>

      <Card style={styles.card}>
        <Card.Title title="🌿 Crops" right={() => <Button compact onPress={() => navigation.navigate('Crops')}>Manage</Button>} />
        <Card.Content>
          {farm.crops?.length === 0 ? (
            <Text style={styles.sub}>No crops on this farm yet</Text>
          ) : (
            farm.crops?.map((crop) => (
              <TouchableOpacity key={crop.id} style={styles.cropItem} onPress={() => navigation.navigate('CropDetail', { cropId: crop.id })}>
                <Text style={styles.cropEmoji}>🌾</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{crop.crop_name}</Text>
                  <Text style={styles.sub}>{crop.area_acres} acres • {crop.season}</Text>
                </View>
                <Chip compact>{crop.status}</Chip>
              </TouchableOpacity>
            ))
          )}
        </Card.Content>
      </Card>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 20, textAlign: 'center' },
  header: { backgroundColor: colors.primary, padding: 20, paddingTop: 24 },
  farmName: { color: '#fff', fontWeight: '700' },
  farmLoc: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { marginLeft: 4 },
  card: { margin: 12, marginBottom: 0, borderRadius: 12 },
  map: { height: 220, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  row: { flexDirection: 'row', margin: 12, marginBottom: 0 },
  halfCard: { flex: 1, borderRadius: 12 },
  temp: { color: colors.primary, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  mt: { marginTop: 8 },
  soilRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  soilLabel: { color: colors.textSecondary, fontSize: 12 },
  soilVal: { fontWeight: '600', fontSize: 12 },
  cropItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  cropEmoji: { fontSize: 20, marginRight: 10 },
});
