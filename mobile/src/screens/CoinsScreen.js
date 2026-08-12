import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { colors } from '../utils/theme';
import { getCoinsBalance } from '../utils/rewards';

export default function CoinsScreen() {
  const { user } = useSelector((s) => s.auth);
  const [coinsBalance, setCoinsBalance] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCoinsBalance(user?.id).then((bal) => {
      if (!cancelled) setCoinsBalance(bal);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🪙</Text>
      <Text style={styles.title}>Coins</Text>
      <Text style={styles.balance}>{coinsBalance ?? 0} coins</Text>
      <Text style={styles.body}>More ways to earn and spend your coins will show up here soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: 32, paddingTop: 48 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  balance: { fontSize: 28, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
});
