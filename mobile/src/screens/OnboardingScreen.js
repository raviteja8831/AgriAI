import React, { useState, useRef, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, Button, TextInput, SegmentedButtons, ActivityIndicator, Chip } from 'react-native-paper';
import { MapView, Marker, Circle } from '../components/PlatformMap';
import * as Location from 'expo-location';
import { useSnackbar } from '../components/SnackbarProvider';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { authAPI, farmsAPI } from '../api';
import api from '../utils/api';
import { setCredentials } from '../store/authSlice';
import { colors } from '../utils/theme';

const SEASONS = [
  { value: 'kharif', label: 'Kharif', icon: '🌧️', months: 'Jun–Oct' },
  { value: 'rabi', label: 'Rabi', icon: '❄️', months: 'Nov–Apr' },
  { value: 'zaid', label: 'Zaid', icon: '☀️', months: 'Mar–Jun' },
];

const BUDGET_OPTIONS = [
  { label: '< ₹10k/acre', value: 8000 },
  { label: '₹10–20k', value: 15000 },
  { label: '₹20–40k', value: 30000 },
  { label: '> ₹40k', value: 50000 },
];

const RISK_COLOR = { low: colors.success, medium: colors.warning, high: colors.error };
const RISK_EMOJI = { low: '🟢', medium: '🟡', high: '🔴' };

const ProgressDots = ({ total, current }) => (
  <View style={dots.row}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[dots.dot, i <= current && dots.dotActive]} />
    ))}
  </View>
);

