import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, WorkoutHistoryItem } from '../api/client';
import { theme } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/v1';
const REQUEST_TIMEOUT_MS = 10_000;

type WeeklyStatus =
  | 'concluido'
  | 'descanso'
  | 'nao_realizado'
  | 'planejado'
  | 'aguarda_checkin'
  | 'pronto'
  | 'adaptado'
  | 'recuperacao'
  | 'revisao_profissional';

type WeeklyPlan = {
  weekStart: string;
  weekEnd: string;
  preferredDaysPerWeek: number;
  sessionMinutes: number;
  days: Array<{
    date: string;
    weekday: string;
    scheduled: boolean;
    split: string;
    status: WeeklyStatus;
    estimatedMinutes: number | null;
    isToday: boolean;
  }>;
  policy: {
    checkinOverridesCalendar: boolean;
    note: string;
  };
};

type Props = {
  token: string;
};

const statusLabels: Record<WeeklyStatus, string> = {
  concluido: 'Concluído',
  descanso: 'Descanso',
  nao_realizado: 'Não realizado',
  planejado: 'Planejado',
  aguarda_checkin: 'Aguarda check-in',
  pronto: 'Pronto',
  adaptado: 'Adaptado',
  recuperacao: 'Recuperação',
  revisao_profissional: 'Revisão profissional',
};

function deltaLabel(current: number, previous: number, suffix = '') {
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return `igual${suffix ? ` · ${current.toFixed(1)}${suffix}` : ''}`;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1).replace('.', ',')}${suffix}`;
}

function RecentWorkoutComparison({ history }: { history: WorkoutHistoryItem[] }) {
  if (history.length < 2) return null;
  const [latest, previous] = history;
  return (
    <View style={styles.comparisonCard}>
      <Text style={styles.comparisonEyebrow}>EVOLUÇÃO RECENTE</Text>
      <Text style={styles.comparisonTitle}>Último treino × treino anterior</Text>
      <Text style={styles.comparisonSubtitle}>Comparação simples do que você realmente registrou. Mais carga ou volume não significa automaticamente treino melhor.</Text>
      <View style={styles.comparisonGrid}>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonValue}>{latest.completedSets}</Text>
          <Text style={styles.comparisonLabel}>blocos</Text>
          <Text style={styles.comparisonDelta}>{deltaLabel(latest.completedSets, previous.completedSets)}</Text>
        </View>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonValue}>{latest.durationMinutes} min</Text>
          <Text style={styles.comparisonLabel}>duração</Text>
          <Text style={styles.comparisonDelta}>{deltaLabel(latest.durationMinutes, previous.durationMinutes, ' min')}</Text>
        </View>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonValue}>{latest.volumeKg.toFixed(0)} kg</Text>
          <Text style={styles.comparisonLabel}>volume</Text>
          <Text style={styles.comparisonDelta}>{deltaLabel(latest.volumeKg, previous.volumeKg, ' kg')}</Text>
        </View>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonValue}>RPE {latest.perceivedEffort ?? '—'}</Text>
          <Text style={styles.comparisonLabel}>esforço</Text>
          <Text style={styles.comparisonDelta}>
            {latest.perceivedEffort != null && previous.perceivedEffort != null
              ? deltaLabel(latest.perceivedEffort, previous.perceivedEffort)
              : 'sem comparação'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function WeeklyWorkoutCard({ token }: Props) {
  const [week, setWeek] = useState<WeeklyPlan | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_URL}/workouts/week`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = Array.isArray(payload?.message)
          ? payload.message.join('\n')
          : payload?.message ?? 'Não foi possível carregar o planejamento semanal.';
        throw new Error(message);
      }
      setWeek(payload as WeeklyPlan);
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') {
        setError('A resposta demorou mais que o esperado. Tente novamente.');
      } else {
        setError('Não foi possível carregar sua semana agora. Tente novamente.');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [token]);

  const loadHistory = useCallback(async () => {
    try {
      const workouts = await api.getWorkoutHistory(token);
      setHistory(workouts.slice(0, 2));
    } catch {
      setHistory([]);
    }
  }, [token]);

  useEffect(() => {
    void loadWeek();
    void loadHistory();
  }, [loadHistory, loadWeek]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>PLANEJAMENTO SEMANAL</Text>
      <Text style={styles.title}>Sua semana de treinos</Text>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.lime} />
          <Text style={styles.muted}>Carregando semana...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadWeek()}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : week ? (
        <>
          <Text style={styles.summary}>{week.preferredDaysPerWeek} dias/semana · sessões de até {week.sessionMinutes} min</Text>
          <View style={styles.daysRow}>
            {week.days.map((day) => (
              <View key={day.date} style={[styles.day, day.isToday ? styles.today : undefined]}>
                <Text style={[styles.weekday, day.isToday ? styles.todayText : undefined]}>{day.weekday}</Text>
                <Text style={[styles.split, day.isToday ? styles.todayText : undefined]} numberOfLines={1}>{day.split}</Text>
                <Text style={[styles.status, day.isToday ? styles.todayText : undefined]} numberOfLines={2}>{statusLabels[day.status]}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.note}>{week.policy.note}</Text>
        </>
      ) : (
        <Text style={styles.muted}>Nenhum planejamento disponível para esta semana.</Text>
      )}

      <RecentWorkoutComparison history={history} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.navy, borderRadius: 20, padding: 18, marginBottom: 18 },
  eyebrow: { color: theme.colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: theme.colors.white, fontSize: 20, fontWeight: '900', marginTop: 5 },
  summary: { color: '#C8D4E3', fontSize: 12, marginTop: 6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  muted: { color: '#C8D4E3', fontSize: 12, marginTop: 12 },
  errorBox: { marginTop: 12 },
  error: { color: '#FFD5D5', fontSize: 12, lineHeight: 18 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: theme.colors.lime, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10 },
  retryButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 11 },
  daysRow: { flexDirection: 'row', gap: 5, marginTop: 14 },
  day: { flex: 1, minHeight: 86, backgroundColor: '#23436D', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center' },
  today: { backgroundColor: theme.colors.lime },
  weekday: { color: theme.colors.white, fontSize: 10, fontWeight: '900' },
  split: { color: '#D9E2ED', fontSize: 8, marginTop: 7, textTransform: 'capitalize' },
  status: { color: '#C8D4E3', fontSize: 8, lineHeight: 10, textAlign: 'center', marginTop: 5 },
  todayText: { color: theme.colors.navyDark },
  note: { color: '#C8D4E3', fontSize: 10, lineHeight: 16, marginTop: 12 },
  comparisonCard: { backgroundColor: '#17385D', borderRadius: 16, padding: 13, marginTop: 15, borderWidth: 1, borderColor: '#2D527B' },
  comparisonEyebrow: { color: theme.colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  comparisonTitle: { color: theme.colors.white, fontSize: 14, fontWeight: '900', marginTop: 3 },
  comparisonSubtitle: { color: '#AFC0D1', fontSize: 9, lineHeight: 14, marginTop: 4 },
  comparisonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  comparisonItem: { width: '48%', backgroundColor: '#0F2B4F', borderRadius: 12, padding: 10 },
  comparisonValue: { color: theme.colors.white, fontSize: 15, fontWeight: '900' },
  comparisonLabel: { color: '#AFC0D1', fontSize: 8, marginTop: 2 },
  comparisonDelta: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', marginTop: 5 },
});
