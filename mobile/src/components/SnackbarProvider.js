import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';

const SnackbarContext = createContext(null);
export const useSnackbar = () => useContext(SnackbarContext);

const TYPE = {
  error:   { bg: '#c62828', icon: '❌', label: 'Error' },
  success: { bg: '#1b5e20', icon: '✅', label: 'Done' },
  warning: { bg: '#bf360c', icon: '⚠️', label: 'Warning' },
  info:    { bg: '#0d47a1', icon: 'ℹ️', label: 'Info' },
};

// Module-level ref so the axios interceptor can call it without being inside React
let _globalShow = null;
export const setGlobalSnackbar = (fn) => { _globalShow = fn; };
export const globalSnack = (message, type = 'error') => { _globalShow?.(message, type); };

export function SnackbarProvider({ children }) {
  const [queue, setQueue] = useState([]);

  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const show = useCallback((message, type = 'error', duration = 4000) => {
    const id = Date.now();
    setQueue((q) => [...q.slice(-1), { id, message, type, duration }]); // max 2 queued
  }, []);

  // Expose to axios interceptor
  React.useEffect(() => {
    setGlobalSnackbar(show);
    return () => setGlobalSnackbar(null);
  }, [show]);

  const current = queue[0];

  // Each snackbar gets its own dismiss timer tied to whichever one is
  // currently showing, so a later toast queuing up can't cancel an earlier
  // toast's timer and leave it stuck on screen.
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      setQueue((q) => q.filter((s) => s.id !== current.id));
    }, current.duration);
    return () => clearTimeout(timer);
  }, [current?.id]);

  const ctx = {
    show,
    showError:   (m, d) => show(m, 'error',   d),
    showSuccess: (m, d) => show(m, 'success', d),
    showWarning: (m, d) => show(m, 'warning', d),
    showInfo:    (m, d) => show(m, 'info',    d),
  };

  return (
    <SnackbarContext.Provider value={ctx}>
      {children}
      {current && (
        <View style={styles.wrapper} pointerEvents="box-none">
          <View style={[styles.bar, { backgroundColor: TYPE[current.type]?.bg || '#333' }]}>
            <Text style={styles.icon}>{TYPE[current.type]?.icon}</Text>
            <Text style={styles.msg} numberOfLines={3}>{current.message}</Text>
            <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SnackbarContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 16,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: 500,
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    gap: 10,
  },
  icon: { fontSize: 18 },
  msg:  { flex: 1, color: '#fff', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  closeBtn: { paddingLeft: 8 },
  closeText: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '700' },
});
