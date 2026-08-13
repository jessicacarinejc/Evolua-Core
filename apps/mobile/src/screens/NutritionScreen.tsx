import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { OnboardingData } from '../onboarding/types';
import { theme } from '../theme';

type Props = {
  profile: OnboardingData | null;
};

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

export function NutritionScreen({ profile }: Props) {
  const restrictions = profile?.foodRestrictions ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageEyebrow}>NUTRIÇÃO</Text>
      <Text style={styles.title}>Alimentação para apoiar treino e recuperação</Text>
      <Text style={styles.intro}>
        Estas são orientações educativas gerais. Quantidades, calorias e distribuição de macronutrientes precisam ser individualizadas conforme objetivo, saúde, rotina e avaliação nutricional.
      </Text>

      {restrictions.length > 0 ? (
        <View style={styles.restrictionCard}>
          <Text style={styles.restrictionTitle}>Restrições cadastradas</Text>
          <Text style={styles.body}>{restrictions.join(' · ')}</Text>
          <Text style={styles.restrictionText}>Use somente alimentos compatíveis com suas restrições e substituições já validadas para você.</Text>
        </View>
      ) : null}

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
        strategy="Estratégia prática: tente incluir uma fonte de proteína nas principais refeições e lanches, sem transformar isso em uma regra rígida se não houver necessidade."
      />

      <TipCard
        eyebrow="3 · GORDURAS INSATURADAS"
        title="Energia, saciedade e funções hormonais"
        body="Gorduras alimentares participam de funções hormonais, fornecem ácidos graxos essenciais e ajudam na absorção de vitaminas lipossolúveis. Elas não precisam ser usadas como estratégia específica para “ativar” a queima de gordura."
        foods="Abacate, castanhas, amendoim, sementes e azeite de oliva extra virgem."
        strategy="Use porções moderadas, porque são alimentos com alta densidade energética."
      />

      <Text style={styles.sectionTitle}>Exemplo prático de um dia</Text>
      <Text style={styles.sectionIntro}>Exemplo educativo, não um cardápio prescrito. Ajuste alimentos e porções às suas necessidades e restrições.</Text>

      <View style={styles.mealCard}>
        <Text style={styles.mealTitle}>Café da manhã</Text>
        <Text style={styles.body}>Ovos mexidos com pão integral ou banana amassada com aveia. Combine de acordo com sua fome e rotina.</Text>
      </View>
      <View style={styles.mealCard}>
        <Text style={styles.mealTitle}>Almoço</Text>
        <Text style={styles.body}>Frango grelhado, arroz integral, feijão e salada variada com pequena quantidade de azeite.</Text>
      </View>
      <View style={styles.mealCard}>
        <Text style={styles.mealTitle}>Lanche / pré-treino</Text>
        <Text style={styles.body}>Iogurte natural com aveia ou fruta; quando houver intolerância ou outra restrição, use uma alternativa adequada ao seu perfil.</Text>
      </View>
      <View style={styles.mealCard}>
        <Text style={styles.mealTitle}>Jantar</Text>
        <Text style={styles.body}>Omelete com legumes ou peixe acompanhado de batata-doce ou outra fonte de carboidrato conforme a necessidade do dia.</Text>
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Importante</Text>
        <Text style={styles.noticeText}>Condições clínicas, uso de medicamentos, diabetes, doença renal, gestação, transtornos alimentares e outras situações exigem orientação individualizada. O Evolua Core não deve alterar medicação nem substituir nutricionista ou médico.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 44, backgroundColor: theme.colors.background },
  pageEyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: theme.colors.navy, fontSize: 29, fontWeight: '900', marginTop: 6 },
  intro: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 16 },
  tipCard: { backgroundColor: theme.colors.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 },
  eyebrow: { color: theme.colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  tipTitle: { color: theme.colors.navy, fontSize: 19, fontWeight: '900', marginTop: 5, marginBottom: 7 },
  body: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 19 },
  label: { color: theme.colors.text, fontWeight: '900', fontSize: 11, marginTop: 12, marginBottom: 4 },
  strategy: { backgroundColor: '#EDF3E2', color: theme.colors.navy, fontSize: 11, lineHeight: 18, borderRadius: 12, padding: 12, marginTop: 12, fontWeight: '700' },
  restrictionCard: { backgroundColor: '#FFF4E5', borderRadius: 16, padding: 15, marginBottom: 14 },
  restrictionTitle: { color: theme.colors.warning, fontWeight: '900', fontSize: 13 },
  restrictionText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginTop: 16 },
  sectionIntro: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 10 },
  mealCard: { backgroundColor: theme.colors.white, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 15, marginBottom: 9 },
  mealTitle: { color: theme.colors.navy, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: 16, padding: 16, marginTop: 14 },
  noticeTitle: { color: theme.colors.navy, fontSize: 13, fontWeight: '900' },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});
