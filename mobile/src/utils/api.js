import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { globalSnack } from '../components/SnackbarProvider';
import MESSAGES from '../config/messages.json';

const BACKEND_PORT = 5000;

const getBaseUrl = () => {
  if (Platform.OS === 'web') return `http://localhost:${BACKEND_PORT}/api`;
  if (__DEV__) {
    const expoHost =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost;
    if (expoHost) return `http://${expoHost.split(':')[0]}:${BACKEND_PORT}/api`;
    return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }
  return 'http://192.168.29.160:5000/api'; // Patched by setip.js
};

export const BASE_URL = getBaseUrl();

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: resolve message → snackbar ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const silent = error.config?._silent === true;
    let message = null;

    if (!error.response) {
      // Network / timeout / CORS / server down
      const code = error.code || 'ERR_NETWORK';
      message = MESSAGES.network[code] || MESSAGES.network.ERR_NETWORK;
    } else {
      const { status, data } = error.response;

      if (status === 401) {
        await AsyncStorage.multiRemove(['token', 'user']).catch(() => {});
      }

      if (data?.message && MESSAGES.api[data.message]) {
        // Known API error string
        message = MESSAGES.api[data.message];
      } else if (Array.isArray(data?.errors) && data.errors[0]) {
        // Express-validator errors array
        const e = data.errors[0];
        message = MESSAGES.validation[e.path || e.param] || e.msg || e.message;
      } else if (data?.message && data.message.length < 120) {
        // Raw backend message (short enough to show)
        message = data.message;
      } else {
        // HTTP status fallback
        message = MESSAGES.http[String(status)] || `Request failed (${status})`;
      }
    }

    if (!silent && message) globalSnack(message, 'error');
    return Promise.reject(error);
  }
);

export default api;
