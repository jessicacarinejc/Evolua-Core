import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, BodyMetric, ProgressOverview, WorkoutHistoryItem } from '../api/client';
import { theme } from '../theme';

type Props = {
  token: string | null;
};

function numberFromText(value: string) {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

export function ProgressScreen({ token }: Props) {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');

  const load = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [overviewResult, metricResult, workoutResult] = await Promise.all([
        api.getProgressOverview(token),
        api.getBodyMetrics(token),
        api.getWorkoutHistory(token),
      ]);
      setOverview(overviewResult);
      setMetrics(metricResult);
      setWorkouts(workoutResult);
    } catch (cause) {
      Alert.alert('Evolução indisponível', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const saveMetric = async () => {
    if (!token) return;
    const input = {
      weightKg: numberFromText(weight),
      bodyFatPercent: numberFromText(bodyFat),
      waistCm: numberFromText(waist),
    };
    if (input.weightKg == null && input.bodyFatPercent == null && input.waistCm == null) {
      Alert.alert('Informe uma medida', 'Preencha pelo menos peso, percentual de gordura ou cintura.');
      return;
    }

    setSaving(true);
    try {
      await api.saveBodyMetric(token, input);
      setWeight('');
      setBodyFat('');
      setWaist('');
      await load();
    } catch (cause) {
      Alert.alert('Medida não salva', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.lime} />
        <Text style={styles.loadingText}>Carregando evolução...</Text>
      </View>
    );
  }

  const change = overview?.weight.changeKg;
  const changeText = change == null ? 'sem comparação' : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>EVOLUÇÃO</Text>
      <Text style={styles.title}>Seu histórico em um só lugar</Text>
      <Text style={styles.subtitle}>Acompanhe medidas, frequência de treino, volume e percepção de esforço sem transformar uma única medida em diagnóstico.</Text>

      <View style={styles.grid}>
        <StatCard
          label="Peso atual"
          value={overview?.weight.currentKg == null ? '—' : `${overview.weight.currentKg.toFixed(1)} kg`}
          detail={changeText}
        />
        <StatCard
          label="Treinos na semana"
          value={String(overview?.workouts.completedThisWeek ?? 0)}
          detail={`${overview?.workouts.completedTotal ?? 0} concluídos no total`}
        />
        <StatCard
          label="Volume semanal"
          value={`${Math.round(overview?.workouts.volumeThisWeekKg ?? 0)} kg`}
          detail="carga × repetições registradas"
        />
        <StatCard
          label="RPE médio"
          value={overview?.workouts.averageRpe == null ? '—' : overview.workouts.averageRpe.toFixed(1)}
          detail="esforço percebido nas sessões"
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionEyebrow}>NOVA MEDIDA</Text>
        <Text style={styles.sectionTitle}>Registrar evolução corporal</Text>
        <Text style={styles.helper}>Registre apenas o que você mediu. O acompanhamento de tendência é mais útil do que variações de um único dia.</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Peso (kg)</Text>
            <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="74,2" style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gordura (%)</Text>
            <TextInput value={bodyFat} onChangeText={setBodyFat} keyboardType="decimal-pad" placeholder="—" style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cintura (cm)</Text>
            <TextInput value={waist} onChangeText={setWaist} keyboardType="decimal-pad" placeholder="—" style={styles.input} />
          </View>
        </View>
        <TouchableOpacity disabled={saving} onPress={saveMetric} style={styles.primaryButton}>
          {saving ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Salvar medida</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitleOutside}>Histórico corporal</Text>
      {metrics.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyText}>Nenhuma medida registrada ainda.</Text></View>
      ) : metrics.slice(0, 8).map((metric) => (
        <View key={metric.id} style={styles.historyCard}>
          <View>
            <Text style={styles.historyDate}>{formatDate(metric.measuredAt)}</Text>
            <Text style={styles.historyMain}>{metric.weightKg == null ? 'Peso não informado' : `${metric.weightKg.toFixed(1)} kg`}</Text>
          </View>
          <View style={styles.historyMetaArea}>
            {metric.waistCm != null ? <Text style={styles.historyMeta}>Cintura {metric.waistCm.toFixed(1)} cm</Text> : null}
            {metric.bodyFatPercent != null ? <Text style={styles.historyMeta}>Gordura {metric.bodyFatPercent.toFixed(1)}%</Text> : null}
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitleOutside}>Treinos recentes</Text>
      {workouts.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyText}>Conclua treinos para formar seu histórico.</Text></View>
      ) : workouts.slice(0, 10).map((workout) => (
        <View key={workout.id} style={styles.workoutCard}>
          <Text style={styles.workoutDate}>{formatDate(workout.completedAt)}</Text>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          <Text style={styles.workoutMeta}>{workout.durationMinutes} min · {workout.completedSets} séries · RPE {workout.perceivedEffort ?? '—'}</Text>
          {workout.volumeKg > 0 ? <Text style={styles.workoutVolume}>Volume registrado: {workout.volumeKg.toFixed(0)} kg</Text> : null}
        </View>
      ))}

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Use tendências, não números isolados</Text>
        <Text style={styles.noticeText}>Peso e medidas podem oscilar por hidratação, horário, ciclo, alimentação e outros fatores. O app acompanha a evolução, mas não substitui avaliação profissional.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, gap: 12 },
  loadingText: { color: theme.colors.textMuted, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 44, backgroundColor: theme.colors.background },
  eyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: theme.colors.navy, fontSize: 29, fontWeight: '900', marginTop: 6 },
  subtitle: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, padding: 15, marginBottom: 10 },
  statLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '800' },
  statValue: { color: theme.colors.navy, fontSize: 20, fontWeight: '900', marginTop: 5 },
  statDetail: { color: theme.colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  formCard: { backgroundColor: theme.colors.navy, borderRadius: 20, padding: 18, marginTop: 10 },
  sectionEyebrow: { color: theme.colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  sectionTitle: { color: theme.colors.white, fontSize: 19, fontWeight: '900', marginTop: 5 },
  helper: { color: '#C8D4E3', fontSize: 11, lineHeight: 17, marginTop: 7 },
  inputRow: { flexDirection: 'row', gap: 7, marginTop: 14 },
  inputGroup: { flex: 1 },
  inputLabel: { color: '#C8D4E3', fontSize: 9, fontWeight: '800', marginBottom: 5 },
  input: { backgroundColor: theme.colors.white, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 10, color: theme.colors.text },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 13 },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900' },
  sectionTitleOutside: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 9 },
  emptyCard: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, padding: 15 },
  emptyText: { color: theme.colors.textMuted, fontSize: 12 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, padding: 14, marginBottom: 8 },
  historyDate: { color: theme.colors.textMuted, fontSize: 9 },
  historyMain: { color: theme.colors.navy, fontSize: 16, fontWeight: '900', marginTop: 3 },
  historyMetaArea: { alignItems: 'flex-end' },
  historyMeta: { color: theme.colors.textMuted, fontSize: 10, marginTop: 2 },
  workoutCard: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 15, marginBottom: 9 },
  workoutDate: { color: theme.colors.lime, fontSize: 9, fontWeight: '900' },
  workoutTitle: { color: theme.colors.navy, fontSize: 15, fontWeight: '900', marginTop: 4, textTransform: 'capitalize' },
  workoutMeta: { color: theme.colors.textMuted, fontSize: 10, marginTop: 4 },
  workoutVolume: { color: theme.colors.text, fontSize: 10, fontWeight: '800', marginTop: 7 },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: 16, padding: 16, marginTop: 18 },
  noticeTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 13 },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});
