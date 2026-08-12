import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Portal, Modal, RadioButton, Button, Searchbar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation } from '@tanstack/react-query';
import TodayBriefCard from '../components/TodayBriefCard';
import MarketPriceCard from '../components/MarketPriceCard';
import CropProgressCard from '../components/CropProgressCard';
import api from '../utils/api';
import { authAPI, notificationsAPI } from '../api';
import { updateUser } from '../store/authSlice';
import { useSnackbar } from '../components/SnackbarProvider';
import { colors } from '../utils/theme';
import { capitalize } from '../utils/format';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
];

const QuickStat = ({ emoji, label, value, sub, onPress, alert }) => (
  <TouchableOpacity style={[styles.statBox, alert && styles.statBoxAlert]} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, alert && { color: colors.error }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </TouchableOpacity>
);

const PestRiskBanner = ({ risk }) => {
  if (!risk || risk.level === 'low') return null;
  const bg = risk.level === 'high' ? '#ffebee' : '#fff8e1';
  const border = risk.level === 'high' ? colors.error : colors.warning;
  return (
    <View style={[styles.pestBanner, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.pestTitle}>{risk.emoji} {risk.level === 'high' ? 'DANGER' : 'CAUTION'}: {risk.pest}</Text>
      <Text style={styles.pestAction}>👉 {risk.action}</Text>
    </View>
  );
};

const SeasonPL = ({ expenses, revenue, profit }) => (
  <View style={styles.plCard}>
    <Text style={styles.plTitle}>💰 This Season — Money Summary</Text>
    <View style={styles.plRow}>
      <View style={styles.plBox}>
        <Text style={styles.plEmoji}>⬇️</Text>
        <Text style={styles.plAmount}>₹{expenses.toLocaleString('en-IN')}</Text>
        <Text style={styles.plLabel}>Total Spent</Text>
      </View>
      <View style={styles.plDivider} />
      <View style={styles.plBox}>
        <Text style={styles.plEmoji}>⬆️</Text>
        <Text style={styles.plAmount}>₹{revenue.toLocaleString('en-IN')}</Text>
        <Text style={styles.plLabel}>Earned</Text>
      </View>
      <View style={styles.plDivider} />
      <View style={styles.plBox}>
        <Text style={styles.plEmoji}>{profit >= 0 ? '✅' : '📉'}</Text>
        <Text style={[styles.plAmount, { color: profit >= 0 ? colors.success : colors.error }]}>
          ₹{Math.abs(profit).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.plLabel}>{profit >= 0 ? 'Profit' : 'Loss'}</Text>
      </View>
    </View>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const snack = useSnackbar();
  const { user } = useSelector((s) => s.auth);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState(user?.language || 'en');
  const [searchQuery, setSearchQuery] = useState('');

  // Shared with NotificationsScreen's ['notifications'] query — navigating there shows
  // this cached unread count instantly while it refetches in the background.
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then((r) => r.data),
  });
  const unreadCount = notifData?.unread || 0;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Searchbar
          placeholder="Search"
          placeholderTextColor="#ffffffcc"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.headerSearch}
          inputStyle={styles.headerSearchInput}
          icon="magnify"
          iconColor="#fff"
          rippleColor="#ffffff30"
        />
      ),
      headerTitleContainerStyle: styles.headerTitleContainer,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellButton}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
            {unreadCount > 0 && <View style={styles.notifBadge} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLangModalVisible(true)} style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 20 }}>🌐</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, searchQuery, unreadCount]);

  const langMut = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: () => {
      dispatch(updateUser({ language: selectedLang }));
      setLangModalVisible(false);
      snack.showSuccess('Language updated!');
    },
  });

  const handleSaveLang = () => {
    langMut.mutate({ name: user?.name, email: user?.email, language: selectedLang });
  };

  const { data: dash, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/summary').then((r) => r.data),
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  const { data: marketData, refetch: refetchMarket } = useQuery({
    queryKey: ['market-my-crops'],
    queryFn: () => api.get('/market/my-crops').then((r) => r.data),
  });

  const onRefresh = () => { refetch(); refetchMarket(); };

  if (isLoading) return (
    <View style={styles.loading}>
      <Text style={styles.loadingEmoji}>🌾</Text>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 16 }} />
      <Text style={styles.loadingText}>Loading your farm data...</Text>
    </View>
  );

  const s = dash?.summary || {};
  const brief = dash?.today_brief || [];
  const weather = dash?.weather;
  const cropProgress = dash?.crop_progress || [];
  const pestRisk = dash?.pest_risk;
  const prices = marketData?.prices || [];

  const firstName = capitalize(user?.name?.split(' ')[0]) || 'Farmer';

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetName}>Jai Kisaan, {firstName}! 🙏</Text>
        <Text style={styles.greetDate}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Today's brief + weather */}
      <TodayBriefCard brief={brief} weather={weather} />

      {/* Pest risk banner (only if medium/high) */}
      <PestRiskBanner risk={pestRisk} />

      {/* Quick stats */}
      <View style={styles.statsGrid}>
        <QuickStat emoji="🏡" label="My Farms" value={s.farms || 0} sub={`${s.total_area || 0} acres`} onPress={() => navigation.navigate('Farms')} />
        <QuickStat emoji="🌿" label="Crops" value={s.active_crops || 0} sub="active" onPress={() => navigation.navigate('Crops')} />
        <QuickStat emoji="📅" label="Tasks Today" value={s.today_tasks || 0} alert={s.today_tasks > 0} onPress={() => navigation.navigate('Calendar')} />
        <QuickStat emoji="⚠️" label="Overdue" value={s.overdue_tasks || 0} alert={s.overdue_tasks > 0} sub="tasks" onPress={() => navigation.navigate('Calendar')} />
      </View>

      {/* Season P&L (only if any activity) */}
      {(s.season_expenses > 0 || s.season_revenue > 0) && (
        <SeasonPL expenses={s.season_expenses || 0} revenue={s.season_revenue || 0} profit={s.season_profit || 0} />
      )}

      {/* Crop progress cards */}
      <CropProgressCard
        crops={cropProgress}
        onCropPress={(id) => navigation.navigate('Crops', { screen: 'CropDetail', params: { cropId: id } })}
      />

      {/* No crops yet */}
      {cropProgress.length === 0 && (
        <TouchableOpacity style={styles.addCropBanner} onPress={() => navigation.navigate('Crops')}>
          <Text style={styles.addCropEmoji}>🌱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.addCropTitle}>Add your first crop</Text>
            <Text style={styles.addCropSub}>Track progress, expenses and harvest</Text>
          </View>
          <Text style={styles.addCropArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Market prices */}
      <MarketPriceCard prices={prices} date={marketData?.date} />

      {/* No farms nudge */}
      {(s.farms || 0) === 0 && (
        <TouchableOpacity style={styles.addFarmBanner} onPress={() => navigation.navigate('Farms')}>
          <Text style={styles.addFarmEmoji}>🏡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.addFarmTitle}>Register your farm</Text>
            <Text style={styles.addFarmSub}>Get weather, soil and crop advice for your exact location</Text>
          </View>
          <Text style={styles.addCropArrow}>→</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>

    <Portal>
      <Modal visible={langModalVisible} onDismiss={() => setLangModalVisible(false)} contentContainerStyle={styles.langModal}>
        <Text variant="titleLarge" style={styles.langModalTitle}>Select Language</Text>
        <RadioButton.Group onValueChange={setSelectedLang} value={selectedLang}>
          {LANGUAGES.map((l) => (
            <RadioButton.Item key={l.code} label={l.label} value={l.code} color={colors.primary} />
          ))}
        </RadioButton.Group>
        <View style={styles.langModalBtns}>
          <Button mode="outlined" onPress={() => setLangModalVisible(false)} style={[styles.langBtn, { marginRight: 8 }]}>Cancel</Button>
          <Button mode="contained" loading={langMut.isPending} onPress={handleSaveLang} style={styles.langBtn}>Save</Button>
        </View>
      </Modal>
    </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: { flex: 1, marginHorizontal: 8 },
  headerSearch: { height: 40, borderRadius: 20, backgroundColor: '#ffffff30', elevation: 0 },
  headerSearchInput: { fontSize: 14, minHeight: 0, alignSelf: 'center', color: '#fff' },
  bellButton: { paddingHorizontal: 12, position: 'relative' },
  notifBadge: { position: 'absolute', top: 2, right: 8, width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.error, borderWidth: 1, borderColor: colors.primary },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingEmoji: { fontSize: 64 },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 16 },
  greeting: { marginBottom: 12 },
  greetName: { fontSize: 22, fontWeight: '800', color: colors.primary },
  greetDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statBox: { flex: 1, minWidth: '44%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', elevation: 2 },
  statBoxAlert: { backgroundColor: '#fff3e0', borderWidth: 1.5, borderColor: colors.warning },
  statEmoji: { fontSize: 26, marginBottom: 4 },
  statValue: { fontSize: 30, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  statSub: { fontSize: 10, color: colors.textSecondary },
  pestBanner: { borderRadius: 14, borderWidth: 2, padding: 14, marginBottom: 12 },
  pestTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  pestAction: { fontSize: 14, lineHeight: 20 },
  plCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3 },
  plTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  plRow: { flexDirection: 'row', alignItems: 'center' },
  plBox: { flex: 1, alignItems: 'center' },
  plEmoji: { fontSize: 22, marginBottom: 4 },
  plAmount: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  plLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  plDivider: { width: 1, height: 50, backgroundColor: colors.border },
  addCropBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: colors.primaryLight, gap: 12 },
  addCropEmoji: { fontSize: 36 },
  addCropTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
  addCropSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  addCropArrow: { fontSize: 20, color: colors.primary, fontWeight: '700' },
  addFarmBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: colors.info, gap: 12 },
  addFarmEmoji: { fontSize: 36 },
  addFarmTitle: { fontSize: 16, fontWeight: '700', color: colors.info },
  addFarmSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  langModal: { backgroundColor: colors.surface, margin: 16, padding: 20, borderRadius: 16 },
  langModalTitle: { fontWeight: '700', color: colors.primary, marginBottom: 8 },
  langModalBtns: { flexDirection: 'row', marginTop: 12 },
  langBtn: { flex: 1 },
});
