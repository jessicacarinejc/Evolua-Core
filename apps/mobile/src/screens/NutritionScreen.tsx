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
import { api, MealType, NutritionDay } from '../api/client';
import { loadPersonalizedMealPlan, PersonalizedMealPlan } from '../api/meal-plan';
import { MealPlanCard } from '../components/MealPlanCard';
import { OnboardingData } from '../onboarding/types';
import { theme } from '../theme';

type Props = {
  profile: OnboardingData | null;
  token: string | null;
};

const mealOptions: Array<{ key: MealType; label: string }> = [
  { key: 'cafe', label: 'Café' },
  { key: 'lanche_manha', label: 'Lanche manhã' },
  { key: 'almoco', label: 'Almoço' },
  { key: 'lanche_tarde', label: 'Lanche tarde' },
  { key: 'jantar', label: 'Jantar' },
  { key: 'ceia', label: 'Ceia' },
  { key: 'outro', label: 'Outro' },
];

function numberFromText(value: string) {
  const parsed = Number(value.replace(',', '.').trim());
  return Number.isFinite(parsed) && value.trim() ? parsed : undefined;
}

function sourceLabel(source: NutritionDay['targets'] extends infer T ? any : never) {
  if (source === 'nutritionist') return 'definida por nutricionista';
  if (source === 'user') return 'meta definida por você';
  return 'meta do sistema';
}

