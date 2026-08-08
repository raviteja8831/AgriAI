import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Modal, Portal, TextInput, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cropsAPI, farmsAPI } from '../api';
import { useSnackbar } from '../components/SnackbarProvider';
import MESSAGES from '../config/messages.json';
import { colors } from '../utils/theme';

const SEASONS = ['kharif', 'rabi', 'zaid', 'annual'];
const STATUS_COLOR = { planned: colors.textSecondary, sowing: colors.info, growing: colors.success, flowering: colors.warning, harvesting: colors.secondary, harvested: '#888', failed: colors.error };
const STATUS_EMOJI = { planned: '📋', sowing: '🌱', growing: '🌿', flowering: '🌸', harvesting: '⚙️', harvested: '✅', failed: '❌' };
const EMPTY = { farm_id: '', crop_name: '', crop_variety: '', season: 'kharif', sowing_date: '', expected_harvest_date: '', area_acres: '' };

export default function CropsScreen({ navigation }) {
  const qc = useQueryClient();
  const snack = useSnackbar();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: cropsData, isLoading } = useQuery({ queryKey: ['crops'], queryFn: () => cropsAPI.getAll().then((r) => r.data) });
  const { data: farmsData } = useQuery({ queryKey: ['farms'], queryFn: () => farmsAPI.getAll().then((r) => r.data) });

  const createMut = useMutation({
    mutationFn: cropsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries(['crops']);
      closeModal();
      snack.showSuccess(MESSAGES.success.cropAdded);
    },
  });

  const crops = cropsData?.crops || [];
  const farms = farmsData?.farms || [];
  const set = (f) => (v) => setForm((p) => ({ ...p, [f]: v }));
  const closeModal = () => { setModalVisible(false); setForm(EMPTY); };

  const handleAdd = () => {
    if (!form.farm_id) { snack.showWarning(MESSAGES.validation.farm_id); return; }
    if (!form.crop_name.trim()) { snack.showWarning(MESSAGES.validation.crop_name); return; }
    createMut.mutate(form);
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {crops.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🌾</Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>No crops yet</Text>
            <Button mode="contained" style={styles.emptyBtn} onPress={() => setModalVisible(true)}>Add Crop</Button>
          </View>
        ) : (
          crops.map((crop) => (
            <Card key={crop.id} style={styles.card} onPress={() => navigation.navigate('CropDetail', { cropId: crop.id })}>
              <Card.Title
                title={crop.crop_name}
                subtitle={`${crop.farm?.name} • ${crop.area_acres || '?'} acres`}
                left={() => <Text style={{ fontSize: 28 }}>{STATUS_EMOJI[crop.status] || '🌾'}</Text>}
                right={() => (
                  <Chip compact style={{ marginRight: 8, backgroundColor: STATUS_COLOR[crop.status] + '20' }}>
                    <Text style={{ fontSize: 10, color: STATUS_COLOR[crop.status] }}>{crop.status}</Text>
                  </Chip>
                )}
              />
              <Card.Content>
                <View style={styles.tagRow}>
                  <Text style={styles.tag}>{crop.season}</Text>
                  {crop.crop_variety && <Text style={styles.tag}>{crop.crop_variety}</Text>}
                  {crop.sowing_date && <Text style={styles.tag}>Sown: {crop.sowing_date}</Text>}
                </View>
                {crop.harvest && (
                  <View style={styles.harvestBanner}>
                    <Text style={styles.harvestText}>✅ Yield: {crop.harvest.yield_kg}kg  |  Profit: ₹{parseFloat(crop.harvest.profit_loss || 0).toLocaleString('en-IN')}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon="plus" label="Add Crop" style={styles.fab} onPress={() => setModalVisible(true)} />

      <Portal>
        <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modal}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>Add New Crop</Text>
            <Button compact textColor={colors.error} onPress={closeModal}>Cancel</Button>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Select Farm *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {farms.length === 0
                ? <Text style={styles.noFarms}>No farms yet — add a farm first.</Text>
                : farms.map((f) => (
                    <TouchableOpacity key={f.id} onPress={() => set('farm_id')(f.id)} style={[styles.chip, String(form.farm_id) === String(f.id) && styles.chipActive]}>
                      <Text style={{ color: String(form.farm_id) === String(f.id) ? '#fff' : colors.textPrimary, fontSize: 12 }}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
            </ScrollView>
            <TextInput label="Crop Name *" value={form.crop_name} onChangeText={set('crop_name')} mode="outlined" style={styles.input} />
            <TextInput label="Variety (optional)" value={form.crop_variety} onChangeText={set('crop_variety')} mode="outlined" style={styles.input} />
            <Text style={styles.label}>Season</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {SEASONS.map((s) => (
                <TouchableOpacity key={s} onPress={() => set('season')(s)} style={[styles.chip, form.season === s && styles.chipActive]}>
                  <Text style={{ color: form.season === s ? '#fff' : colors.textPrimary, fontSize: 12 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput label="Area (acres)" value={form.area_acres} onChangeText={set('area_acres')} keyboardType="decimal-pad" mode="outlined" style={styles.input} />
            <TextInput label="Sowing Date (YYYY-MM-DD)" value={form.sowing_date} onChangeText={set('sowing_date')} mode="outlined" style={styles.input} />
            <TextInput label="Expected Harvest (YYYY-MM-DD)" value={form.expected_harvest_date} onChangeText={set('expected_harvest_date')} mode="outlined" style={styles.input} />
            <View style={styles.btnRow}>
              <Button mode="outlined" onPress={closeModal} style={{ flex: 1, marginRight: 8 }}>Cancel</Button>
              <Button mode="contained" loading={createMut.isPending} disabled={createMut.isPending} onPress={handleAdd} style={{ flex: 1 }}>Add Crop</Button>
            </View>
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 11, color: colors.textSecondary, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  harvestBanner: { marginTop: 8, backgroundColor: colors.success + '15', borderRadius: 8, padding: 6 },
  harvestText: { fontSize: 12, color: colors.success },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontWeight: '700', marginBottom: 20 },
  emptyBtn: { borderRadius: 8, paddingHorizontal: 24 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: colors.primary },
  modal: { backgroundColor: colors.surface, margin: 16, padding: 20, borderRadius: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontWeight: '700', color: colors.primary },
  label: { color: colors.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '600' },
  noFarms: { color: colors.error, padding: 8 },
  input: { marginBottom: 10, backgroundColor: colors.surface },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnRow: { flexDirection: 'row', marginTop: 8, marginBottom: 8 },
});
