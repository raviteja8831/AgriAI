import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';
import ReferEarnCard from '../components/ReferEarnCard';

export default function WinAssuredScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Win assured ₹100</Text>
        <Text style={styles.body}>Win an assured ₹100 when your referred friend joins AgriAI!</Text>
      </View>
      <ReferEarnCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: 16, paddingBottom: 32 },
  header: { alignItems: 'center', padding: 32, paddingTop: 32, paddingBottom: 16 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
});
