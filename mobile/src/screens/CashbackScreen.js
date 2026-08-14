import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

export default function CashbackScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💰</Text>
      <Text style={styles.title}>Cashback Balance</Text>
      <Text style={styles.body}>Your cashback history and balance details will show up here soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: 32, paddingTop: 48 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
});
