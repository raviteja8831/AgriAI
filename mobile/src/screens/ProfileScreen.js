import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, TextInput, Button, Avatar, Divider, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from '../components/SnackbarProvider';
import { authAPI } from '../api';
import { logout, updateUser } from '../store/authSlice';
import { colors } from '../utils/theme';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const snack = useSnackbar();
  const { user } = useSelector((s) => s.auth);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', language: user?.language || 'en' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });

  const profileMut = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: () => { dispatch(updateUser(profileForm)); snack.showSuccess('Profile updated!'); },
  });

  const pwMut = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => { setPwForm({ current_password: '', new_password: '', confirm: '' }); snack.showSuccess('Password changed!'); },
  });

  const handleLogout = () => Alert.alert('Logout', 'Are you sure you want to logout?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) }]);
  const handlePwChange = () => {
    if (pwForm.new_password !== pwForm.confirm) return snack.showError('Passwords do not match');
    pwMut.mutate({ current_password: pwForm.current_password, new_password: pwForm.new_password });
  };

  const setP = (f) => (v) => setProfileForm((p) => ({ ...p, [f]: v }));
  const setPw = (f) => (v) => setPwForm((p) => ({ ...p, [f]: v }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={72} label={user?.name?.[0]?.toUpperCase() || 'F'} style={styles.avatar} />
        <Text variant="titleLarge" style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Title title="Edit Profile" />
        <Card.Content>
          <TextInput label="Full Name" value={profileForm.name} onChangeText={setP('name')} mode="outlined" style={styles.input} />
          <TextInput label="Email" value={profileForm.email} onChangeText={setP('email')} keyboardType="email-address" mode="outlined" style={styles.input} />
          <Text style={styles.langLabel}>Language</Text>
          <SegmentedButtons
            value={profileForm.language}
            onValueChange={setP('language')}
            buttons={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिंदी' }, { value: 'te', label: 'తెలుగు' }]}
            style={{ marginBottom: 12 }}
          />
          <Button mode="contained" loading={profileMut.isPending} onPress={() => profileMut.mutate(profileForm)} style={styles.btn}>Save Changes</Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Change Password" />
        <Card.Content>
          <TextInput label="Current Password" value={pwForm.current_password} onChangeText={setPw('current_password')} secureTextEntry mode="outlined" style={styles.input} />
          <TextInput label="New Password" value={pwForm.new_password} onChangeText={setPw('new_password')} secureTextEntry mode="outlined" style={styles.input} />
          <TextInput label="Confirm New Password" value={pwForm.confirm} onChangeText={setPw('confirm')} secureTextEntry mode="outlined" style={styles.input} />
          <Button mode="contained" buttonColor={colors.secondary} loading={pwMut.isPending} onPress={handlePwChange} style={styles.btn}>Change Password</Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { marginBottom: 32 }]}>
        <Card.Content>
          <Button mode="outlined" textColor={colors.error} icon="logout" onPress={handleLogout}>Logout</Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: 32, alignItems: 'center' },
  avatar: { backgroundColor: colors.secondary, marginBottom: 12 },
  name: { color: '#fff', fontWeight: '700' },
  phone: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  role: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  card: { margin: 12, marginBottom: 0, borderRadius: 12 },
  input: { marginBottom: 10, backgroundColor: colors.surface },
  langLabel: { color: colors.textSecondary, marginBottom: 8, fontSize: 13 },
  btn: { marginTop: 4, borderRadius: 8 },
});
