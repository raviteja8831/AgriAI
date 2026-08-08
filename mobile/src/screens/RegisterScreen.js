import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, SegmentedButtons } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { authAPI } from '../api';
import { setCredentials } from '../store/authSlice';
import { colors } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', language: 'en' });
  const [loading, setLoading] = useState(false);
  const set = (f) => (v) => setForm((p) => ({ ...p, [f]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password) return;
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      dispatch(setCredentials(data));
    } catch {
      /* axios interceptor handles error snackbar */
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🌱</Text>
          <Text variant="headlineMedium" style={styles.title}>Join AgriAI</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Create your farmer account</Text>
        </View>
        <Surface style={styles.card} elevation={2}>
          <TextInput label="Full Name *" value={form.name} onChangeText={set('name')} mode="outlined" style={styles.input} left={<TextInput.Icon icon="account" />} />
          <TextInput label="Phone Number *" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" mode="outlined" style={styles.input} left={<TextInput.Icon icon="phone" />} />
          <TextInput label="Email (optional)" value={form.email} onChangeText={set('email')} keyboardType="email-address" mode="outlined" style={styles.input} left={<TextInput.Icon icon="email" />} />
          <TextInput label="Password *" value={form.password} onChangeText={set('password')} secureTextEntry mode="outlined" style={styles.input} left={<TextInput.Icon icon="lock" />} />
          <Text variant="labelLarge" style={styles.langLabel}>Preferred Language</Text>
          <SegmentedButtons
            value={form.language}
            onValueChange={set('language')}
            buttons={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिंदी' }, { value: 'te', label: 'తెలుగు' }]}
            style={styles.segmented}
          />
          <Button mode="contained" onPress={handleRegister} loading={loading} disabled={loading} style={styles.btn} contentStyle={styles.btnContent}>
            Register
          </Button>
          <Button mode="text" onPress={() => navigation.navigate('Login')} style={{ marginTop: 8 }}>
            Already registered? Login
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 56 },
  title: { color: colors.primary, fontWeight: '700', marginTop: 8 },
  subtitle: { color: colors.textSecondary, marginTop: 4 },
  card: { padding: 24, borderRadius: 16, backgroundColor: colors.surface },
  input: { marginBottom: 10, backgroundColor: colors.surface },
  langLabel: { marginBottom: 8, color: colors.textSecondary },
  segmented: { marginBottom: 16 },
  btn: { marginTop: 8, borderRadius: 8 },
  btnContent: { paddingVertical: 6 },
});
