import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarAPI } from '../api';
import { colors } from '../utils/theme';

const TASK_EMOJI = { land_preparation: '⛏️', sowing: '🌱', fertilizer: '🧪', irrigation: '💧', pesticide: '🛡️', weeding: '✂️', harvesting: '⚙️', other: '📌' };

export default function CalendarScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({ queryKey: ['upcoming-tasks', 30], queryFn: () => calendarAPI.getUpcoming(30).then((r) => r.data) });
  const tasks = data?.tasks || [];

  const updateMut = useMutation({
    mutationFn: ({ id, status }) => calendarAPI.updateTask(id, { status }),
    onSuccess: () => qc.invalidateQueries(['upcoming-tasks', 30]),
  });

  const grouped = tasks.reduce((acc, t) => {
    const d = t.scheduled_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.summary}>
        <Text variant="bodyLarge" style={styles.summaryText}>
          📅 {tasks.filter((t) => t.status !== 'completed').length} pending tasks in the next 30 days
        </Text>
      </View>

      {Object.keys(grouped).length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text variant="titleMedium">No tasks scheduled</Text>
          <Text style={styles.emptySub}>Open a crop and generate a calendar</Text>
        </View>
      )}

      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayTasks]) => {
        const isToday = date === today;
        const done = dayTasks.filter((t) => t.status === 'completed').length;
        return (
          <Card key={date} style={[styles.card, isToday && styles.todayCard]}>
            <Card.Title
              title={isToday ? '🔴 TODAY' : new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
              subtitle={`${done}/${dayTasks.length} completed`}
              titleStyle={isToday ? styles.todayTitle : undefined}
            />
            <Card.Content>
              {dayTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskRow, task.status === 'completed' && styles.taskDone]}
                  onPress={() => updateMut.mutate({ id: task.id, status: task.status === 'completed' ? 'pending' : 'completed' })}
                >
                  <Text style={styles.taskEmoji}>{task.status === 'completed' ? '✅' : (TASK_EMOJI[task.task_type] || '📌')}</Text>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskName, task.status === 'completed' && styles.strike]}>{task.task_name}</Text>
                    {task.crop && <Text style={styles.taskCrop}>{task.crop.crop_name} {task.crop.farm?.name ? `— ${task.crop.farm.name}` : ''}</Text>}
                  </View>
                  <Chip compact textStyle={{ fontSize: 10 }}>{task.task_type?.replace('_', ' ')}</Chip>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        );
      })}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: { padding: 16, paddingBottom: 4 },
  summaryText: { color: colors.textSecondary },
  card: { margin: 12, marginBottom: 0, borderRadius: 12 },
  todayCard: { borderWidth: 2, borderColor: colors.primary },
  todayTitle: { color: colors.primary, fontWeight: '700' },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  taskDone: { opacity: 0.5 },
  taskEmoji: { fontSize: 20, marginRight: 10 },
  taskInfo: { flex: 1 },
  taskName: { fontWeight: '500', fontSize: 14 },
  taskCrop: { fontSize: 12, color: colors.textSecondary },
  strike: { textDecorationLine: 'line-through' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptySub: { color: colors.textSecondary, marginTop: 8 },
});
