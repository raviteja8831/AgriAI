import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../utils/theme';
import { TERMS_SECTIONS } from '../constants/terms';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {TERMS_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.heading}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  section: { marginBottom: 20 },
  heading: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
});
