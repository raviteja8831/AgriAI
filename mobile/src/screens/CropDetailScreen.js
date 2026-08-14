import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, Text as RNText } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Modal, Portal, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useSnackbar } from '../components/SnackbarProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cropsAPI, calendarAPI, expensesAPI, harvestAPI, imagesAPI } from '../api';
import { colors } from '../utils/theme';
import { BASE_URL } from '../utils/api';

const EXPENSE_CATS = ['seeds', 'fertilizer', 'pesticide', 'labour', 'machinery', 'irrigation', 'transport', 'other'];
const TASK_EMOJI = { land_preparation: '⛏️', sowing: '🌱', fertilizer: '🧪', irrigation: '💧', pesticide: '🛡️', weeding: '✂️', harvesting: '⚙️', other: '📌' };

export default function CropDetailScreen({ route, navigation }) {
  const { cropId } = route.params;
  const qc = useQueryClient();
  const snack = useSnackbar();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => { navigation.navigate('Dashboard'); navigation.openDrawer(); }}
          style={{ paddingHorizontal: 16 }}
        >
          <RNText style={{ color: '#fff', fontSize: 22 }}>☰</RNText>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  const [tab, setTab] = useState('calendar');
  const [expModal, setExpModal] = useState(false);
  const [harvestModal, setHarvestModal] = useState(false);
  const [expForm, setExpForm] = useState({ category: 'other', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0] });
  const [harvestForm, setHarvestForm] = useState({ yield_kg: '', market_price_per_kg: '', harvest_date: new Date().toISOString().split('T')[0], quality_grade: 'A', sold_to: '' });

  const { data: cropData, isLoading } = useQuery({ queryKey: ['crop', cropId], queryFn: () => cropsAPI.getOne(cropId).then((r) => r.data) });
  const { data: calData, refetch: refetchCal } = useQuery({ queryKey: ['calendar', cropId], queryFn: () => calendarAPI.getCropCalendar(cropId).then((r) => r.data) });
  const { data: imgData, refetch: refetchImg } = useQuery({ queryKey: ['images', cropId], queryFn: () => imagesAPI.getAll(cropId).then((r) => r.data) });
  const { data: expData, refetch: refetchExp } = useQuery({ queryKey: ['expenses', cropId], queryFn: () => expensesAPI.getAll(cropId).then((r) => r.data) });
  const { data: harvestData, refetch: refetchHarvest } = useQuery({ queryKey: ['harvest', cropId], queryFn: () => harvestAPI.get(cropId).then((r) => r.data) });

  const genCalMut = useMutation({ mutationFn: () => calendarAPI.generate(cropId), onSuccess: () => { refetchCal(); snack.showSuccess('Calendar generated!'); } });
  const updateTaskMut = useMutation({ mutationFn: ({ id, data }) => calendarAPI.updateTask(id, data), onSuccess: () => refetchCal() });
  const addExpMut = useMutation({ mutationFn: (data) => expensesAPI.create(cropId, data), onSuccess: () => { refetchExp(); setExpModal(false); snack.showSuccess('Expense added'); } });
  const saveHarvestMut = useMutation({ mutationFn: (data) => harvestAPI.save(cropId, data), onSuccess: () => { refetchHarvest(); qc.invalidateQueries(['crop', cropId]); setHarvestModal(false); snack.showSuccess('Harvest recorded!'); } });
  const delImgMut = useMutation({ mutationFn: imagesAPI.remove, onSuccess: () => refetchImg() });
  const delExpMut = useMutation({ mutationFn: expensesAPI.remove, onSuccess: () => refetchExp() });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return snack.showWarning('Permission denied — please allow photo access in Settings');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const fd = new FormData();
    fd.append('image', { uri: asset.uri, type: 'image/jpeg', name: 'crop.jpg' });
    try {
      await imagesAPI.upload(cropId, fd);
      refetchImg();
      snack.showSuccess('Photo uploaded!');
    } catch { /* axios interceptor handles error snackbar */ }
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  const crop = cropData?.crop;
  if (!crop) return <Text style={{ padding: 20 }}>Crop not found</Text>;

  const tasks = calData?.tasks || [];
  const images = imgData?.images || [];
  const expenses = expData?.expenses || [];
  const totalExp = expData?.total || 0;
  const harvest = harvestData?.harvest;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.cropName}>{crop.crop_name}</Text>
        <Text style={styles.cropSub}>{crop.farm?.name} • {crop.area_acres} acres • {crop.season}</Text>
        <View style={styles.chips}>
          <Chip compact style={styles.statusChip}>{crop.status}</Chip>
          {crop.sowing_date && <Chip compact style={styles.statusChip}>Sown: {crop.sowing_date}</Chip>}
        </View>
      </View>

      {harvest && (
        <View style={styles.harvestBanner}>
          <Text style={styles.harvestTitle}>🎉 Harvested</Text>
          <View style={styles.harvestRow}>
            <View style={styles.harvestStat}><Text style={styles.harvestVal}>{harvest.yield_kg}kg</Text><Text style={styles.harvestLabel}>Yield</Text></View>
            <View style={styles.harvestStat}><Text style={styles.harvestVal}>₹{parseFloat(harvest.total_revenue || 0).toLocaleString()}</Text><Text style={styles.harvestLabel}>Revenue</Text></View>
            <View style={[styles.harvestStat, { borderRightWidth: 0 }]}><Text style={[styles.harvestVal, { color: harvest.profit_loss >= 0 ? colors.success : colors.error }]}>₹{parseFloat(harvest.profit_loss || 0).toLocaleString()}</Text><Text style={styles.harvestLabel}>Profit</Text></View>
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        {[['calendar', '📅 Calendar'], ['images', '📷 Photos'], ['expenses', '💰 Expenses'], ['harvest', '🌾 Harvest']].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {tab === 'calendar' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.tabCount}>{tasks.filter((t) => t.status === 'completed').length}/{tasks.length} done</Text>
              <Button compact mode="outlined" loading={genCalMut.isPending} onPress={() => genCalMut.mutate()}>{tasks.length > 0 ? 'Regenerate' : 'Generate Calendar'}</Button>
            </View>
            {tasks.length === 0 && <Text style={styles.empty}>Generate a calendar to see tasks</Text>}
            {tasks.map((task) => (
              <TouchableOpacity key={task.id} style={[styles.taskItem, task.status === 'completed' && styles.taskDone]} onPress={() => updateTaskMut.mutate({ id: task.id, data: { status: task.status === 'completed' ? 'pending' : 'completed' } })}>
                <Text style={styles.taskEmoji}>{task.status === 'completed' ? '✅' : (TASK_EMOJI[task.task_type] || '📌')}</Text>
                <View style={styles.taskText}>
                  <Text style={[styles.taskName, task.status === 'completed' && styles.strikethrough]}>{task.task_name}</Text>
                  <Text style={styles.taskDate}>{task.scheduled_date} • {task.task_type?.replace('_', ' ')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'images' && (
          <View>
            <Button icon="camera" mode="outlined" onPress={handlePickImage} style={styles.mb}>Upload Photo</Button>
            {images.length === 0 && <Text style={styles.empty}>No photos yet. Upload daily to track crop growth.</Text>}
            <View style={styles.imgGrid}>
              {images.map((img) => (
                <TouchableOpacity key={img.id} style={styles.imgBox} onLongPress={() => Alert.alert('Delete Photo?', '', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => delImgMut.mutate(img.id) }])}>
                  <Image source={{ uri: `${BASE_URL.replace('/api', '')}${img.image_url}` }} style={styles.img} resizeMode="cover" />
                  <Text style={styles.imgDate}>{img.captured_at?.split('T')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {tab === 'expenses' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.totalText}>Total: ₹{totalExp.toLocaleString()}</Text>
              <Button compact mode="outlined" onPress={() => setExpModal(true)}>+ Add</Button>
            </View>
            {expenses.length === 0 && <Text style={styles.empty}>No expenses recorded yet</Text>}
            {expenses.map((exp) => (
              <TouchableOpacity
                key={exp.id}
                style={styles.expItem}
                onLongPress={() => Alert.alert('Delete Expense', `${exp.category} — ₹${parseFloat(exp.amount).toLocaleString()}`, [
                  { text: 'Cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => delExpMut.mutate(exp.id) },
                ])}
              >
                <View style={styles.expLeft}>
                  <Text style={styles.expCat}>{exp.category}</Text>
                  <Text style={styles.expDesc}>{exp.description || exp.expense_date}</Text>
                </View>
                <Text style={styles.expAmt}>₹{parseFloat(exp.amount).toLocaleString()}</Text>
                <Text style={styles.expDelete}>⋮</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'harvest' && (
          <View style={styles.harvestTab}>
            {harvest ? (
              <View>
                <Text variant="titleMedium" style={styles.harvestTabTitle}>Harvest Recorded ✅</Text>
                {[['Yield', `${harvest.yield_kg} kg`], ['Quality', harvest.quality_grade], ['Harvest Date', harvest.harvest_date], ['Market Price', `₹${harvest.market_price_per_kg}/kg`], ['Total Revenue', `₹${parseFloat(harvest.total_revenue || 0).toLocaleString()}`], ['Total Expenses', `₹${parseFloat(harvest.total_expenses || 0).toLocaleString()}`], ['Net Profit/Loss', `₹${parseFloat(harvest.profit_loss || 0).toLocaleString()}`]].map(([l, v]) => (
                  <View key={l} style={styles.harvestDetailRow}>
                    <Text style={styles.harvestDetailLabel}>{l}</Text>
                    <Text style={[styles.harvestDetailVal, l === 'Net Profit/Loss' && { color: harvest.profit_loss >= 0 ? colors.success : colors.error }]}>{v}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.center2}>
                <Text style={{ fontSize: 48 }}>🌾</Text>
                <Text variant="bodyLarge" style={styles.empty}>Record harvest results</Text>
                <Button mode="contained" onPress={() => setHarvestModal(true)} style={styles.harvestBtn}>Record Harvest</Button>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Portal>
        <Modal visible={expModal} onDismiss={() => setExpModal(false)} contentContainerStyle={styles.modal}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => setExpModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {EXPENSE_CATS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setExpForm((p) => ({ ...p, category: c }))} style={[styles.chip, expForm.category === c && styles.chipActive]}>
                <Text style={{ color: expForm.category === c ? '#fff' : colors.textPrimary, fontSize: 12 }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput label="Description" value={expForm.description} onChangeText={(v) => setExpForm((p) => ({ ...p, description: v }))} mode="outlined" style={styles.input} />
          <TextInput label="Amount (₹) *" value={expForm.amount} onChangeText={(v) => setExpForm((p) => ({ ...p, amount: v }))} keyboardType="decimal-pad" mode="outlined" style={styles.input} />
          <TextInput label="Date (YYYY-MM-DD)" value={expForm.expense_date} onChangeText={(v) => setExpForm((p) => ({ ...p, expense_date: v }))} mode="outlined" style={styles.input} />
          <View style={styles.modalBtns}>
            <Button mode="outlined" onPress={() => setExpModal(false)} style={[styles.btn, { flex: 1, marginRight: 8 }]}>Cancel</Button>
            <Button mode="contained" loading={addExpMut.isPending} onPress={() => addExpMut.mutate(expForm)} style={[styles.btn, { flex: 1 }]}>Save</Button>
          </View>
        </Modal>

        <Modal visible={harvestModal} onDismiss={() => setHarvestModal(false)} contentContainerStyle={styles.modal}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>Record Harvest</Text>
            <TouchableOpacity onPress={() => setHarvestModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <TextInput label="Yield (kg) *" value={harvestForm.yield_kg} onChangeText={(v) => setHarvestForm((p) => ({ ...p, yield_kg: v }))} keyboardType="decimal-pad" mode="outlined" style={styles.input} />
          <TextInput label="Market Price/kg (₹)" value={harvestForm.market_price_per_kg} onChangeText={(v) => setHarvestForm((p) => ({ ...p, market_price_per_kg: v }))} keyboardType="decimal-pad" mode="outlined" style={styles.input} />
          <TextInput label="Harvest Date (YYYY-MM-DD)" value={harvestForm.harvest_date} onChangeText={(v) => setHarvestForm((p) => ({ ...p, harvest_date: v }))} mode="outlined" style={styles.input} />
          <TextInput label="Sold To" value={harvestForm.sold_to} onChangeText={(v) => setHarvestForm((p) => ({ ...p, sold_to: v }))} mode="outlined" style={styles.input} />
          <View style={styles.modalBtns}>
            <Button mode="outlined" onPress={() => setHarvestModal(false)} style={[styles.btn, { flex: 1, marginRight: 8 }]}>Cancel</Button>
            <Button mode="contained" loading={saveHarvestMut.isPending} onPress={() => saveHarvestMut.mutate(harvestForm)} style={[styles.btn, { flex: 1 }]}>Save Harvest</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center2: { alignItems: 'center', paddingVertical: 40 },
  header: { backgroundColor: colors.primary, padding: 20 },
  cropName: { color: '#fff', fontWeight: '700' },
  cropSub: { color: 'rgba(255,255,255,0.8)', marginTop: 4, fontSize: 13 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statusChip: { backgroundColor: 'rgba(255,255,255,0.25)' },
  harvestBanner: { backgroundColor: colors.success + '15', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.success + '30' },
  harvestTitle: { fontWeight: '700', color: colors.success, marginBottom: 8 },
  harvestRow: { flexDirection: 'row' },
  harvestStat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border },
  harvestVal: { fontWeight: '700', fontSize: 15 },
  harvestLabel: { fontSize: 11, color: colors.textSecondary },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 11, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  content: { flex: 1, padding: 12 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tabCount: { color: colors.textSecondary },
  totalText: { fontWeight: '700', color: colors.primary, fontSize: 16 },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  taskDone: { opacity: 0.5 },
  taskEmoji: { fontSize: 20, marginRight: 10 },
  taskText: { flex: 1 },
  taskName: { fontWeight: '500' },
  taskDate: { fontSize: 12, color: colors.textSecondary },
  strikethrough: { textDecorationLine: 'line-through' },
  imgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imgBox: { width: '47%', borderRadius: 10, overflow: 'hidden' },
  img: { width: '100%', aspectRatio: 1 },
  imgDate: { textAlign: 'center', fontSize: 10, color: colors.textSecondary, paddingVertical: 2 },
  expItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  expLeft: { flex: 1 },
  expCat: { fontWeight: '600', textTransform: 'capitalize' },
  expDesc: { fontSize: 12, color: colors.textSecondary },
  expAmt: { fontWeight: '700', color: colors.primary, fontSize: 15 },
  expDelete: { color: colors.textSecondary, fontSize: 20, paddingLeft: 8 },
  harvestTab: { padding: 4 },
  harvestTabTitle: { fontWeight: '700', color: colors.success, marginBottom: 16 },
  harvestDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  harvestDetailLabel: { color: colors.textSecondary },
  harvestDetailVal: { fontWeight: '600' },
  harvestBtn: { marginTop: 16, borderRadius: 8 },
  modal: { backgroundColor: colors.surface, margin: 16, padding: 20, borderRadius: 16, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontWeight: '700', color: colors.primary },
  modalCancel: { color: colors.error, fontSize: 14, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', marginTop: 8 },
  label: { color: colors.textSecondary, marginBottom: 8, fontSize: 13 },
  input: { marginBottom: 10, backgroundColor: colors.surface },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 6, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  btn: { marginTop: 8, borderRadius: 8 },
  mb: { marginBottom: 12 },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
});
