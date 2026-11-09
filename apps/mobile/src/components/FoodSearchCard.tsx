import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { MealType } from '../api/client';
import { FOOD_CATALOG, FoodItem, isRestricted } from '../nutrition/food-catalog';
import { theme } from '../theme';

type Props = {
  restrictions: string[];
  saving: boolean;
  onAdd: (food: FoodItem, quantityG: number, mealType: MealType) => Promise<void>;
};

const meals: Array<{ value: MealType; label: string }> = [
  { value: 'cafe', label: 'Café da manhã' },
  { value: 'lanche_manha', label: 'Lanche manhã' },
  { value: 'almoco', label: 'Almoço' },
  { value: 'lanche_tarde', label: 'Lanche tarde' },
  { value: 'jantar', label: 'Jantar' },
  { value: 'ceia', label: 'Ceia' },
];

function FoodThumbnail({ food, size = 50 }: { food: FoodItem; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.thumbnail, { width: size, height: size }]}>
      {food.image && !failed
        ? <Image source={{ uri: food.image }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} accessibilityLabel="Fotografia ilustrativa de comida" />
        : <Text style={styles.emoji}>{food.emoji}</Text>}
    </View>
  );
}

export function FoodSearchCard({ restrictions, saving, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('cuscuz');
  const [quantity, setQuantity] = useState('160');
  const [mealType, setMealType] = useState<MealType>('cafe');
  const [expanded, setExpanded] = useState(true);
  const [category, setCategory] = useState('Todos');
  const [visibleLimit, setVisibleLimit] = useState(10);

  const normalize = (s: string) => s.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

  const categories = useMemo(() => ['Todos', 'Ovos', 'Pratos e receitas',
    'Carnes e proteínas', 'Raízes e cereais', 'Frutas', 'Laticínios', 'Legumes',
    'Leguminosas', 'Pães e cereais', 'Bebidas', 'Outros'], []);

  const results = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return FOOD_CATALOG.filter((food) => {
      const categoryMatches = category === 'Todos'
        || (category === 'Outros' ? !categories.slice(1, -1).includes(food.category) : food.category === category);
      const haystack = normalize(food.name + ' ' + food.search + ' ' + food.category);
      return categoryMatches && words.every((word) => haystack.includes(word));
    }).sort((a, b) => {
      const aExact = normalize(a.name).startsWith(normalize(query)) ? 0 : 1;
      const bExact = normalize(b.name).startsWith(normalize(query)) ? 0 : 1;
      return aExact - bExact;
    });
  }, [query, category, categories]);
  const visible = results.slice(0, visibleLimit);

  const food: FoodItem = FOOD_CATALOG.find((item) => item.id === selectedId) ?? FOOD_CATALOG[0]!;
  const grams = Number(quantity.replace(',', '.'));
  const validGrams = Number.isFinite(grams) && grams > 0 && grams <= 2000;
  const factor = validGrams ? grams / 100 : 0;
  const blocked = isRestricted(food, restrictions);
  const amount = (value: number) => Number((value * factor).toFixed(1));

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.heading} onPress={() => setExpanded(!expanded)} accessibilityRole="button" accessibilityLabel="Mostrar ou ocultar registro inteligente">
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>NUTRI IA PRO • REGISTRO INTELIGENTE</Text>
          <Text style={styles.title}>O que você comeu?</Text>
          <Text style={styles.subtitle}>Selecione o alimento e informe a quantidade. O cálculo é automático.</Text>
        </View>
        <View style={styles.toggle}><Text style={styles.toggleText}>{expanded ? '−' : '+'}</Text></View>
      </TouchableOpacity>

      {expanded ? (
        <>
          <View style={styles.searchField}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={query}
              onChangeText={(value) => { setQuery(value); setVisibleLimit(10); }}
              placeholder="Buscar: ovos fritos, cuscuz, frango..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {categories.map((item) => (
              <TouchableOpacity key={item}
                onPress={() => { setCategory(item); setVisibleLimit(10); }}
                style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.listTitle}>{query ? 'Resultados encontrados' : 'Explore o catálogo'} · {results.length} opções</Text>
          {visible.length ? visible.map((item) => {
            const chosen = food.id === item.id;
            const restricted = isRestricted(item, restrictions);
            return (
              <TouchableOpacity key={item.id} style={[styles.foodRow, chosen && styles.foodRowSelected]} onPress={() => { setSelectedId(item.id); setQuantity(String(item.servingG ?? 100)); }} accessibilityRole="radio" accessibilityState={{ checked: chosen }}>
                <FoodThumbnail food={item} />
                <View style={styles.foodDetails}>
                  <Text style={styles.foodName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.foodMeta}>{restricted ? 'Verificar restrição' : item.category} · {item.kcal} kcal/100 g</Text>
                </View>
                <Text style={[styles.selectedCircle, chosen && styles.selectedCircleActive]}>{chosen ? '✓' : '○'}</Text>
              </TouchableOpacity>
            );
          }) : <Text style={styles.empty}>Não encontramos este item no catálogo. Use o cadastro pelo rótulo abaixo.</Text>}
          {results.length > visible.length ? (
            <TouchableOpacity onPress={() => setVisibleLimit((n) => n + 12)} style={styles.moreButton}>
              <Text style={styles.moreText}>Mostrar mais alimentos ({results.length - visible.length} restantes)</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedPhoto}><FoodThumbnail food={food} size={78} /></View>
              <View style={styles.selectedText}>
                <Text style={styles.selectedLabel}>PORÇÃO PERSONALIZADA</Text>
                <Text style={styles.selectedName}>{food.name}</Text>
              </View>
            </View>

            <Text style={styles.portionLabel}>Quantidade consumida (g)</Text>
            {food.servingG ? (
              <View style={styles.quickPortionRow}>
                <TouchableOpacity onPress={() => setQuantity(String(food.servingG))} style={styles.quickPortion}>
                  <Text style={styles.quickPortionText}>1 × {food.servingLabel ?? food.servingG + ' g'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setQuantity(String(food.servingG! * 2))} style={styles.quickPortion}>
                  <Text style={styles.quickPortionText}>2 porções</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.portionRow}>
              <TouchableOpacity onPress={() => setQuantity(String(Math.max(10, (validGrams ? grams : 100) - 10)))} style={styles.portionControl} accessibilityLabel="Reduzir dez gramas">
                <Text style={styles.portionControlText}>−</Text>
              </TouchableOpacity>
              <TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" style={styles.portionInput} selectTextOnFocus accessibilityLabel="Quantidade em gramas" />
              <TouchableOpacity onPress={() => setQuantity(String(Math.min(2000, (validGrams ? grams : 100) + 10)))} style={styles.portionControl} accessibilityLabel="Aumentar dez gramas">
                <Text style={styles.portionControlText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.macros}>
              {[
                { label: 'kcal', value: Math.round(amount(food.kcal)) },
                { label: 'proteína', value: amount(food.protein) + ' g' },
                { label: 'carbo.', value: amount(food.carbs) + ' g' },
                { label: 'gorduras', value: amount(food.fat) + ' g' },
              ].map((macro) => (
                <View key={macro.label} style={styles.macro}>
                  <Text style={styles.macroValue}>{validGrams ? macro.value : '—'}</Text>
                  <Text style={styles.macroLabel}>{macro.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sourceNote}>Valores por 100 g. Fonte: {food.source === 'TBCA' ? 'TBCA/USP' : food.source === 'TACO' ? 'TACO/UNICAMP' : 'estimativa inicial'}; pesos e preparos podem variar.</Text>
            {food.note ? <Text style={styles.sourceNote}>{food.note}</Text> : null}
            {blocked ? <Text style={styles.blocked}>Este alimento pode conflitar com uma restrição cadastrada e não pode ser registrado por este atalho.</Text> : null}
          </View>

          <Text style={styles.pickerLabel}>Em qual refeição?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mealPills}>
            {meals.map((item) => (
              <TouchableOpacity key={item.value} onPress={() => setMealType(item.value)} style={[styles.mealPill, mealType === item.value && styles.mealPillActive]}>
                <Text style={[styles.mealPillText, mealType === item.value && styles.mealPillTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            disabled={!validGrams || saving || blocked}
            onPress={() => void onAdd(food, grams, mealType)}
            style={[styles.action, (!validGrams || saving || blocked) && styles.disabled]}
            accessibilityRole="button"
          >
            {saving ? <ActivityIndicator color={theme.colors.navy} /> : <Text style={styles.actionText}>＋  Adicionar ao diário</Text>}
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.white, borderRadius: 24, borderColor: theme.colors.border, borderWidth: 1, padding: 16, marginTop: 16, marginBottom: 15 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  headingText: { flex: 1 },
  eyebrow: { color: theme.colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.navy, fontSize: 25, fontWeight: '900', marginTop: 8 },
  subtitle: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  toggle: { backgroundColor: '#EAF4CD', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  toggleText: { color: theme.colors.navy, fontSize: 22, fontWeight: '800' },
  searchField: { backgroundColor: '#F5F7FA', borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border },
  searchIcon: { color: theme.colors.navy, fontSize: 27, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 12, color: theme.colors.text, fontSize: 13 },
  listTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 14, marginTop: 13, marginBottom: 8 },
  categories: { gap: 7, paddingTop: 13, paddingBottom: 3 },
  categoryChip: { borderColor: theme.colors.border, borderWidth: 1, backgroundColor: '#F6F8FA', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  categoryChipActive: { backgroundColor: theme.colors.navyDark, borderColor: theme.colors.navyDark },
  categoryText: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '700' },
  categoryTextActive: { color: theme.colors.white },
  moreButton: { padding: 12, alignItems: 'center', backgroundColor: '#EDF5E5', borderRadius: 12, marginTop: 11 },
  moreText: { fontSize: 11, fontWeight: '800', color: theme.colors.navy },
  quickPortionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickPortion: { borderRadius: 12, borderWidth: 1, borderColor: '#AECF7C', padding: 8 },
  quickPortionText: { fontSize: 10, color: '#E3F4C2', fontWeight: '800' },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border, padding: 8, borderRadius: 12 },
  foodRowSelected: { backgroundColor: '#EEF7DE', borderBottomColor: '#CBEA8D' },
  thumbnail: { overflow: 'hidden', borderRadius: 12, backgroundColor: '#EAF3D9', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 28 },
  foodDetails: { flex: 1 },
  foodName: { color: theme.colors.navy, fontWeight: '800', fontSize: 12 },
  foodMeta: { color: theme.colors.textMuted, fontSize: 10, marginTop: 4 },
  selectedCircle: { color: '#9AA6B6', fontSize: 23 },
  selectedCircleActive: { color: '#78A91D', fontSize: 21, fontWeight: '900' },
  empty: { color: theme.colors.textMuted, fontSize: 12, paddingVertical: 14 },
  selectedCard: { backgroundColor: theme.colors.navyDark, borderRadius: 20, padding: 14, marginTop: 16 },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  selectedPhoto: { borderRadius: 15, overflow: 'hidden' },
  selectedText: { flex: 1 },
  selectedLabel: { color: '#C5E6A0', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  selectedName: { color: theme.colors.white, fontWeight: '900', fontSize: 18, marginTop: 5 },
  portionLabel: { color: '#DAE2EC', fontSize: 11, marginTop: 14 },
  portionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  portionControl: { width: 39, height: 39, borderRadius: 20, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' },
  portionControlText: { color: theme.colors.navy, fontWeight: '900', fontSize: 25, lineHeight: 30 },
  portionInput: { flex: 1, textAlign: 'center', color: theme.colors.white, fontSize: 20, fontWeight: '900', backgroundColor: '#234363', borderRadius: 13, paddingVertical: 9 },
  macros: { flexDirection: 'row', backgroundColor: '#18365A', borderRadius: 15, paddingVertical: 14, marginTop: 13 },
  macro: { flex: 1, alignItems: 'center' },
  macroValue: { color: theme.colors.white, fontSize: 15, fontWeight: '900' },
  macroLabel: { color: '#CFDCE9', fontSize: 10, marginTop: 5 },
  sourceNote: { color: '#C0CDDA', fontSize: 9, lineHeight: 13, marginTop: 9 },
  blocked: { color: '#FFDBB7', fontSize: 11, lineHeight: 17, marginTop: 7 },
  pickerLabel: { color: theme.colors.navy, fontSize: 12, fontWeight: '900', marginTop: 16 },
  mealPills: { gap: 7, paddingVertical: 10 },
  mealPill: { borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 20 },
  mealPillActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  mealPillText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  mealPillTextActive: { color: theme.colors.white },
  action: { backgroundColor: theme.colors.lime, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 7 },
  actionText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.5 },
});
