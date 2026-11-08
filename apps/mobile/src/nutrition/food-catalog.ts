/**
 * Valores médios estimados por 100 g de alimento preparado, não constituem prescrição.
 * Referências nutricionais a reconciliar com TBCA/USP e rótulos por marca.
 * Fotos externas são ilustrativas (Unsplash); o app não depende delas para funcionar.
 */
export type FoodItem = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  search: string;
  tags: string[];
  image?: string;
};

const foodPhoto = {
  prato: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&q=75',
  vegetais: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=480&q=75',
  cafe: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=480&q=75',
};

export const FOOD_CATALOG: FoodItem[] = [
  { id: 'cuscuz', name: 'Cuscuz de milho cozido', category: 'Raízes e cereais', emoji: '🌽', kcal: 112, protein: 2.2, carbs: 25.3, fat: 0.7, search: 'cuscuz flocao milho', tags: ['milho'] },
  { id: 'inhame', name: 'Inhame cozido', category: 'Raízes e cereais', emoji: '🥔', kcal: 97, protein: 1.5, carbs: 23.2, fat: 0.1, search: 'inhame cará', tags: ['inhame'] },
  { id: 'banana-terra', name: 'Banana-da-terra cozida', category: 'Frutas e raízes', emoji: '🍌', kcal: 116, protein: 1.3, carbs: 30.3, fat: 0.2, search: 'banana da terra cozida', tags: ['banana'] },
  { id: 'abobora', name: 'Abóbora cozida', category: 'Legumes', emoji: '🎃', kcal: 48, protein: 1.4, carbs: 10.8, fat: 0.3, search: 'abobora jerimum', tags: [], image: foodPhoto.vegetais },
  { id: 'aipim', name: 'Aipim cozido', category: 'Raízes e cereais', emoji: '🥔', kcal: 125, protein: 1.0, carbs: 30.1, fat: 0.3, search: 'aipim mandioca macaxeira', tags: ['mandioca'] },
  { id: 'arroz', name: 'Arroz branco cozido', category: 'Raízes e cereais', emoji: '🍚', kcal: 128, protein: 2.5, carbs: 28.1, fat: 0.2, search: 'arroz branco', tags: [] },
  { id: 'arroz-integral', name: 'Arroz integral cozido', category: 'Raízes e cereais', emoji: '🍚', kcal: 124, protein: 2.6, carbs: 25.8, fat: 1.0, search: 'arroz integral', tags: [] },
  { id: 'feijao', name: 'Feijão carioca cozido', category: 'Leguminosas', emoji: '🫘', kcal: 76, protein: 4.8, carbs: 13.6, fat: 0.5, search: 'feijao carioquinha', tags: [] },
  { id: 'frango', name: 'Peito de frango grelhado', category: 'Proteínas', emoji: '🍗', kcal: 165, protein: 31, carbs: 0, fat: 3.6, search: 'frango peito grelhado', tags: ['carne'], image: foodPhoto.prato },
  { id: 'ovo', name: 'Ovo de galinha cozido', category: 'Proteínas', emoji: '🥚', kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, search: 'ovo ovos cozido', tags: ['ovos'] },
  { id: 'peixe', name: 'Tilápia grelhada', category: 'Proteínas', emoji: '🐟', kcal: 128, protein: 26, carbs: 0, fat: 2.5, search: 'peixe tilapia filé', tags: ['peixe', 'frutos do mar', 'carne'], image: foodPhoto.prato },
  { id: 'patinho', name: 'Patinho moído cozido', category: 'Proteínas', emoji: '🥩', kcal: 190, protein: 27, carbs: 0, fat: 9.0, search: 'carne patinho moido', tags: ['carne'] },
  { id: 'batata-doce', name: 'Batata-doce cozida', category: 'Raízes e cereais', emoji: '🍠', kcal: 77, protein: 0.6, carbs: 18.4, fat: 0.1, search: 'batata doce', tags: [] },
  { id: 'aveia', name: 'Aveia em flocos', category: 'Raízes e cereais', emoji: '🌾', kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, search: 'aveia flocos', tags: ['aveia', 'gluten'] },
  { id: 'banana', name: 'Banana-prata crua', category: 'Frutas', emoji: '🍌', kcal: 98, protein: 1.3, carbs: 26.0, fat: 0.1, search: 'banana prata', tags: ['banana'] },
  { id: 'iogurte', name: 'Iogurte natural integral', category: 'Laticínios', emoji: '🥛', kcal: 63, protein: 3.5, carbs: 4.7, fat: 3.3, search: 'iogurte leite natural', tags: ['leite', 'lactose', 'laticinios'], image: foodPhoto.cafe },
];

export function isRestricted(food: FoodItem, restrictions: string[]) {
  const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return restrictions.some((raw) => {
    const restriction = normalize(raw);
    if (!restriction || restriction === 'nenhuma informada') return false;
    if (restriction === 'vegetariano' || restriction === 'vegano') {
      return food.tags.includes('carne') || (restriction === 'vegano' && food.tags.some((tag) => ['ovos', 'leite', 'lactose', 'laticinios'].includes(tag)));
    }
    return food.tags.some((tag) => normalize(tag) === restriction) || normalize(food.name).includes(restriction);
  });
}
