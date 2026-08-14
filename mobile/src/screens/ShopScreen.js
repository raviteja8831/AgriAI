import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';

export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🛒</Text>
      <Text style={styles.title}>Shop</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
      <Text style={styles.body}>
        Seeds, fertilizers and farm supplies will be available to order here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: 12 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 21, color: colors.textPrimary, textAlign: 'center', marginTop: 16 },
});
