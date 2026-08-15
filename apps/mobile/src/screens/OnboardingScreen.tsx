import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  goalOptions,
  initialOnboardingData,
  MAX_SELECTED_GOALS,
  OnboardingData,
  PrimaryGoal,
  TrainingLevel,
} from '../onboarding/types';
import { theme } from '../theme';

type Props = {
  onFinish: (data: OnboardingData) => void;
};

type Step = 'perfil' | 'objetivo' | 'treino' | 'saude' | 'nutricao';

const steps: Step[] = ['perfil', 'objetivo', 'treino', 'saude', 'nutricao'];
const goalCategories = [...new Set(goalOptions.map((option) => option.category))];
const levelOptions: { value: TrainingLevel; label: string }[] = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
];
const equipmentOptions = ['Academia completa', 'Halteres', 'Barras', 'Máquinas', 'Cabos', 'Elásticos', 'Kettlebell', 'Banco', 'TRX', 'Bicicleta', 'Esteira', 'Peso corporal'];
const conditionOptions = ['Diabetes', 'Hipertensão', 'Doença renal', 'Gestação', 'Cardiopatia', 'Nenhuma informada'];
const painOptions = ['Joelhos', 'Coluna lombar', 'Ombros', 'Quadril', 'Punhos', 'Tornozelos'];
const foodOptions = ['Lactose', 'Glúten', 'Amendoim', 'Frutos do mar', 'Ovos', 'Vegetariano', 'Vegano'];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.8}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

