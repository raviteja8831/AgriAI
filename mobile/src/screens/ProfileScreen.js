import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, Card, TextInput, Button, Avatar, Divider, ActivityIndicator, Menu } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from '../components/SnackbarProvider';
import { authAPI } from '../api';
import { updateUser } from '../store/authSlice';
import { colors } from '../utils/theme';
import { BASE_URL } from '../utils/api';
import { capitalize } from '../utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const snack = useSnackbar();
  const { user } = useSelector((s) => s.auth);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [savedProfile, setSavedProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [pwFormOpen, setPwFormOpen] = useState(false);
  const [pwVisible, setPwVisible] = useState({ current_password: false, new_password: false, confirm: false });
  const togglePwVisible = (f) => setPwVisible((p) => ({ ...p, [f]: !p[f] }));

  const profileMut = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: () => { dispatch(updateUser(profileForm)); setSavedProfile(profileForm); snack.showSuccess('Profile updated!'); },
  });

  const pwMut = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      dispatch(updateUser({ has_password: true }));
      setPwForm({ current_password: '', new_password: '', confirm: '' });
      setPwVisible({ current_password: false, new_password: false, confirm: false });
      setPwFormOpen(false);
      snack.showSuccess(user?.has_password ? 'Password changed!' : 'Password set!');
    },
  });

  const avatarMut = useMutation({
    mutationFn: authAPI.uploadAvatar,
    onSuccess: (res) => { dispatch(updateUser({ profile_image: res.data.profile_image })); snack.showSuccess('Profile photo updated!'); },
  });

  const uploadAvatarAsset = async (asset) => {
    const fd = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(asset.uri)).blob();
      fd.append('avatar', blob, asset.fileName || 'avatar.jpg');
    } else {
      fd.append('avatar', { uri: asset.uri, type: 'image/jpeg', name: 'avatar.jpg' });
    }
    avatarMut.mutate(fd);
  };

  const captureWebPhoto = () =>
    new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = () => resolve(input.files?.[0] || null);
      input.click();
    });

  const handleTakePhoto = async () => {
    setAvatarMenuVisible(false);
    if (Platform.OS === 'web') {
      // expo-image-picker's web shim sets the non-standard capture="camera",
      // which Chrome ignores; drive the file input directly so it opens the camera.
      const file = await captureWebPhoto();
      if (!file) return;
      const fd = new FormData();
      fd.append('avatar', file, file.name || 'avatar.jpg');
      avatarMut.mutate(fd);
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return snack.showWarning('Permission denied — please allow camera access in Settings');
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    uploadAvatarAsset(result.assets[0]);
  };

  const handlePickFromLibrary = async () => {
    setAvatarMenuVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return snack.showWarning('Permission denied — please allow photo access in Settings');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    uploadAvatarAsset(result.assets[0]);
  };

  const handlePwChange = () => {
    if (user?.has_password && !pwForm.current_password) return snack.showError('Please enter your current password');
    if (pwForm.new_password.length < 8) return snack.showError('Password must be at least 8 characters');
    if (pwForm.new_password !== pwForm.confirm) return snack.showError('Passwords do not match');
    pwMut.mutate({ current_password: pwForm.current_password, new_password: pwForm.new_password });
  };

  const profileDirty = profileForm.name !== savedProfile.name || profileForm.email !== savedProfile.email;
  const pwValid = (!user?.has_password || pwForm.current_password) && pwForm.new_password.length >= 8 && pwForm.new_password === pwForm.confirm;

  const setP = (f) => (v) => setProfileForm((p) => ({ ...p, [f]: v }));
  const setPw = (f) => (v) => setPwForm((p) => ({ ...p, [f]: v }));
  const handleSaveProfile = () => {
    if (!EMAIL_RE.test(profileForm.email.trim())) return snack.showError('Please enter a valid email address');
    const form = { ...profileForm, name: capitalize(profileForm.name) };
    setProfileForm(form);
    profileMut.mutate({ ...form, language: user?.language });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Menu
          visible={avatarMenuVisible}
          onDismiss={() => setAvatarMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setAvatarMenuVisible(true)} activeOpacity={0.7} disabled={avatarMut.isPending}>
              {user?.profile_image ? (
                <Avatar.Image size={72} source={{ uri: `${BASE_URL.replace('/api', '')}${user.profile_image}` }} style={styles.avatar} />
              ) : (
                <Avatar.Text size={72} label={user?.name?.[0]?.toUpperCase() || 'F'} style={styles.avatar} />
              )}
              <View style={styles.avatarEditBadge}>
                {avatarMut.isPending ? <ActivityIndicator size={12} color="#fff" /> : <Text style={styles.avatarEditIcon}>📷</Text>}
              </View>
            </TouchableOpacity>
          }
        >
          <Menu.Item leadingIcon="camera" onPress={handleTakePhoto} title="Take Photo" />
          <Menu.Item leadingIcon="image" onPress={handlePickFromLibrary} title="Choose from Library" />
        </Menu>
        <Text variant="titleLarge" style={styles.name}>{capitalize(user?.name)}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Title title="Edit Profile" />
        <Card.Content>
          <TextInput label="Full Name" value={profileForm.name} onChangeText={setP('name')} mode="outlined" style={styles.input} />
          <TextInput label="Email" value={profileForm.email} onChangeText={setP('email')} keyboardType="email-address" mode="outlined" style={styles.input} />
          <Button mode="contained" loading={profileMut.isPending} disabled={!profileDirty || profileMut.isPending} onPress={handleSaveProfile} style={styles.btn}>Save Changes</Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title={user?.has_password ? 'Change Password' : 'Set a Password'} />
        <Card.Content>
          {!pwFormOpen ? (
            <Button mode="outlined" onPress={() => setPwFormOpen(true)} style={styles.btn}>
              {user?.has_password ? 'Change Password' : 'Set Password'}
            </Button>
          ) : (
            <>
              {!user?.has_password && (
                <Text style={styles.pwHint}>You signed in with OTP and don't have a password yet. Set one here if you'd like the option to log in with a password too.</Text>
              )}
              {user?.has_password && (
                <TextInput
                  label="Current Password"
                  value={pwForm.current_password}
                  onChangeText={setPw('current_password')}
                  secureTextEntry={!pwVisible.current_password}
                  mode="outlined"
                  style={styles.input}
                  right={<TextInput.Icon icon={pwVisible.current_password ? 'eye-off' : 'eye'} onPress={() => togglePwVisible('current_password')} forceTextInputFocus={false} />}
                />
              )}
              <TextInput
                label="New Password"
                value={pwForm.new_password}
                onChangeText={setPw('new_password')}
                secureTextEntry={!pwVisible.new_password}
                mode="outlined"
                style={styles.input}
                right={<TextInput.Icon icon={pwVisible.new_password ? 'eye-off' : 'eye'} onPress={() => togglePwVisible('new_password')} forceTextInputFocus={false} />}
              />
              <TextInput
                label="Confirm New Password"
                value={pwForm.confirm}
                onChangeText={setPw('confirm')}
                secureTextEntry={!pwVisible.confirm}
                mode="outlined"
                style={styles.input}
                right={<TextInput.Icon icon={pwVisible.confirm ? 'eye-off' : 'eye'} onPress={() => togglePwVisible('confirm')} forceTextInputFocus={false} />}
              />
              <Button mode="contained" buttonColor={colors.secondary} loading={pwMut.isPending} disabled={!pwValid || pwMut.isPending} onPress={handlePwChange} style={styles.btn}>{user?.has_password ? 'Change Password' : 'Set Password'}</Button>
              <Button
                mode="text"
                onPress={() => { setPwFormOpen(false); setPwForm({ current_password: '', new_password: '', confirm: '' }); setPwVisible({ current_password: false, new_password: false, confirm: false }); }}
                style={styles.btn}
              >
                Cancel
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: 32, alignItems: 'center' },
  avatar: { backgroundColor: colors.secondary, marginBottom: 12 },
  avatarEditBadge: {
    position: 'absolute', bottom: 12, right: -2, width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.info, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarEditIcon: { fontSize: 11 },
  name: { color: '#fff', fontWeight: '700' },
  phone: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  role: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  card: { margin: 12, marginBottom: 0, borderRadius: 12 },
  input: { marginBottom: 10, backgroundColor: colors.surface },
  pwHint: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  btn: { marginTop: 4, borderRadius: 8 },
});
