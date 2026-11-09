import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PersonalizedMealPlan } from '../api/meal-plan';
import { theme } from '../theme';
import { originalCuscuzFrangoPhoto } from '../nutrition/meal-photos';

type Props = { plan: PersonalizedMealPlan };

const icons: Record<string, string> = { cafe: '☀️', almoco: '🍽️', lanche: '🥣', jantar: '🌙' };

function MealCover({ kind, title, ingredients }: { kind: string; title: string; ingredients: string[] }) {
  const normalized = (title + ' ' + ingredients.join(' ')).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Fotos sempre vinculadas à receita, nunca ao horário.
  const exactPhoto = normalized.includes('cuscuz') && normalized.includes('frango')
    ? originalCuscuzFrangoPhoto : null;
  return (
    <View style={styles.photo}>
      {exactPhoto ? (
        <Image
          source={{ uri: exactPhoto }}
          style={styles.photoImage}
          resizeMode="cover"
          accessibilityLabel={'Imagem ilustrativa correspondente a ' + title}
        />
      ) : (
        <View style={styles.foodFallback}>
          <Text style={styles.photoIcon}>{icons[kind] ?? '🍽️'}</Text>
          <Text style={styles.foodFallbackLabel}>FOTO DA RECEITA EM PREPARAÇÃO</Text>
        </View>
      )}
    </View>
  );
}

export function MealPlanCard({ plan }: Props) {
  const [indexes, setIndexes] = useState<Record<string, number>>({});
  return (
    <View style={styles.root}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}><Text style={styles.sectionEmoji}>🍽️</Text></View>
        <View style={styles.sectionHeadText}>
          <Text style={styles.eyebrow}>PLANO ALIMENTAR PERSONALIZADO</Text>
          <Text style={styles.title}>Seu cardápio em imagens</Text>
          <Text style={styles.subtitle}>Ideias de refeições e substituições compatíveis com o perfil.</Text>
        </View>
      </View>

      {plan.meals.map((meal) => {
        const options = [meal.selected, ...meal.alternatives].filter((item): item is NonNullable<typeof item> => Boolean(item));
        const index = options.length ? Math.min(indexes[meal.key] ?? 0, options.length - 1) : 0;
        const active = options[index];
        return (
          <View key={meal.key} style={styles.mealCard}>
            <MealCover kind={meal.key} title={active?.title ?? ''} ingredients={active?.ingredients ?? []} />
            <View style={styles.mealContent}>
              <Text style={styles.mealLabel}>{meal.label.toLocaleUpperCase('pt-BR')}</Text>
              {active ? (
                <>
                  <Text style={styles.mealName}>{active.title}</Text>
                  <Text style={styles.ingredients} numberOfLines={3}>{active.ingredients.join(' · ')}</Text>
                  {options.length > 1 ? (
                    <TouchableOpacity
                      onPress={() => setIndexes((previous) => ({ ...previous, [meal.key]: (index + 1) % options.length }))}
                      accessibilityRole="button"
                      accessibilityLabel={'Trocar opção de ' + meal.label}
                      style={styles.swapButton}
                    >
                      <Text style={styles.swapText}>⇄  Ver outra opção ({index + 1}/{options.length})</Text>
                    </TouchableOpacity>
                  ) : <Text style={styles.noOptions}>Sem outras opções compatíveis cadastradas</Text>}
                </>
              ) : <Text style={styles.unavailable}>Não há opção que atenda às restrições cadastradas.</Text>}
            </View>
          </View>
        );
      })}

      <View style={styles.hintBox}>
        <Text style={styles.hintTitle}>Quantidades personalizadas</Text>
        <Text style={styles.hintText}>As sugestões não têm porção fixa. Para saber calorias e proteínas consumidas, registre cada alimento e seus gramas no diário inteligente.</Text>
      </View>

      {plan.safety.hardBlocksApplied.length > 0 ? (
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Restrições consideradas</Text>
          <Text style={styles.safetyText}>{plan.safety.hardBlocksApplied.join(' · ')}</Text>
        </View>
      ) : null}
      {plan.safety.clinicalReviewRecommended ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Revisão profissional recomendada</Text>
          <Text style={styles.warningText}>{plan.safety.note}</Text>
        </View>
      ) : null}
      <Text style={styles.photoNote}>As fotos são originais, por receita. Quando não existir imagem fiel, mostramos um espaço reservado, sem usar fotos de pratos diferentes.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 11, marginBottom: 4 },
  sectionHead: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  sectionHeadText: { flex: 1 },
  sectionIcon: { backgroundColor: '#E5F5BD', borderRadius: 12, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  sectionEmoji: { fontSize: 23 },
  eyebrow: { color: '#74A31E', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: theme.colors.navyDark, fontSize: 23, fontWeight: '900', marginTop: 3 },
  subtitle: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  mealCard: { flexDirection: 'row', minHeight: 142, backgroundColor: theme.colors.white, borderRadius: 22, borderColor: theme.colors.border, borderWidth: 1, marginBottom: 11, overflow: 'hidden' },
  photo: { width: '39%', minHeight: 142, backgroundColor: '#E7F3D6', alignItems: 'center', justifyContent: 'center' },
  photoImage: { height: '100%', width: '100%', position: 'absolute' },
  foodFallback: { justifyContent: 'center', alignItems: 'center', padding: 8 },
  foodFallbackLabel: { color: theme.colors.navy, fontSize: 8, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  photoIcon: { fontSize: 48 },
  mealContent: { flex: 1, padding: 12, justifyContent: 'center' },
  mealLabel: { color: '#517D12', backgroundColor: '#E9F8C1', borderRadius: 8, overflow: 'hidden', paddingVertical: 4, paddingHorizontal: 8, fontSize: 10, alignSelf: 'flex-start', fontWeight: '900' },
  mealName: { color: theme.colors.navyDark, fontSize: 15, lineHeight: 19, fontWeight: '900', marginTop: 8 },
  ingredients: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  swapButton: { marginTop: 11, paddingVertical: 5, alignSelf: 'flex-start' },
  swapText: { fontSize: 11, color: '#528A10', fontWeight: '900' },
  noOptions: { color: theme.colors.textMuted, fontSize: 10, marginTop: 8 },
  unavailable: { color: theme.colors.danger, fontSize: 11, lineHeight: 18, marginTop: 10 },
  hintBox: { backgroundColor: '#EAF5D6', borderRadius: 16, padding: 13, marginTop: 5 },
  hintTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 12 },
  hintText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  safetyCard: { backgroundColor: '#FFF2E0', padding: 13, marginTop: 12, borderRadius: 15 },
  safetyTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.warning },
  safetyText: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4 },
  warningCard: { backgroundColor: '#FFF2E0', padding: 13, marginTop: 12, borderRadius: 15 },
  warningTitle: { color: theme.colors.warning, fontWeight: '900', fontSize: 12 },
  warningText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 6 },
  photoNote: { color: theme.colors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 10, marginBottom: 3 },
});
