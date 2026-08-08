import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, FAB, Modal, Portal, TextInput, ActivityIndicator } from 'react-native-paper';
import { MapView, Marker } from '../components/PlatformMap';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmsAPI } from '../api';
import { useSnackbar } from '../components/SnackbarProvider';
import MESSAGES from '../config/messages.json';
import { colors } from '../utils/theme';

const IRRIGATION = ['rain_fed', 'canal', 'borewell', 'drip', 'sprinkler'];
const SOIL = ['clay', 'sandy', 'loamy', 'silt', 'black', 'red'];
const EMPTY = { name: '', village: '', district: '', state: '', area_acres: '', survey_number: '', irrigation_type: 'rain_fed', soil_type: 'loamy', latitude: '', longitude: '' };

export default function FarmsScreen({ navigation }) {
  const qc = useQueryClient();
  const snack = useSnackbar();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(0);

  const { data, isLoading } = useQuery({ queryKey: ['farms'], queryFn: () => farmsAPI.getAll().then((r) => r.data) });
  const farms = data?.farms || [];

  const createMut = useMutation({
    mutationFn: farmsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries(['farms']);
      closeModal();
      snack.showSuccess(MESSAGES.success.farmCreated);
    },
  });

  const deleteMut = useMutation({
    mutationFn: farmsAPI.remove,
    onSuccess: () => { qc.invalidateQueries(['farms']); snack.showSuccess(MESSAGES.success.farmDeleted); },
  });

  const set = (f) => (v) => setForm((p) => ({ ...p, [f]: v }));

  const closeModal = () => { setModalVisible(false); setForm(EMPTY); setStep(0); };

  const handleNext = () => {
    if (!form.name.trim()) { snack.showWarning('Please enter a farm name.'); return; }
    if (!form.area_acres) { snack.showWarning(MESSAGES.validation.area_acres); return; }
    setStep(1);
  };

  const handleGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { snack.showWarning(MESSAGES.warning.locationDenied); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setForm((p) => ({ ...p, latitude: loc.coords.latitude.toFixed(6), longitude: loc.coords.longitude.toFixed(6) }));
    snack.showSuccess('GPS location captured!');
  };

  const handleSave = () => {
    if (!form.name.trim()) { snack.showWarning('Please enter a farm name.'); return; }
    createMut.mutate(form);
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {farms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🏡</Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>No farms yet</Text>
            <Text style={styles.emptySub}>Add your first farm to get started</Text>
            <Button mode="contained" style={styles.emptyBtn} onPress={() => setModalVisible(true)}>Add Farm</Button>
          </View>
        ) : (
          farms.map((farm) => (
            <Card key={farm.id} style={styles.card} onPress={() => navigation.navigate('FarmDetail', { farmId: farm.id })}>
              <Card.Title title={farm.name} subtitle={[farm.village, farm.district, farm.state].filter(Boolean).join(', ')} left={() => <Text style={{ fontSize: 28 }}>🌾</Text>} />
              <Card.Content>
                <View style={styles.row}>
                  {[`${farm.area_acres} acres`, farm.soil_type, farm.irrigation_type?.replace('_', ' ')].map((t) => (
                    <Text key={t} style={styles.badge}>{t}</Text>
                  ))}
                </View>
                {farm.crops?.length > 0 && <Text style={styles.cropCount}>🌿 {farm.crops.length} active crop{farm.crops.length > 1 ? 's' : ''}</Text>}
              </Card.Content>
              <Card.Actions>
                <Button compact onPress={() => navigation.navigate('FarmDetail', { farmId: farm.id })}>View Details</Button>
                <Button compact textColor={colors.error} onPress={() => Alert.alert('Remove Farm', `Remove "${farm.name}"? This cannot be undone.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => deleteMut.mutate(farm.id) }])}>Remove</Button>
              </Card.Actions>
            </Card>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon="plus" label="Add Farm" style={styles.fab} onPress={() => setModalVisible(true)} />

      <Portal>
        <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modal}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>{step === 0 ? 'Farm Details' : 'Set Location'}</Text>
            <Button compact textColor={colors.error} onPress={closeModal}>Cancel</Button>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {step === 0 ? (
              <>
                <TextInput label="Farm Name *" value={form.name} onChangeText={set('name')} mode="outlined" style={styles.input} />
                <TextInput label="Survey Number" value={form.survey_number} onChangeText={set('survey_number')} mode="outlined" style={styles.input} />
                <TextInput label="Village" value={form.village} onChangeText={set('village')} mode="outlined" style={styles.input} />
                <TextInput label="District" value={form.district} onChangeText={set('district')} mode="outlined" style={styles.input} />
                <TextInput label="State" value={form.state} onChangeText={set('state')} mode="outlined" style={styles.input} />
                <TextInput label="Area (acres) *" value={form.area_acres} onChangeText={set('area_acres')} keyboardType="decimal-pad" mode="outlined" style={styles.input} />
                <Text style={styles.sectionLabel}>Irrigation Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {IRRIGATION.map((t) => (
                    <TouchableOpacity key={t} onPress={() => set('irrigation_type')(t)} style={[styles.chip, form.irrigation_type === t && styles.chipActive]}>
                      <Text style={{ color: form.irrigation_type === t ? '#fff' : colors.textPrimary, fontSize: 12 }}>{t.replace('_', ' ')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.sectionLabel}>Soil Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {SOIL.map((t) => (
                    <TouchableOpacity key={t} onPress={() => set('soil_type')(t)} style={[styles.chip, form.soil_type === t && styles.chipActive]}>
                      <Text style={{ color: form.soil_type === t ? '#fff' : colors.textPrimary, fontSize: 12 }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.btnRow}>
                  <Button mode="outlined" onPress={closeModal} style={{ flex: 1, marginRight: 8 }}>Cancel</Button>
                  <Button mode="contained" onPress={handleNext} style={{ flex: 1 }}>Next: Location →</Button>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.mapHint}>📍 Tap map or use GPS to mark your farm</Text>
                <MapView
                  style={styles.map}
                  initialRegion={{ latitude: form.latitude ? parseFloat(form.latitude) : 17.385, longitude: form.longitude ? parseFloat(form.longitude) : 78.487, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                  onPress={(e) => setForm((p) => ({ ...p, latitude: e.nativeEvent.coordinate.latitude.toFixed(6), longitude: e.nativeEvent.coordinate.longitude.toFixed(6) }))}
                  mapType="hybrid"
                >
                  {form.latitude && form.longitude && (
                    <Marker coordinate={{ latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) }} title={form.name} />
                  )}
                </MapView>
                <View style={styles.coordRow}>
                  <TextInput label="Latitude" value={form.latitude} onChangeText={set('latitude')} keyboardType="decimal-pad" mode="outlined" style={[styles.input, { flex: 1, marginRight: 6 }]} />
                  <TextInput label="Longitude" value={form.longitude} onChangeText={set('longitude')} keyboardType="decimal-pad" mode="outlined" style={[styles.input, { flex: 1 }]} />
                </View>
                <Button mode="outlined" icon="crosshairs-gps" onPress={handleGPS} style={styles.gpsBtn}>Use GPS</Button>
                <View style={styles.btnRow}>
                  <Button mode="outlined" onPress={() => setStep(0)} style={{ flex: 1, marginRight: 8 }}>← Back</Button>
                  <Button mode="contained" loading={createMut.isPending} disabled={createMut.isPending} onPress={handleSave} style={{ flex: 1 }}>Save Farm</Button>
                </View>
                <Button mode="text" textColor={colors.error} onPress={closeModal} style={{ marginTop: 4 }}>Cancel</Button>
              </>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 12, borderRadius: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  badge: { backgroundColor: colors.primaryLight + '30', color: colors.primaryDark, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, fontSize: 11 },
  cropCount: { color: colors.success, fontSize: 12, marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontWeight: '700', marginBottom: 8 },
  emptySub: { color: colors.textSecondary, marginBottom: 20 },
  emptyBtn: { borderRadius: 8, paddingHorizontal: 24 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: colors.primary },
  modal: { backgroundColor: colors.surface, margin: 16, padding: 20, borderRadius: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontWeight: '700', color: colors.primary },
  input: { marginBottom: 10, backgroundColor: colors.surface },
  sectionLabel: { color: colors.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  chipScroll: { marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnRow: { flexDirection: 'row', marginTop: 8 },
  map: { height: 220, borderRadius: 12, marginBottom: 10 },
  mapHint: { color: colors.textSecondary, marginBottom: 8, textAlign: 'center', fontSize: 13 },
  coordRow: { flexDirection: 'row' },
  gpsBtn: { marginBottom: 10, borderRadius: 8 },
});