export function OnboardingScreen({ onFinish }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);
  const step = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const storedGoals = data.goals ?? [];

  const selectedGoals = storedGoals.length > 0
    ? storedGoals
    : data.primaryGoal
      ? [data.primaryGoal]
      : [];

  const canAdvance = useMemo(() => {
    if (step === 'perfil') return Boolean(data.displayName && data.birthDate && data.heightCm && data.weightKg);
    if (step === 'objetivo') return Boolean(selectedGoals.length > 0 && data.primaryGoal && data.trainingLevel);
    return true;
  }, [data, selectedGoals.length, step]);

  const selectGoal = (goal: PrimaryGoal) => {
    setData((current) => {
      const explicitGoals = current.goals ?? [];
      const currentGoals = explicitGoals.length > 0
        ? explicitGoals
        : current.primaryGoal
          ? [current.primaryGoal]
          : [];

      if (currentGoals.includes(goal)) {
        const nextGoals = currentGoals.filter((item) => item !== goal);
        const nextPrimary = current.primaryGoal === goal
          ? (nextGoals[0] ?? '')
          : current.primaryGoal;
        return { ...current, goals: nextGoals, primaryGoal: nextPrimary };
      }

      if (currentGoals.length >= MAX_SELECTED_GOALS) return current;
      const nextGoals = [...currentGoals, goal];
      return {
        ...current,
        goals: nextGoals,
        primaryGoal: current.primaryGoal || goal,
      };
    });
  };

  const next = () => {
    if (stepIndex === steps.length - 1) onFinish({ ...data, goals: selectedGoals });
    else setStepIndex((current) => current + 1);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brand}>EVOLUA CORE</Text>
        <Text style={styles.stepLabel}>Configuração inicial · {stepIndex + 1} de {steps.length}</Text>
        <View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${progress}%` }]} /></View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'perfil' && (
          <>
            <Text style={styles.title}>Vamos conhecer você</Text>
            <Text style={styles.subtitle}>Esses dados ajudam a calcular metas e adequar treino e alimentação.</Text>
            <Text style={styles.label}>Como quer ser chamado(a)?</Text>
            <TextInput value={data.displayName} onChangeText={(value) => setData({ ...data, displayName: value })} style={styles.input} placeholder="Seu nome" />
            <Text style={styles.label}>Data de nascimento</Text>
            <TextInput value={data.birthDate} onChangeText={(value) => setData({ ...data, birthDate: value })} style={styles.input} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" />
            <View style={styles.row}>
              <View style={styles.half}><Text style={styles.label}>Altura (cm)</Text><TextInput value={data.heightCm} onChangeText={(value) => setData({ ...data, heightCm: value })} style={styles.input} keyboardType="decimal-pad" placeholder="165" /></View>
              <View style={styles.half}><Text style={styles.label}>Peso (kg)</Text><TextInput value={data.weightKg} onChangeText={(value) => setData({ ...data, weightKg: value })} style={styles.input} keyboardType="decimal-pad" placeholder="70" /></View>
            </View>
          </>
        )}

        {step === 'objetivo' && (
          <>
            <Text style={styles.title}>Quais são seus objetivos?</Text>
            <Text style={styles.subtitle}>Escolha de 1 a {MAX_SELECTED_GOALS} objetivos. O primeiro selecionado fica como prioridade e os demais complementam a montagem dos treinos.</Text>
            <View style={styles.selectionCounter}>
              <Text style={styles.selectionCounterText}>{selectedGoals.length}/{MAX_SELECTED_GOALS} selecionados</Text>
              {data.primaryGoal ? <Text style={styles.primaryGoalText}>Prioridade: {goalOptions.find((option) => option.value === data.primaryGoal)?.label}</Text> : null}
            </View>

            {goalCategories.map((category) => (
              <View key={category} style={styles.goalGroup}>
                <Text style={styles.goalCategory}>{category}</Text>
                <View style={styles.chips}>
                  {goalOptions.filter((option) => option.category === category).map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      active={selectedGoals.includes(option.value)}
                      onPress={() => selectGoal(option.value)}
                    />
                  ))}
                </View>
              </View>
            ))}

            {selectedGoals.length >= MAX_SELECTED_GOALS ? (
              <Text style={styles.limitText}>Limite de {MAX_SELECTED_GOALS} objetivos atingido. Desmarque um para escolher outro.</Text>
            ) : null}

            <Text style={styles.label}>Experiência com treino</Text>
            <View style={styles.chips}>{levelOptions.map((option) => <Chip key={option.value} label={option.label} active={data.trainingLevel === option.value} onPress={() => setData({ ...data, trainingLevel: option.value })} />)}</View>
          </>
        )}

        {step === 'treino' && (
          <>
            <Text style={styles.title}>Sua rotina de treino</Text>
            <Text style={styles.subtitle}>O Evolua Core adapta o plano ao tempo real que você tem disponível e aos equipamentos que realmente pode usar.</Text>
            <Text style={styles.label}>Dias por semana</Text>
            <View style={styles.chips}>{[2, 3, 4, 5, 6].map((days) => <Chip key={days} label={`${days} dias`} active={data.trainingDaysPerWeek === days} onPress={() => setData({ ...data, trainingDaysPerWeek: days })} />)}</View>
            <Text style={styles.label}>Tempo por sessão</Text>
            <View style={styles.chips}>{[30, 45, 60, 75, 90].map((minutes) => <Chip key={minutes} label={`${minutes} min`} active={data.sessionMinutes === minutes} onPress={() => setData({ ...data, sessionMinutes: minutes })} />)}</View>
            <Text style={styles.label}>Equipamentos disponíveis</Text>
            <View style={styles.chips}>{equipmentOptions.map((item) => <Chip key={item} label={item} active={data.equipment.includes(item)} onPress={() => setData({ ...data, equipment: toggle(data.equipment, item) })} />)}</View>
          </>
        )}

        {step === 'saude' && (
          <>
            <Text style={styles.title}>Saúde e limitações</Text>
            <Text style={styles.subtitle}>Essas respostas entram primeiro no motor de segurança, antes de qualquer sugestão automática.</Text>
            <Text style={styles.label}>Condições informadas</Text>
            <View style={styles.chips}>{conditionOptions.map((item) => <Chip key={item} label={item} active={data.healthConditions.includes(item)} onPress={() => setData({ ...data, healthConditions: toggle(data.healthConditions, item) })} />)}</View>
            <Text style={styles.label}>Dor ou desconforto recorrente</Text>
            <View style={styles.chips}>{painOptions.map((item) => <Chip key={item} label={item} active={data.painAreas.includes(item)} onPress={() => setData({ ...data, painAreas: toggle(data.painAreas, item) })} />)}</View>
            <View style={styles.warningCard}><Text style={styles.warningTitle}>Importante</Text><Text style={styles.warningText}>Condições clínicas, dor persistente ou sintomas novos podem exigir avaliação profissional antes da liberação de determinados treinos.</Text></View>
          </>
        )}

        {step === 'nutricao' && (
          <>
            <Text style={styles.title}>Alimentação e restrições</Text>
            <Text style={styles.subtitle}>Alergias e restrições clínicas serão tratadas como regras de segurança, não como simples preferências.</Text>
            <Text style={styles.label}>Restrições, alergias ou estilo alimentar</Text>
            <View style={styles.chips}>{foodOptions.map((item) => <Chip key={item} label={item} active={data.foodRestrictions.includes(item)} onPress={() => setData({ ...data, foodRestrictions: toggle(data.foodRestrictions, item) })} />)}</View>
            <View style={styles.infoCard}><Text style={styles.infoTitle}>Plano alimentar responsável</Text><Text style={styles.infoText}>Quando houver condição clínica, o app priorizará limites de segurança e poderá indicar revisão por nutricionista antes de gerar recomendações mais específicas.</Text></View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {stepIndex > 0 && <TouchableOpacity onPress={() => setStepIndex((current) => current - 1)} style={styles.backButton}><Text style={styles.backText}>Voltar</Text></TouchableOpacity>}
        <TouchableOpacity disabled={!canAdvance} onPress={next} style={[styles.nextButton, !canAdvance && styles.disabled]}><Text style={styles.nextText}>{stepIndex === steps.length - 1 ? 'Concluir configuração' : 'Continuar'}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: theme.colors.navy, paddingTop: 22, paddingHorizontal: 24, paddingBottom: 20 },
  brand: { color: theme.colors.white, fontWeight: '900', fontSize: 18, letterSpacing: 1.2 },
  stepLabel: { color: '#C8D4E3', fontSize: 12, marginTop: 5 },
  progressTrack: { height: 5, backgroundColor: '#2B4262', borderRadius: 99, marginTop: 14, overflow: 'hidden' },
  progressValue: { height: 5, backgroundColor: theme.colors.lime },
  content: { padding: 24, paddingBottom: 38 },
  title: { color: theme.colors.navy, fontSize: 27, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  label: { color: theme.colors.text, fontWeight: '800', fontSize: 12, marginTop: 15, marginBottom: 8 },
  input: { backgroundColor: theme.colors.white, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: theme.colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 10 },
  chipActive: { backgroundColor: '#EEF7DE', borderColor: theme.colors.lime },
  chipText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: theme.colors.navy, fontWeight: '900' },
  selectionCounter: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12, marginBottom: 4 },
  selectionCounterText: { color: theme.colors.navy, fontWeight: '900', fontSize: 12 },
  primaryGoalText: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  goalGroup: { marginTop: 16 },
  goalCategory: { color: theme.colors.navy, fontWeight: '900', fontSize: 13, marginBottom: 9 },
  limitText: { color: theme.colors.warning, fontSize: 11, fontWeight: '700', marginTop: 12, lineHeight: 17 },
  warningCard: { marginTop: 22, backgroundColor: '#FFF4E5', borderRadius: 16, padding: 16 },
  warningTitle: { color: theme.colors.warning, fontWeight: '900', fontSize: 13 },
  warningText: { color: theme.colors.textMuted, lineHeight: 19, fontSize: 12, marginTop: 5 },
  infoCard: { marginTop: 22, backgroundColor: '#EDF3E2', borderRadius: 16, padding: 16 },
  infoTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 13 },
  infoText: { color: theme.colors.textMuted, lineHeight: 19, fontSize: 12, marginTop: 5 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopColor: theme.colors.border, borderTopWidth: 1, backgroundColor: theme.colors.white },
  backButton: { paddingHorizontal: 20, paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border },
  backText: { color: theme.colors.navy, fontWeight: '800' },
  nextButton: { flex: 1, backgroundColor: theme.colors.lime, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  nextText: { color: theme.colors.navyDark, fontWeight: '900' },
  disabled: { opacity: 0.4 },
});
