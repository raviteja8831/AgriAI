import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Button, Divider } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../api';
import { colors } from '../utils/theme';

const TYPE_EMOJI = {
  weather: '🌤️',
  disease: '🐛',
  task: '📅',
  market: '📈',
  harvest: '🌾',
  system: '🔔',
};

const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then((r) => r.data),
  });

  const markReadMut = useMutation({
    mutationFn: notificationsAPI.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMut = useMutation({
    mutationFn: notificationsAPI.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || [];
  const unread = data?.unread || 0;

  if (isLoading) return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.screen}>
      {unread > 0 && (
        <View style={styles.headerRow}>
          <Text style={styles.unreadText}>{unread} unread</Text>
          <Button compact onPress={() => markAllReadMut.mutate()} loading={markAllReadMut.isPending}>
            Mark all read
          </Button>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(n) => String(n.id)}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={notifications.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, !item.is_read && styles.rowUnread]}
            onPress={() => !item.is_read && markReadMut.mutate(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{TYPE_EMOJI[item.type] || '🔔'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: colors.background },
  unreadText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  rowUnread: { backgroundColor: colors.primaryLight + '15' },
  emoji: { fontSize: 22 },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  message: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.info, marginTop: 6 },
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
});
