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
import { api } from '../api/client';
import { OnboardingData, PrimaryGoal, TrainingLevel, initialOnboardingData } from '../onboarding/types';
import { theme } from '../theme';

type Props = {
  token: string | null;
  profile: OnboardingData | null;
  onProfileUpdated: (profile: OnboardingData) => void;
};

const goals: Array<{ key: PrimaryGoal; label: string }> = [
  { key: 'emagrecimento', label: 'Emagrecimento' },
  { key: 'hipertrofia', label: 'Hipertrofia' },
  { key: 'forca', label: 'Força' },
  { key: 'condicionamento', label: 'Condicionamento' },
  { key: 'manutencao', label: 'Manutenção' },
];

const levels: Array<{ key: TrainingLevel; label: string }> = [
  { key: 'iniciante', label: 'Iniciante' },
  { key: 'intermediario', label: 'Intermediário' },
  { key: 'avancado', label: 'Avançado' },
];

function joinList(values: string[]) {
  return values.join(', ');
}

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, items) => items.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index);
}

export function ProfileScreen({ token, profile, onProfileUpdated }: Props) {
  const [form, setForm] = useState<OnboardingData>(profile ?? initialOnboardingData);
  const [equipment, setEquipment] = useState(joinList(profile?.equipment ?? []));
  const [conditions, setConditions] = useState(joinList(profile?.healthConditions ?? []));
  const [painAreas, setPainAreas] = useState(joinList(profile?.painAreas ?? []));
  const [restrictions, setRestrictions] = useState(joinList(profile?.foodRestrictions ?? []));
  const [loading, setLoading] = useState(!profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm(profile);
      setEquipment(joinList(profile.equipment));
      setConditions(joinList(profile.healthConditions));
      setPainAreas(joinList(profile.painAreas));
      setRestrictions(joinList(profile.foodRestrictions));
      setLoading(false);
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const latest = await api.getProfile(token);
        if (latest) {
          setForm(latest);
          setEquipment(joinList(latest.equipment));
          setConditions(joinList(latest.healthConditions));
          setPainAreas(joinList(latest.painAreas));
          setRestrictions(joinList(latest.foodRestrictions));
          onProfileUpdated(latest);
        }
      } catch (cause) {
        Alert.alert('Perfil indisponível', cause instanceof Error ? cause.message : 'Tente novamente.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const save = async () => {
    if (!token) return;
    if (!form.displayName.trim() || !form.birthDate.trim() || !form.heightCm.trim() || !form.weightKg.trim() || !form.primaryGoal || !form.trainingLevel) {
      Alert.alert('Dados incompletos', 'Preencha nome, nascimento, altura, peso, objetivo e nível de treino.');
      return;
    }
    const payload: OnboardingData = {
      ...form,
      equipment: splitList(equipment),
      healthConditions: splitList(conditions),
      painAreas: splitList(painAreas),
      foodRestrictions: splitList(restrictions),
    };

    setSaving(true);
    try {
      const result = await api.updateProfile(token, payload);
      if (result.profile) {
        setForm(result.profile);
        setEquipment(joinList(result.profile.equipment));
        setConditions(joinList(result.profile.healthConditions));
        setPainAreas(joinList(result.profile.painAreas));
        setRestrictions(joinList(result.profile.foodRestrictions));
        onProfileUpdated(result.profile);
      }
      if (result.next === 'professional_review') {
        Alert.alert('Perfil salvo', 'As informações foram atualizadas. Algumas condições informadas exigem revisão profissional antes de recomendações automáticas.');
      } else {
        Alert.alert('Perfil salvo', 'Suas preferências foram atualizadas. Os próximos treinos usarão essas informações.');
      }
    } catch (cause) {
      Alert.alert('Perfil não salvo', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.lime} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>PERFIL</Text>
      <Text style={styles.title}>Suas preferências e informações</Text>
      <Text style={styles.subtitle}>Alterações de objetivo, disponibilidade, equipamentos, dores e restrições passam a ser consideradas nas próximas recomendações automáticas.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dados pessoais</Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput value={form.displayName} onChangeText={(value) => setForm((current) => ({ ...current, displayName: value }))} style={styles.input} placeholder="Seu nome" />
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Nascimento</Text>
            <TextInput value={form.birthDate} onChangeText={(value) => setForm((current) => ({ ...current, birthDate: value }))} style={styles.input} placeholder="DD/MM/AAAA" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Altura (cm)</Text>
            <TextInput value={form.heightCm} onChangeText={(value) => setForm((current) => ({ ...current, heightCm: value }))} keyboardType="decimal-pad" style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput value={form.weightKg} onChangeText={(value) => setForm((current) => ({ ...current, weightKg: value }))} keyboardType="decimal-pad" style={styles.input} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Objetivo</Text>
        <View style={styles.chips}>
          {goals.map((goal) => (
            <TouchableOpacity key={goal.key} onPress={() => setForm((current) => ({ ...current, primaryGoal: goal.key }))} style={[styles.chip, form.primaryGoal === goal.key && styles.chipActive]}>
              <Text style={[styles.chipText, form.primaryGoal === goal.key && styles.chipTextActive]}>{goal.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Nível de treino</Text>
        <View style={styles.chips}>
          {levels.map((level) => (
            <TouchableOpacity key={level.key} onPress={() => setForm((current) => ({ ...current, trainingLevel: level.key }))} style={[styles.chip, form.trainingLevel === level.key && styles.chipActive]}>
              <Text style={[styles.chipText, form.trainingLevel === level.key && styles.chipTextActive]}>{level.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Rotina de treino</Text>
        <Text style={styles.label}>Dias por semana: {form.trainingDaysPerWeek}</Text>
        <View style={styles.numberRow}>
          {[2, 3, 4, 5, 6].map((value) => (
            <TouchableOpacity key={value} onPress={() => setForm((current) => ({ ...current, trainingDaysPerWeek: value }))} style={[styles.numberButton, form.trainingDaysPerWeek === value && styles.numberButtonActive]}>
              <Text style={[styles.numberText, form.trainingDaysPerWeek === value && styles.numberTextActive]}>{value}x</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Duração preferida: {form.sessionMinutes} min</Text>
        <View style={styles.numberRow}>
          {[20, 30, 45, 60, 75].map((value) => (
            <TouchableOpacity key={value} onPress={() => setForm((current) => ({ ...current, sessionMinutes: value }))} style={[styles.numberButton, form.sessionMinutes === value && styles.numberButtonActive]}>
              <Text style={[styles.numberText, form.sessionMinutes === value && styles.numberTextActive]}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Equipamentos</Text>
        <Text style={styles.helper}>Separe por vírgulas. Ex.: academia completa, halteres, elástico.</Text>
        <TextInput value={equipment} onChangeText={setEquipment} style={[styles.input, styles.multiInput]} multiline />

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Dores ou regiões sensíveis</Text>
        <Text style={styles.helper}>Ex.: joelho, lombar, ombro. Isso pode reduzir amplitude, impacto ou bloquear exercícios.</Text>
        <TextInput value={painAreas} onChangeText={setPainAreas} style={[styles.input, styles.multiInput]} multiline />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Saúde</Text>
        <Text style={styles.helper}>Informe condições relevantes separadas por vírgulas. Condições confirmadas por profissional não são removidas por esta tela.</Text>
        <TextInput value={conditions} onChangeText={setConditions} style={[styles.input, styles.multiInput]} multiline />

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Restrições alimentares</Text>
        <Text style={styles.helper}>Alergias e bloqueios já registrados são preservados pelo sistema mesmo se forem apagados aqui. Para removê-los, será necessário um fluxo específico de revisão.</Text>
        <TextInput value={restrictions} onChangeText={setRestrictions} style={[styles.input, styles.multiInput]} multiline />
      </View>

      <TouchableOpacity disabled={saving} onPress={save} style={styles.primaryButton}>
        {saving ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Salvar alterações</Text>}
      </TouchableOpacity>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Segurança</Text>
        <Text style={styles.noticeText}>O perfil serve para personalização e regras de segurança. O aplicativo não usa essa edição para alterar medicamentos, diagnóstico ou substituir avaliação profissional.</Text>
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
  subtitle: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 16 },
  card: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  sectionTitle: { color: theme.colors.navy, fontSize: 16, fontWeight: '900' },
  sectionSpacing: { marginTop: 18 },
  label: { color: theme.colors.text, fontSize: 10, fontWeight: '800', marginTop: 12, marginBottom: 5 },
  helper: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 11, color: theme.colors.text, backgroundColor: '#F9FBFD' },
  multiInput: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 7 },
  field: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  chipActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  chipText: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '800' },
  chipTextActive: { color: theme.colors.white },
  numberRow: { flexDirection: 'row', gap: 7, marginTop: 4, marginBottom: 5 },
  numberButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, paddingVertical: 10, alignItems: 'center' },
  numberButtonActive: { backgroundColor: '#EDF3E2', borderColor: theme.colors.lime },
  numberText: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '900' },
  numberTextActive: { color: theme.colors.navy },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 3 },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 14 },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: 16, padding: 16, marginTop: 14 },
  noticeTitle: { color: theme.colors.navy, fontSize: 13, fontWeight: '900' },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});