function ProgressLine({ label, value, target, suffix }: { label: string; value: number; target: number | null | undefined; suffix: string }) {
  const percent = target && target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{Math.round(value)}{suffix}{target ? ` / ${Math.round(target)}${suffix}` : ''}</Text>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${percent}%` }]} /></View>
    </View>
  );
}

function TipCard({ eyebrow, title, body, foods, strategy }: {
  eyebrow: string;
  title: string;
  body: string;
  foods: string;
  strategy: string;
}) {
  return (
    <View style={styles.tipCard}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.tipTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Text style={styles.label}>Boas opções</Text>
      <Text style={styles.body}>{foods}</Text>
      <Text style={styles.strategy}>{strategy}</Text>
    </View>
  );
}

export function NutritionScreen({ profile, token }: Props) {
  const [day, setDay] = useState<NutritionDay | null>(null);
  const [mealPlan, setMealPlan] = useState<PersonalizedMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMeal, setSavingMeal] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);
  const [mealType, setMealType] = useState<MealType>('lanche_tarde');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetWater, setTargetWater] = useState('');

  const load = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const result = await api.getNutritionToday(token);
      setDay(result);
      if (result.targets) {
        setTargetCalories(result.targets.caloriesKcal == null ? '' : String(result.targets.caloriesKcal));
        setTargetProtein(result.targets.proteinG == null ? '' : String(result.targets.proteinG));
        setTargetWater(result.targets.waterMl == null ? '' : String(result.targets.waterMl));
      }
      try {
        setMealPlan(await loadPersonalizedMealPlan(token));
      } catch {
        setMealPlan(null);
      }
    } catch (cause) {
      Alert.alert('Nutrição indisponível', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const addWater = async (amountMl: number) => {
    if (!token) return;
    try {
      setDay(await api.addHydration(token, amountMl));
    } catch (cause) {
      Alert.alert('Água não registrada', cause instanceof Error ? cause.message : 'Tente novamente.');
    }
  };

  const addMeal = async () => {
    if (!token) return;
    if (!foodName.trim()) {
      Alert.alert('Informe o alimento', 'Digite o alimento ou preparação que deseja registrar.');
      return;
    }
    setSavingMeal(true);
    try {
      const result = await api.addMealEntry(token, {
        mealType,
        name: foodName.trim(),
        caloriesKcal: numberFromText(calories),
        proteinG: numberFromText(protein),
        carbsG: numberFromText(carbs),
        fatG: numberFromText(fat),
      });
      setDay(result);
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
    } catch (cause) {
      Alert.alert('Refeição não registrada', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setSavingMeal(false);
    }
  };

  const saveTargets = async () => {
    if (!token) return;
    const input = {
      caloriesKcal: numberFromText(targetCalories),
      proteinG: numberFromText(targetProtein),
      waterMl: numberFromText(targetWater),
    };
    if (input.caloriesKcal == null && input.proteinG == null && input.waterMl == null) {
      Alert.alert('Informe uma meta', 'Preencha pelo menos calorias, proteína ou água.');
      return;
    }
    setSavingTargets(true);
    try {
      setDay(await api.saveNutritionTargets(token, input));
      Alert.alert('Metas salvas', 'Estas metas são para acompanhamento. Elas não são uma prescrição nutricional.');
    } catch (cause) {
      Alert.alert('Metas não salvas', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setSavingTargets(false);
    }
  };

  const restrictions = day?.restrictions?.map((item) => item.item) ?? profile?.foodRestrictions ?? [];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.lime} />
        <Text style={styles.loadingText}>Carregando nutrição...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageEyebrow}>NUTRIÇÃO</Text>
      <Text style={styles.title}>Seu diário alimentar e hidratação</Text>
      <Text style={styles.intro}>Registre o que consumiu e acompanhe suas próprias metas. O app não transforma metas de acompanhamento em prescrição clínica.</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryEyebrow}>HOJE</Text>
            <Text style={styles.summaryTitle}>Acompanhamento do dia</Text>
          </View>
          {day?.targets ? <Text style={styles.targetSource}>{sourceLabel(day.targets.source)}</Text> : null}
        </View>
        <ProgressLine label="Calorias" value={day?.totals.caloriesKcal ?? 0} target={day?.targets?.caloriesKcal} suffix=" kcal" />
        <ProgressLine label="Proteína" value={day?.totals.proteinG ?? 0} target={day?.targets?.proteinG} suffix=" g" />
        <ProgressLine label="Água" value={day?.totals.waterMl ?? 0} target={day?.targets?.waterMl} suffix=" ml" />
        <View style={styles.macroRow}>
          <Text style={styles.macroText}>Carboidratos {Math.round(day?.totals.carbsG ?? 0)} g</Text>
          <Text style={styles.macroText}>Gorduras {Math.round(day?.totals.fatG ?? 0)} g</Text>
          <Text style={styles.macroText}>Fibras {Math.round(day?.totals.fiberG ?? 0)} g</Text>
        </View>
      </View>

      {mealPlan ? <MealPlanCard plan={mealPlan} /> : null}

      <View style={styles.quickCard}>
        <Text style={styles.sectionEyebrow}>HIDRATAÇÃO</Text>
        <Text style={styles.sectionTitle}>Registrar água</Text>
        <View style={styles.quickRow}>
          {[250, 350, 500].map((amount) => (
            <TouchableOpacity key={amount} onPress={() => void addWater(amount)} style={styles.waterButton}>
              <Text style={styles.waterButtonText}>+ {amount} ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionEyebrow}>DIÁRIO ALIMENTAR</Text>
        <Text style={styles.sectionTitle}>Adicionar alimento</Text>
        <Text style={styles.formHelp}>Os dados nutricionais são opcionais nesta fase. Quando informados, entram no resumo do dia.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {mealOptions.map((option) => (
            <TouchableOpacity key={option.key} onPress={() => setMealType(option.key)} style={[styles.chip, mealType === option.key && styles.chipActive]}>
              <Text style={[styles.chipText, mealType === option.key && styles.chipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput value={foodName} onChangeText={setFoodName} placeholder="Ex.: banana com aveia" style={styles.fullInput} />
        <View style={styles.inputRow}>
          <TextInput value={calories} onChangeText={setCalories} keyboardType="decimal-pad" placeholder="kcal" style={styles.smallInput} />
          <TextInput value={protein} onChangeText={setProtein} keyboardType="decimal-pad" placeholder="proteína g" style={styles.smallInput} />
        </View>
        <View style={styles.inputRow}>
          <TextInput value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" placeholder="carbo g" style={styles.smallInput} />
          <TextInput value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholder="gordura g" style={styles.smallInput} />
        </View>
        <TouchableOpacity disabled={savingMeal} onPress={addMeal} style={styles.primaryButton}>
          {savingMeal ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Registrar no diário</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitleOutside}>Registros de hoje</Text>
      {day?.meals.length ? day.meals.map((meal) => (
        <View key={meal.id} style={styles.mealLogCard}>
          <View style={styles.mealLogTop}>
            <Text style={styles.mealLogName}>{meal.name}</Text>
            <Text style={styles.mealLogCalories}>{Math.round(meal.caloriesKcal)} kcal</Text>
          </View>
          <Text style={styles.mealLogMeta}>{meal.mealType.replace('_', ' ')} · P {Math.round(meal.proteinG)} g · C {Math.round(meal.carbsG)} g · G {Math.round(meal.fatG)} g</Text>
        </View>
      )) : <View style={styles.emptyCard}><Text style={styles.body}>Nenhum alimento registrado hoje.</Text></View>}

      <View style={styles.targetCard}>
        <Text style={styles.sectionEyebrow}>METAS DE ACOMPANHAMENTO</Text>
        <Text style={styles.targetTitle}>Definir minhas metas</Text>
        <Text style={styles.formHelp}>Use valores que já tenham sido definidos para você ou que queira apenas acompanhar. Uma meta salva pelo nutricionista terá prioridade sobre a meta pessoal.</Text>
        <View style={styles.inputRow}>
          <TextInput value={targetCalories} onChangeText={setTargetCalories} keyboardType="number-pad" placeholder="kcal/dia" style={styles.smallInput} />
          <TextInput value={targetProtein} onChangeText={setTargetProtein} keyboardType="decimal-pad" placeholder="proteína g" style={styles.smallInput} />
        </View>
        <TextInput value={targetWater} onChangeText={setTargetWater} keyboardType="number-pad" placeholder="água ml/dia" style={styles.fullInput} />
        <TouchableOpacity disabled={savingTargets} onPress={saveTargets} style={styles.secondaryButton}>
          {savingTargets ? <ActivityIndicator color={theme.colors.navy} /> : <Text style={styles.secondaryButtonText}>Salvar metas</Text>}
        </TouchableOpacity>
      </View>

      {restrictions.length > 0 ? (
        <View style={styles.restrictionCard}>
          <Text style={styles.restrictionTitle}>Restrições cadastradas</Text>
          <Text style={styles.body}>{restrictions.join(' · ')}</Text>
          <Text style={styles.restrictionText}>Itens marcados como bloqueio são barrados quando houver correspondência direta com o alimento digitado. Ingredientes ocultos ainda exigem conferência do rótulo e orientação adequada.</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitleOutside}>Dicas para apoiar treino e recuperação</Text>
      <TipCard
        eyebrow="1 · CARBOIDRATOS"
        title="Combustível para o treino"
        body="Carboidratos ajudam a sustentar o rendimento, especialmente em sessões mais intensas. Não é necessário eliminá-los para buscar redução de gordura corporal."
        foods="Batata-doce, aveia, arroz integral, mandioca, pão integral, frutas e outros alimentos ricos em carboidratos que sejam bem tolerados."
        strategy="Pré-treino: uma porção moderada cerca de 1–2 horas antes pode ajudar no rendimento, ajustando quantidade e horário à tolerância individual."
      />
      <TipCard
        eyebrow="2 · PROTEÍNAS"
        title="Suporte à recuperação muscular"
        body="Proteína fornece aminoácidos usados na manutenção e reparação do tecido muscular após o exercício. O total diário e a distribuição ao longo do dia são mais importantes do que concentrar tudo em uma única refeição."
        foods="Frango, ovos, patinho moído, peixes, queijo cottage, tofu, lentilha, feijão e outras fontes compatíveis com sua alimentação."
        strategy="Estratégia prática: inclua uma fonte de proteína nas principais refeições e lanches conforme sua rotina e orientação individual."
      />
      <TipCard
        eyebrow="3 · GORDURAS INSATURADAS"
        title="Energia, saciedade e funções fisiológicas"
        body="Gorduras alimentares participam de funções hormonais, fornecem ácidos graxos essenciais e ajudam na absorção de vitaminas lipossolúveis. Elas não são um gatilho isolado de queima de gordura."
        foods="Abacate, castanhas, amendoim, sementes e azeite de oliva extra virgem."
        strategy="Use porções moderadas, porque são alimentos com alta densidade energética."
      />

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Importante</Text>
        <Text style={styles.noticeText}>Condições clínicas, uso de medicamentos, diabetes, doença renal, gestação, transtornos alimentares e outras situações exigem orientação individualizada. O Evolua Core não altera medicação nem substitui nutricionista ou médico.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, gap: 12 },
  loadingText: { color: theme.colors.textMuted, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 44, backgroundColor: theme.colors.background },
  pageEyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: theme.colors.navy, fontSize: 29, fontWeight: '900', marginTop: 6 },
  intro: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 16 },
  summaryCard: { backgroundColor: theme.colors.navy, borderRadius: 21, padding: 18, marginBottom: 13 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  summaryEyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  summaryTitle: { color: theme.colors.white, fontSize: 19, fontWeight: '900', marginTop: 4 },
  targetSource: { color: '#C8D4E3', fontSize: 8, maxWidth: 110, textAlign: 'right' },
  progressBlock: { marginTop: 11 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#C8D4E3', fontSize: 10, fontWeight: '800' },
  progressValue: { color: theme.colors.white, fontSize: 10, fontWeight: '900' },
  progressTrack: { height: 7, borderRadius: 8, backgroundColor: '#29476E', overflow: 'hidden', marginTop: 5 },
  progressBar: { height: 7, borderRadius: 8, backgroundColor: theme.colors.lime },
  macroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  macroText: { color: '#C8D4E3', fontSize: 9 },
  quickCard: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  sectionEyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sectionTitle: { color: theme.colors.navy, fontSize: 18, fontWeight: '900', marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  waterButton: { flex: 1, backgroundColor: '#EDF3E2', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  waterButtonText: { color: theme.colors.navy, fontSize: 10, fontWeight: '900' },
  formCard: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 19, padding: 17, marginBottom: 12 },
  formHelp: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 6 },
  chipRow: { gap: 7, paddingVertical: 11 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  chipActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  chipText: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '800' },
  chipTextActive: { color: theme.colors.white },
  fullInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, marginTop: 8, color: theme.colors.text, backgroundColor: '#F9FBFD' },
  inputRow: { flexDirection: 'row', gap: 8 },
  smallInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 11, marginTop: 8, color: theme.colors.text, backgroundColor: '#F9FBFD' },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 11 },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900' },
  secondaryButton: { borderWidth: 1, borderColor: theme.colors.navy, borderRadius: 13, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  secondaryButtonText: { color: theme.colors.navy, fontWeight: '900' },
  sectionTitleOutside: { color: theme.colors.text, fontSize: 19, fontWeight: '900', marginTop: 18, marginBottom: 9 },
  mealLogCard: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 13, marginBottom: 7 },
  mealLogTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  mealLogName: { color: theme.colors.navy, fontSize: 12, fontWeight: '900', flex: 1 },
  mealLogCalories: { color: theme.colors.text, fontSize: 10, fontWeight: '900' },
  mealLogMeta: { color: theme.colors.textMuted, fontSize: 9, marginTop: 4, textTransform: 'capitalize' },
  emptyCard: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14 },
  targetCard: { backgroundColor: '#EDF3E2', borderRadius: 18, padding: 16, marginTop: 15 },
  targetTitle: { color: theme.colors.navy, fontSize: 17, fontWeight: '900', marginTop: 4 },
  restrictionCard: { backgroundColor: '#FFF4E5', borderRadius: 16, padding: 15, marginTop: 13 },
  restrictionTitle: { color: theme.colors.warning, fontWeight: '900', fontSize: 13 },
  restrictionText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  tipCard: { backgroundColor: theme.colors.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 },
  eyebrow: { color: theme.colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  tipTitle: { color: theme.colors.navy, fontSize: 19, fontWeight: '900', marginTop: 5, marginBottom: 7 },
  body: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 19 },
  label: { color: theme.colors.text, fontWeight: '900', fontSize: 11, marginTop: 12, marginBottom: 4 },
  strategy: { backgroundColor: '#EDF3E2', color: theme.colors.navy, fontSize: 11, lineHeight: 18, borderRadius: 12, padding: 12, marginTop: 12, fontWeight: '700' },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: 16, padding: 16, marginTop: 14 },
  noticeTitle: { color: theme.colors.navy, fontSize: 13, fontWeight: '900' },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});
