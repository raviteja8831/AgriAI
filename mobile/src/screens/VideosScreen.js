import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import CropAdVideoCard from '../components/CropAdVideoCard';
import { colors } from '../utils/theme';

const VIDEOS = [
  { id: 'v1', title: 'Featured for your crops' },
  { id: 'v2', title: 'New fertilizer launch' },
  { id: 'v3', title: 'Seasonal discount offers' },
];

export default function VideosScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {VIDEOS.map((v, i) => (
        <CropAdVideoCard key={v.id} title={v.title} autoPlay={i === 0} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14 },
});
