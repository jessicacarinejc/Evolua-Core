import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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

export function WeeklyWorkoutCard({ token }: Props) {
  const [week, setWeek] = useState<WeeklyPlan | null>(null);
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
        setError('A API demorou para responder. Confira a rede local e tente novamente.');
      } else {
        setError('Não foi possível carregar sua semana. Verifique a conexão com a API local e tente novamente.');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

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
});