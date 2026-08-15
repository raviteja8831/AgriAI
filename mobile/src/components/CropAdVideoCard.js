import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../utils/theme';

// TODO: swap for the real crop-ads video (remote URL or a bundled asset via require('../../assets/...')).
const PLACEHOLDER_VIDEO_URI = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function CropAdVideoCard({ uri = PLACEHOLDER_VIDEO_URI, title = 'Featured for your crops', autoPlay = true }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    if (autoPlay) p.play();
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, padding: 12, elevation: 3 },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#000' },
});
