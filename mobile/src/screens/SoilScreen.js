import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, FAB, Modal, Portal, TextInput, ActivityIndicator, ProgressBar, Chip } from 'react-native-paper';
import { useSnackbar } from '../components/SnackbarProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmsAPI, soilAPI } from '../api';
import { colors } from '../utils/theme';

const EMPTY = { ph: '', nitrogen_kg_ha: '', phosphorus_kg_ha: '', potassium_kg_ha: '', organic_carbon_percent: '', moisture_percent: '', report_date: new Date().toISOString().split('T')[0], lab_name: '' };

export default function SoilScreen() {
  const qc = useQueryClient();
  const snack = useSnackbar();
  const [farmId, setFarmId] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: farmsData } = useQuery({ queryKey: ['farms'], queryFn: () => farmsAPI.getAll().then((r) => r.data) });
  const farms = farmsData?.farms || [];

  useEffect(() => { if (farms.length > 0 && !farmId) setFarmId(String(farms[0].id)); }, [farms]);

  const { data: reportsData, isLoading } = useQuery({ queryKey: ['soil', farmId], queryFn: () => soilAPI.getAll(farmId).then((r) => r.data), enabled: !!farmId });
  const reports = reportsData?.reports || [];

  const createMut = useMutation({
    mutationFn: (data) => soilAPI.create(farmId, data),
    onSuccess: () => { qc.invalidateQueries(['soil', farmId]); setModal(false); setForm(EMPTY); snack.showSuccess('Soil report saved!'); },
  });

  const set = (f) => (v) => setForm((p) => ({ ...p, [f]: v }));

  const phColor = (ph) => ph < 6 ? colors.error : ph <= 7.5 ? colors.success : colors.warning;
  const phLabel = (ph) => ph < 6 ? 'Acidic' : ph <= 7.5 ? 'Optimal' : 'Alkaline';

  return (
    <View style={styles.container}>
      {farms.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.farmPicker}>
          {farms.map((f) => (
            <View key={f.id} style={[styles.farmChip, String(farmId) === String(f.id) && styles.farmChipActive]}>
              <Text onPress={() => setFarmId(String(f.id))} style={{ color: String(farmId) === String(f.id) ? '#fff' : colors.textPrimary, fontSize: 13 }}>{f.name}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🧪</Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>No soil reports</Text>
            <Button mode="contained" style={styles.emptyBtn} onPress={() => setModal(true)}>Add Soil Report</Button>
          </View>
        ) : (
          reports.map((r) => {
            const crops = typeof r.suitable_crops === 'string' ? JSON.parse(r.suitable_crops || '[]') : (r.suitable_crops || []);
            return (
              <Card key={r.id} style={styles.card}>
                <Card.Title title={`Report — ${r.report_date}`} subtitle={r.lab_name || ''} />
                <Card.Content>
                  <View style={styles.phRow}>
                    <Text style={styles.phLabel}>pH: <Text style={{ color: phColor(r.ph), fontWeight: '700' }}>{r.ph}</Text></Text>
                    <Text style={{ color: phColor(r.ph), fontSize: 12 }}>{phLabel(r.ph)}</Text>
                  </View>
                  <ProgressBar progress={Math.min(1, Math.max(0, (r.ph - 4) / 6))} color={phColor(r.ph)} style={styles.phBar} />

                  <View style={styles.nutrientGrid}>
                    {[['N', r.nitrogen_kg_ha, 'kg/ha', 200, 400], ['P', r.phosphorus_kg_ha, 'kg/ha', 10, 25], ['K', r.potassium_kg_ha, 'kg/ha', 100, 280], ['OC', r.organic_carbon_percent, '%', 0.5, 1]].map(([label, val, unit, low, high]) => (
                      <View key={label} style={styles.nutrientBox}>
                        <Text style={styles.nutrientLabel}>{label}</Text>
                        <Text style={styles.nutrientVal}>{val ?? 'N/A'}</Text>
                        <Text style={styles.nutrientUnit}>{unit}</Text>
                        {val && <Text style={{ fontSize: 10, color: val < low ? colors.error : val > high ? colors.warning : colors.success }}>{val < low ? '↓Low' : val > high ? '↑High' : '✓OK'}</Text>}
                      </View>
                    ))}
                  </View>

                  {r.ai_recommendation && (
                    <View style={styles.aiBox}>
                      <Text style={styles.aiTitle}>🤖 AI Recommendation</Text>
                      <Text style={styles.aiText}>{r.ai_recommendation}</Text>
                    </View>
                  )}

                  {crops.length > 0 && (
                    <View style={styles.cropsBox}>
                      <Text style={styles.aiTitle}>✅ Suitable Crops</Text>
                      <View style={styles.cropChips}>
                        {crops.map((c) => <Chip key={c} compact style={styles.cropChip}>{c}</Chip>)}
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB icon="plus" label="Add Report" style={styles.fab} onPress={() => setModal(true)} />

      <Portal>
        <Modal visible={modal} onDismiss={() => setModal(false)} contentContainerStyle={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>Add Soil Report</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {[['pH (4–10)', 'ph', 'decimal-pad'], ['Nitrogen (kg/ha)', 'nitrogen_kg_ha', 'decimal-pad'], ['Phosphorus (kg/ha)', 'phosphorus_kg_ha', 'decimal-pad'], ['Potassium (kg/ha)', 'potassium_kg_ha', 'decimal-pad'], ['Organic Carbon (%)', 'organic_carbon_percent', 'decimal-pad'], ['Moisture (%)', 'moisture_percent', 'decimal-pad'], ['Report Date', 'report_date', 'default'], ['Lab Name', 'lab_name', 'default']].map(([label, key, kb]) => (
              <TextInput key={key} label={label} value={form[key]} onChangeText={set(key)} keyboardType={kb} mode="outlined" style={styles.input} />
            ))}
            <View style={styles.modalBtns}>
              <Button mode="outlined" onPress={() => setModal(false)} style={[styles.btn, { flex: 1, marginRight: 8 }]}>Cancel</Button>
              <Button mode="contained" loading={createMut.isPending} onPress={() => createMut.mutate(form)} style={[styles.btn, { flex: 1 }]}>Save Report</Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  farmPicker: { maxHeight: 56, padding: 10 },
  farmChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.surface },
  farmChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  scroll: { padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  card: { marginBottom: 16, borderRadius: 12 },
  phRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  phLabel: { fontSize: 14 },
  phBar: { height: 8, borderRadius: 4, marginBottom: 12 },
  nutrientGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  nutrientBox: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: colors.background, borderRadius: 8, marginHorizontal: 2 },
  nutrientLabel: { fontWeight: '700', color: colors.primary, fontSize: 14 },
  nutrientVal: { fontWeight: '600', fontSize: 16 },
  nutrientUnit: { fontSize: 10, color: colors.textSecondary },
  aiBox: { backgroundColor: '#1565c015', borderRadius: 8, padding: 10, marginBottom: 8 },
  aiTitle: { fontWeight: '700', color: colors.info, marginBottom: 4, fontSize: 13 },
  aiText: { fontSize: 13, lineHeight: 18 },
  cropsBox: { marginTop: 4 },
  cropChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  cropChip: { backgroundColor: colors.success + '20' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontWeight: '700', marginBottom: 20 },
  emptyBtn: { borderRadius: 8, paddingHorizontal: 24 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: colors.primary },
  modal: { backgroundColor: colors.surface, margin: 16, padding: 20, borderRadius: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontWeight: '700', color: colors.primary },
  modalCancel: { color: colors.error, fontSize: 14, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', marginTop: 8 },
  input: { marginBottom: 10, backgroundColor: colors.surface },
  btn: { marginTop: 8, borderRadius: 8 },
});
