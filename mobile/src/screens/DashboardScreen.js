import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Portal, Modal, RadioButton, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import WeatherCard from '../components/WeatherCard';
import LatestUpdatesCarousel from '../components/LatestUpdatesCarousel';
import CropAdVideoCard from '../components/CropAdVideoCard';
import TodayBriefCard from '../components/TodayBriefCard';
import MarketPriceCard from '../components/MarketPriceCard';
import VegFlowerPriceCard from '../components/VegFlowerPriceCard';
import CropProgressCard from '../components/CropProgressCard';
import HomeHeader from '../components/HomeHeader';
import CategoryPreviewCard from '../components/CategoryPreviewCard';
import api from '../utils/api';
import { authAPI, notificationsAPI, marketAPI } from '../api';
import { updateUser } from '../store/authSlice';
import { useSnackbar } from '../components/SnackbarProvider';
import { colors } from '../utils/theme';
import { capitalize } from '../utils/format';

const CATEGORY_ROW = [
  { emoji: '🏡', label: 'Farms', screen: 'Farms' },
  { emoji: '🌿', label: 'Crops', screen: 'Crops' },
  { emoji: '🌤️', label: 'Weather', screen: 'Weather' },
  { emoji: '📅', label: 'Calendar', screen: 'Calendar' },
  { emoji: '🧪', label: 'Soil', screen: 'Soil' },
  { emoji: '🎬', label: 'Videos', screen: 'Videos' },
  { emoji: '🥬', label: 'Veg & Flower', screen: 'VegFlowerPrices' },
];

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
  const [deviceLoc, setDeviceLoc] = useState(null);

  // Fallback for weather when the user hasn't registered a farm yet — uses
  // whatever location permission was already granted (Intro/Onboarding),
  // never prompts on its own since request*Async() no-ops after the first decision.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        if (!cancelled) setDeviceLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch { /* location unavailable — weather falls back to farm coords or the empty card */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Shared with NotificationsScreen's ['notifications'] query — pre-warms the cache so
  // opening Notifications from the Categories tab shows data instantly while it refetches.
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then((r) => r.data),
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <HomeHeader
          searchQuery={searchQuery}
          onChangeSearch={setSearchQuery}
          onPressMenu={() => navigation.openDrawer()}
          onPressRewards={() => navigation.navigate('Cashback')}
          onPressCoins={() => navigation.navigate('Coins')}
          onPressAddress={() => navigation.navigate('Farms')}
          onPressLanguage={() => setLangModalVisible(true)}
          language={user?.language}
        />
      ),
    });
  }, [navigation, searchQuery, user?.language]);

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
    queryKey: ['dashboard', deviceLoc?.latitude, deviceLoc?.longitude],
    queryFn: () => api.get('/dashboard/summary', { params: deviceLoc ? { lat: deviceLoc.latitude, lng: deviceLoc.longitude } : {} }).then((r) => r.data),
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
    // Device location resolves a couple seconds after mount and changes the query key
    // (undefined,undefined -> lat,lng). Without this, that key change is treated as a
    // brand-new query and `dash` (and weather.temperature) flashes undefined until the
    // refetch completes — keep showing the last good dashboard in the meantime.
    placeholderData: keepPreviousData,
  });

  const { data: marketData, refetch: refetchMarket } = useQuery({
    queryKey: ['market-my-crops'],
    queryFn: () => api.get('/market/my-crops').then((r) => r.data),
  });

  // Same query key VegFlowerPriceCard uses further down this screen — react-query
  // dedupes identical keys, so this doesn't cost an extra request.
  const { data: vegFlowerData } = useQuery({
    queryKey: ['veg-flower-prices'],
    queryFn: () => marketAPI.getVegFlowerPrices().then((r) => r.data),
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
        <Text style={styles.greetName}>Hello, {firstName}! 🙏</Text>
        <Text style={styles.greetDate}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Categories */}
      <Text style={styles.sectionHeading}>📂 Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {CATEGORY_ROW.map((c) => (
          <TouchableOpacity key={c.screen} style={styles.categoryItem} onPress={() => navigation.navigate(c.screen)}>
            <View style={styles.categoryIcon}>
              <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
            </View>
            <Text style={styles.categoryLabel} numberOfLines={1}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Latest updates carousel */}
      <LatestUpdatesCarousel navigation={navigation} />

      {/* Weather */}
      <WeatherCard weather={weather} />

      {/* Category preview cards */}
      <CategoryPreviewCard
        emoji="🏡" title="My Farms"
        items={[`${s.farms || 0} farm(s) registered`, `${s.total_area || 0} acres total`]}
        onSeeAll={() => navigation.navigate('Farms')}
      />
      <CategoryPreviewCard
        emoji="🌿" title="Crops"
        items={cropProgress.length ? cropProgress.slice(0, 3).map((c) => `${c.crop_name} — ${c.growth_stage || c.status || 'growing'}`) : []}
        onSeeAll={() => navigation.navigate('Crops')}
      />
      <CategoryPreviewCard
        emoji="📅" title="Crop Calendar"
        items={[`${s.today_tasks || 0} task(s) today`, `${s.overdue_tasks || 0} overdue`]}
        onSeeAll={() => navigation.navigate('Calendar')}
      />
      <CategoryPreviewCard
        emoji="🧪" title="Soil Analysis"
        items={['Get your soil tested before the next sowing cycle']}
        onSeeAll={() => navigation.navigate('Soil')}
      />
      <CategoryPreviewCard
        emoji="🎬" title="Videos"
        items={['Featured for your crops', 'New fertilizer launch', 'Seasonal discount offers']}
        onSeeAll={() => navigation.navigate('Videos')}
      />
      <CategoryPreviewCard
        emoji="🥬" title="Veg & Flower Prices"
        items={[...(vegFlowerData?.vegetables || []), ...(vegFlowerData?.flowers || [])]
          .slice(0, 3)
          .map((p) => `${p.crop_name} — ₹${p.price}/${p.unit}`)}
        onSeeAll={() => navigation.navigate('VegFlowerPrices')}
      />

      {/* Today's brief */}
      <TodayBriefCard brief={brief} />

      {/* Crop ads video */}
      <CropAdVideoCard />

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

      {/* Vegetable & flower prices */}
      <VegFlowerPriceCard navigation={navigation} />

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
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingEmoji: { fontSize: 64 },
  loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: 16 },
  greeting: { marginBottom: 12 },
  greetName: { fontSize: 22, fontWeight: '800', color: colors.primary },
  greetDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sectionHeading: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  categoryRow: { gap: 16, paddingBottom: 4, marginBottom: 12 },
  categoryItem: { alignItems: 'center', width: 62 },
  categoryIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  categoryLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
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
