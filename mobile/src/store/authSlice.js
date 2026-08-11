import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../utils/api';

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async () => {
  try {
    const [token, userStr] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('user'),
    ]);
    return { token, user: userStr ? JSON.parse(userStr) : null };
  } catch {
    return { token: null, user: null };
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null, isAuthenticated: false, loaded: false, freshLogin: false },
  reducers: {
    setCredentials(state, { payload }) {
      state.token = payload.token;
      // Merge so onboarded flag survives across token refreshes
      const merged = { ...(state.user || {}), ...payload.user };
      // Mark onboarded=true if user has a real name (not the phone placeholder)
      if (merged.name && merged.name !== merged.phone) {
        merged.onboarded = true;
      }
      state.user = merged;
      state.isAuthenticated = true;
      state.loaded = true;
      if (payload.token) AsyncStorage.setItem('token', payload.token).catch(() => {});
      AsyncStorage.setItem('user', JSON.stringify(state.user)).catch(() => {});
    },
    // Marks that the user just completed the login action (as opposed to
    // being auto-restored from stored auth on app launch), so the
    // "stay connected" screen can be shown once per fresh login.
    loginSuccess(state) {
      state.freshLogin = true;
    },
    acknowledgeConnect(state) {
      state.freshLogin = false;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loaded = true;
      state.freshLogin = false;
      setAuthToken(null);
      AsyncStorage.multiRemove(['token', 'user']).catch(() => {});
    },
    updateUser(state, { payload }) {
      state.user = { ...state.user, ...payload };
      if (state.user.name && state.user.name !== state.user.phone) {
        state.user.onboarded = true;
      }
      AsyncStorage.setItem('user', JSON.stringify(state.user)).catch(() => {});
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.loaded = false;
      })
      .addCase(loadStoredAuth.fulfilled, (state, { payload }) => {
        state.token = payload.token;
        state.user = payload.user;
        state.isAuthenticated = !!payload.token;
        state.loaded = true;
        setAuthToken(payload.token);
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.loaded = true; // don't hang on error
      });
  },
});

export const { setCredentials, loginSuccess, acknowledgeConnect, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
