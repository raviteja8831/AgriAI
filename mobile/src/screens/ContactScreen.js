import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { colors } from '../utils/theme';

const SUPPORT_EMAIL = 'support@agriai.app';

export default function ContactScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📩</Text>
      <Text style={styles.title}>We're here to help</Text>
      <Text style={styles.body}>
        Have a question, feedback or a problem with the app? Reach out to our support
        team and we'll get back to you.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{SUPPORT_EMAIL}</Text>
      </View>

      <Button
        mode="contained"
        buttonColor={colors.info}
        style={styles.btn}
        contentStyle={{ paddingVertical: 6 }}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
      >
        Email Support
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: 32, paddingTop: 48 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  card: { width: '100%', backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, elevation: 1 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  value: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  btn: { borderRadius: 10, width: '100%' },
});
