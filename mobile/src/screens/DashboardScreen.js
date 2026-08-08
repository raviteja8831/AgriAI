import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import TodayBriefCard from '../components/TodayBriefCard';
import MarketPriceCard from '../components/MarketPriceCard';
import CropProgressCard from '../components/CropProgressCard';
import api from '../utils/api';
import { colors } from '../utils/theme';

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
  const { user } = useSelector((s) => s.auth);

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

  const firstName = user?.name?.split(' ')[0] || 'Farmer';

  return (
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
});
