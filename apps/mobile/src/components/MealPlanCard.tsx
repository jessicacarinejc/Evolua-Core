import { StyleSheet, Text, View } from 'react-native';
import { PersonalizedMealPlan } from '../api/meal-plan';
import { theme } from '../theme';

type Props = {
  plan: PersonalizedMealPlan;
};

export function MealPlanCard({ plan }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>PLANO ALIMENTAR PERSONALIZADO</Text>
      <Text style={styles.title}>Sugestões compatíveis com seu perfil</Text>
      <Text style={styles.note}>{plan.safety.note}</Text>

      {plan.safety.hardBlocksApplied.length > 0 ? (
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>Bloqueios aplicados</Text>
          <Text style={styles.alertText}>{plan.safety.hardBlocksApplied.join(' · ')}</Text>
        </View>
      ) : null}

      {plan.meals.map((item) => (
        <View key={item.key} style={styles.meal}>
          <Text style={styles.mealLabel}>{item.label}</Text>
          {item.selected ? (
            <>
              <Text style={styles.mealTitle}>{item.selected.title}</Text>
              <Text style={styles.ingredients}>{item.selected.ingredients.join(' · ')}</Text>
              {item.alternatives.length > 0 ? (
                <Text style={styles.alternatives}>
                  Alternativas: {item.alternatives.map((alternative) => alternative.title).join(' • ')}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.unavailable}>Nenhuma opção automática passou pelos bloqueios cadastrados.</Text>
          )}
        </View>
      ))}

      {plan.safety.clinicalReviewRecommended ? (
        <View style={styles.clinical}>
          <Text style={styles.clinicalTitle}>Revisão individual recomendada</Text>
          <Text style={styles.clinicalText}>
            Há condição ou restrição clínica cadastrada. O plano não altera medicação e não substitui acompanhamento profissional.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.navy, borderRadius: 20, padding: 18, marginBottom: 14 },
  eyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.white, fontSize: 19, fontWeight: '900', marginTop: 5 },
  note: { color: '#C8D4E3', fontSize: 10, lineHeight: 16, marginTop: 7 },
  alert: { backgroundColor: '#29476E', borderRadius: 12, padding: 11, marginTop: 12 },
  alertTitle: { color: theme.colors.lime, fontSize: 10, fontWeight: '900' },
  alertText: { color: theme.colors.white, fontSize: 10, lineHeight: 16, marginTop: 4 },
  meal: { borderTopWidth: 1, borderTopColor: '#34557D', paddingTop: 12, marginTop: 12 },
  mealLabel: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  mealTitle: { color: theme.colors.white, fontSize: 14, fontWeight: '900', marginTop: 4 },
  ingredients: { color: '#C8D4E3', fontSize: 10, lineHeight: 16, marginTop: 4 },
  alternatives: { color: '#DDE7F2', fontSize: 9, lineHeight: 15, marginTop: 6 },
  unavailable: { color: '#FFD5D5', fontSize: 10, lineHeight: 16, marginTop: 5 },
  clinical: { backgroundColor: '#FFF4E5', borderRadius: 12, padding: 12, marginTop: 14 },
  clinicalTitle: { color: theme.colors.warning, fontSize: 11, fontWeight: '900' },
  clinicalText: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
