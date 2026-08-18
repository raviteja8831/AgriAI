import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { updatesAPI } from '../api';
import { colors } from '../utils/theme';

const CARD_WIDTH = 220;
const CARD_GAP = 12;
const PX_PER_SECOND = 40; // marquee speed — higher is faster

// Shown while the real feed loads (or if the request fails) so the carousel is never empty.
const PLACEHOLDER_UPDATES = [
  { id: 'p1', emoji: '🌧️', title: 'Monsoon Update', body: 'Heavy rainfall expected in your region this week.', screen: 'Weather' },
  { id: 'p2', emoji: '🌾', title: 'New Crop Advisory', body: 'Updated guidelines released for the Rabi season.', screen: 'Calendar' },
  { id: 'p3', emoji: '🧪', title: 'Soil Health Alert', body: 'Get your soil tested before the next sowing cycle.', screen: 'Soil' },
  { id: 'p4', emoji: '🐛', title: 'Pest Watch', body: 'Armyworm activity reported in nearby districts.', screen: 'Crops' },
  { id: 'p5', emoji: '🏡', title: 'Register Your Farm', body: 'Add your farm to unlock location-based advice.', screen: 'Farms' },
];

export default function LatestUpdatesCarousel({ navigation }) {
  const { data } = useQuery({
    queryKey: ['updates'],
    queryFn: () => updatesAPI.getAll().then((r) => r.data.updates),
  });
  const updates = data?.length ? data : PLACEHOLDER_UPDATES;

  const translateX = useRef(new Animated.Value(0)).current;
  const trackWidth = (CARD_WIDTH + CARD_GAP) * updates.length;

  useEffect(() => {
    translateX.setValue(0);
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -trackWidth,
        duration: (trackWidth / PX_PER_SECOND) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [trackWidth]);

  // Rendered twice back-to-back so the loop wraps seamlessly at -trackWidth.
  const looped = [...updates, ...updates];

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>📰 Latest Updates</Text>
      <View style={styles.viewport}>
        <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
          {looped.map((u, idx) => (
            <TouchableOpacity
              key={`${u.id}-${idx}`}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => u.screen && navigation?.navigate(u.screen)}
            >
              <Text style={styles.cardEmoji}>{u.emoji}</Text>
              <Text style={styles.cardTitle}>{u.title}</Text>
              <Text style={styles.cardText} numberOfLines={2}>{u.body}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  heading: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  viewport: { overflow: 'hidden' },
  track: { flexDirection: 'row' },
  card: { width: CARD_WIDTH, marginRight: CARD_GAP, backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 3 },
  cardEmoji: { fontSize: 24, marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
});