export default function OnboardingScreen() {
  const dispatch = useDispatch();
  const snack = useSnackbar();
  const { user } = useSelector((s) => s.auth);
  const [step, setStep] = useState(0); // 0=name, 1=location, 2=filters, 3=results
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [radius, setRadius] = useState(1000); // metres
  const [season, setSeason] = useState('kharif');
  const [budget, setBudget] = useState(15000);
  const [area, setArea] = useState('1');
  const [recommendations, setRecommendations] = useState(null);
  const [regionInfo, setRegionInfo] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const mapRef = useRef();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep((s) => s + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const setupMut = useMutation({
    mutationFn: (data) => authAPI.setupProfile(data),
    onSuccess: ({ data }) => {
      dispatch(setCredentials({ token: user?.token, user: { ...user, name: data.user.name, language: data.user.language } }));
      goNext();
    },
  });

  const handleGPS = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return snack.showWarning('Location permission needed to detect your farm area');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
      snack.showSuccess('Location captured!');
    } catch {
      snack.showWarning('Could not get location — try tapping the map instead');
    } finally {
      setLocLoading(false);
    }
  };

  const handleMapPress = (e) => {
    setLocation(e.nativeEvent.coordinate);
  };

  const fetchRecommendations = async () => {
    if (!location) return snack.showWarning('Please set your farm location first');
    setRecLoading(true);
    try {
      const { data } = await api.get('/recommendations', {
        params: { lat: location.latitude, lng: location.longitude, season, budget_per_acre: budget, area_acres: area || 1 },
      });
      setRecommendations(data.recommendations);
      setRegionInfo(data.region);
      goNext();
    } catch {
      /* axios interceptor handles error snackbar */
    } finally {
      setRecLoading(false);
    }
  };

  const handleSkip = async () => {
    // Location was captured to fetch crop recommendations (step 1) but never saved —
    // persist it as the user's first farm so weather etc. work without a separate manual step.
    if (location) {
      try {
        await farmsAPI.create({
          name: `${name.trim() || 'My'} Farm`,
          latitude: location.latitude,
          longitude: location.longitude,
          area_acres: parseFloat(area) > 0 ? parseFloat(area) : 1,
        });
      } catch {
        /* not fatal — user can add a farm manually from the Farms screen */
      }
    }
    // Mark onboarding done by dispatching a flag — App.js will move to main app
    dispatch(setCredentials({ token: user?.token, user: { ...user, onboarded: true } }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerLogo}>🌾</Text>
        <Text style={styles.headerTitle}>{step === 0 ? 'Welcome to AgriAI' : step === 1 ? 'Your Farm Location' : step === 2 ? 'Crop Preferences' : 'Recommended for You'}</Text>
        <ProgressDots total={4} current={step} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Step 0: Name & language */}
        {step === 0 && (
          <ScrollView contentContainerStyle={styles.stepPad} keyboardShouldPersistTaps="handled">
            <Text style={styles.emoji}>👤</Text>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSub}>Help us personalise your experience</Text>
            <TextInput
              label="Your full name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              autoFocus
            />
            <Text style={styles.label}>Preferred Language</Text>
            <SegmentedButtons
              value={language}
              onValueChange={setLanguage}
              buttons={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिंदी' }, { value: 'te', label: 'తెలుగు' }]}
              style={styles.segmented}
            />
            <Button
              mode="contained"
              style={styles.btn}
              contentStyle={styles.btnContent}
              disabled={!name.trim() || setupMut.isPending}
              loading={setupMut.isPending}
              onPress={() => setupMut.mutate({ name: name.trim(), language })}
            >
              Continue
            </Button>
          </ScrollView>
        )}

        {/* Step 1: Location on map */}
        {step === 1 && (
          <View style={styles.flex}>
            <View style={styles.mapHintBox}>
              <Text style={styles.mapHint}>📍 Tap on the map or use GPS to mark your farm</Text>
            </View>
            <MapView
              ref={mapRef}
              style={styles.map}
              mapType="hybrid"
              initialRegion={{ latitude: 17.385, longitude: 78.4867, latitudeDelta: 8, longitudeDelta: 8 }}
              onPress={handleMapPress}
            >
              {location && (
                <>
                  <Marker coordinate={location} title="My Farm" pinColor={colors.primary} />
                  <Circle
                    center={location}
                    radius={radius}
                    strokeColor={colors.primary}
                    fillColor={colors.primary + '25'}
                    strokeWidth={2}
                  />
                </>
              )}
            </MapView>

            <View style={styles.mapControls}>
              {location && (
                <View style={styles.radiusRow}>
                  <Text style={styles.radiusLabel}>Farm radius: {(radius / 1000).toFixed(1)} km</Text>
                  <View style={styles.radiusBtns}>
                    {[500, 1000, 2000, 5000].map((r) => (
                      <TouchableOpacity key={r} onPress={() => setRadius(r)} style={[styles.radiusChip, radius === r && styles.radiusChipActive]}>
                        <Text style={{ fontSize: 11, color: radius === r ? '#fff' : colors.textPrimary }}>{r >= 1000 ? `${r / 1000}km` : `${r}m`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.mapBtns}>
                <Button mode="outlined" icon="crosshairs-gps" onPress={handleGPS} loading={locLoading} style={{ flex: 1, marginRight: 8 }}>
                  Use GPS
                </Button>
                <Button mode="contained" onPress={goNext} disabled={!location} style={{ flex: 1 }}>
                  Next
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Season, budget, area filters */}
        {step === 2 && (
          <ScrollView contentContainerStyle={styles.stepPad} keyboardShouldPersistTaps="handled">
            <Text style={styles.emoji}>🌱</Text>
            <Text style={styles.stepTitle}>Tell us about your plans</Text>
            <Text style={styles.stepSub}>We'll suggest the best crops for your situation</Text>

            <Text style={styles.label}>Which season are you planning for?</Text>
            <View style={styles.seasonRow}>
              {SEASONS.map((s) => (
                <TouchableOpacity key={s.value} onPress={() => setSeason(s.value)} style={[styles.seasonCard, season === s.value && styles.seasonCardActive]}>
                  <Text style={styles.seasonEmoji}>{s.icon}</Text>
                  <Text style={[styles.seasonName, season === s.value && styles.seasonNameActive]}>{s.label}</Text>
                  <Text style={styles.seasonMonths}>{s.months}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Budget per acre?</Text>
            <View style={styles.budgetRow}>
              {BUDGET_OPTIONS.map((b) => (
                <TouchableOpacity key={b.value} onPress={() => setBudget(b.value)} style={[styles.budgetChip, budget === b.value && styles.budgetChipActive]}>
                  <Text style={{ fontSize: 12, color: budget === b.value ? '#fff' : colors.textPrimary }}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label="Farm area (acres)"
              value={area}
              onChangeText={setArea}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="resize" />}
            />

            <Button
              mode="contained"
              style={styles.btn}
              contentStyle={styles.btnContent}
              loading={recLoading}
              disabled={recLoading}
              onPress={fetchRecommendations}
            >
              Show Recommendations
            </Button>
          </ScrollView>
        )}

        {/* Step 3: Recommendations */}
        {step === 3 && (
          <ScrollView contentContainerStyle={styles.stepPad}>
            {regionInfo && (
              <View style={styles.regionBox}>
                <Text style={styles.regionName}>📍 {regionInfo.name}</Text>
                <Text style={styles.regionDetail}>Climate: {regionInfo.climate}</Text>
                <View style={styles.soilChips}>
                  <Text style={styles.regionDetail}>Soils: </Text>
                  {regionInfo.available_soils.map((s) => <Chip key={s} compact style={styles.soilChip}>{s}</Chip>)}
                </View>
              </View>
            )}

            <Text style={styles.recTitle}>Best Crops for You</Text>
            <Text style={styles.recSub}>Season: {season} • Budget: ₹{budget.toLocaleString()}/acre • Area: {area} acres</Text>

            {(recommendations || []).map((crop, idx) => (
              <View key={crop.crop_name} style={[styles.cropCard, idx === 0 && styles.cropCardTop]}>
                {idx === 0 && <View style={styles.topBadge}><Text style={styles.topBadgeText}>⭐ Top Pick</Text></View>}
                <View style={styles.cropHeader}>
                  <Text style={styles.cropName}>{crop.crop_name}</Text>
                  <Text style={styles.riskEmoji}>{RISK_EMOJI[crop.risk_level]}</Text>
                </View>
                <View style={styles.cropSeasonRow}>
                  {crop.season.map((s) => <Chip key={s} compact style={styles.seasonTag}>{s}</Chip>)}
                  <Text style={styles.duration}> ⏱ {crop.duration_days} days</Text>
                </View>
                <View style={styles.financialRow}>
                  <View style={styles.finBox}>
                    <Text style={styles.finLabel}>Investment</Text>
                    <Text style={styles.finVal}>₹{crop.budget_range.min.toLocaleString()}–{crop.budget_range.max.toLocaleString()}</Text>
                    <Text style={styles.finUnit}>per acre</Text>
                  </View>
                  <View style={styles.finBox}>
                    <Text style={styles.finLabel}>Yield</Text>
                    <Text style={styles.finVal}>{crop.yield_range.min}–{crop.yield_range.max}</Text>
                    <Text style={styles.finUnit}>kg/acre</Text>
                  </View>
                  <View style={styles.finBox}>
                    <Text style={styles.finLabel}>Est. Profit</Text>
                    <Text style={[styles.finVal, { color: crop.financials.profit > 0 ? colors.success : colors.error }]}>
                      ₹{Math.abs(crop.financials.profit).toLocaleString()}
                    </Text>
                    <Text style={styles.finUnit}>{parseFloat(area)} acres</Text>
                  </View>
                </View>
                {crop.preferred_for_region && (
                  <Text style={styles.regionTag}>✅ Ideal for your region</Text>
                )}
                {!crop.fits_budget && (
                  <Text style={styles.budgetWarn}>⚠️ Slightly above your budget — consider starting small</Text>
                )}
              </View>
            ))}

            <Button mode="contained" style={[styles.btn, { marginTop: 16 }]} contentStyle={styles.btnContent} onPress={handleSkip}>
              Set Up My Farm →
            </Button>
            <Button mode="text" onPress={handleSkip} style={{ marginTop: 8 }}>
              Skip for now
            </Button>
          </ScrollView>
        )}
      </Animated.View>

      {step > 0 && step < 3 && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip setup</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const dots = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#fff', width: 20 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { alignItems: 'center', paddingTop: 56, paddingBottom: 20 },
  headerLogo: { fontSize: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 6 },
  flex: { flex: 1 },
  content: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  stepPad: { padding: 24, paddingBottom: 40 },
  emoji: { fontSize: 48, marginBottom: 12 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  stepSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  input: { marginBottom: 16, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 10 },
  segmented: { marginBottom: 24 },
  btn: { borderRadius: 12, marginTop: 4 },
  btnContent: { paddingVertical: 8 },
  mapHintBox: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16 },
  mapHint: { color: '#fff', fontSize: 13, textAlign: 'center' },
  map: { flex: 1 },
  mapControls: { backgroundColor: '#fff', padding: 16 },
  radiusRow: { marginBottom: 12 },
  radiusLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  radiusBtns: { flexDirection: 'row', gap: 8 },
  radiusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  radiusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mapBtns: { flexDirection: 'row' },
  seasonRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  seasonCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  seasonCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  seasonEmoji: { fontSize: 28 },
  seasonName: { fontWeight: '700', marginTop: 4, color: colors.textPrimary },
  seasonNameActive: { color: colors.primary },
  seasonMonths: { fontSize: 11, color: colors.textSecondary },
  budgetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  budgetChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  budgetChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  regionBox: { backgroundColor: colors.primary + '10', borderRadius: 12, padding: 14, marginBottom: 16 },
  regionName: { fontWeight: '700', color: colors.primary, fontSize: 15 },
  regionDetail: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  soilChips: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4, gap: 4 },
  soilChip: { backgroundColor: colors.primaryLight + '30' },
  recTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  recSub: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  cropCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12, backgroundColor: '#fff', elevation: 2 },
  cropCardTop: { borderColor: colors.primary, borderWidth: 2 },
  topBadge: { backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  topBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cropHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cropName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  riskEmoji: { fontSize: 18 },
  cropSeasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  seasonTag: { backgroundColor: colors.secondary + '20' },
  duration: { fontSize: 12, color: colors.textSecondary },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.background, borderRadius: 10, padding: 10, marginBottom: 8 },
  finBox: { alignItems: 'center', flex: 1 },
  finLabel: { fontSize: 10, color: colors.textSecondary },
  finVal: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  finUnit: { fontSize: 10, color: colors.textSecondary },
  regionTag: { fontSize: 12, color: colors.success, marginTop: 4 },
  budgetWarn: { fontSize: 11, color: colors.warning, marginTop: 4 },
  skipBtn: { position: 'absolute', top: 56, right: 20 },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
