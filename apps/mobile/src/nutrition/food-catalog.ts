export type FoodCatalogItem = {
  id: string;
  name: string;
  aliases: string[];
  servingLabel: string;
  servingAmount: number;
  servingUnit: 'g' | 'ml';
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sourceLabel: string;
};

export type ScaledFoodNutrition = {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export const foodCatalog: FoodCatalogItem[] = [
  {
    id: 'ovo-cozido',
    name: 'Ovo cozido',
    aliases: ['ovo', 'ovo cozido', 'ovo de galinha', 'ovo inteiro cozido'],
    servingLabel: '1 unidade média (50 g)',
    servingAmount: 50,
    servingUnit: 'g',
    caloriesKcal: 62,
    proteinG: 5.2,
    carbsG: 0.69,
    fatG: 4.35,
    sourceLabel: 'TBCA BRC0010J',
  },
  {
    id: 'pao-frances',
    name: 'Pão francês',
    aliases: ['pão francês', 'pao frances', 'pão de sal', 'pao de sal', 'cacetinho'],
    servingLabel: '1 unidade média (50 g)',
    servingAmount: 50,
    servingUnit: 'g',
    caloriesKcal: 149,
    proteinG: 4.91,
    carbsG: 30.8,
    fatG: 1.06,
    sourceLabel: 'TBCA BRC0002A',
  },
  {
    id: 'feijao-carioca-cozido',
    name: 'Feijão carioca cozido',
    aliases: ['feijão', 'feijao', 'feijão carioca', 'feijao carioca', 'feijão cozido', 'feijao cozido'],
    servingLabel: '1 concha rasa (80 g)',
    servingAmount: 80,
    servingUnit: 'g',
    caloriesKcal: 56,
    proteinG: 3.82,
    carbsG: 12.2,
    fatG: 0.43,
    sourceLabel: 'TBCA BRC0001T',
  },
  {
    id: 'leite-integral',
    name: 'Leite integral',
    aliases: ['leite', 'leite integral', 'leite de vaca integral'],
    servingLabel: '1 copo (240 ml)',
    servingAmount: 240,
    servingUnit: 'ml',
    caloriesKcal: 149,
    proteinG: 7.66,
    carbsG: 11.5,
    fatG: 8.14,
    sourceLabel: 'TBCA BRC0043G',
  },
  {
    id: 'peito-frango-grelhado',
    name: 'Peito de frango grelhado',
    aliases: ['frango', 'peito de frango', 'frango grelhado', 'peito de frango grelhado'],
    servingLabel: '1 porção (100 g)',
    servingAmount: 100,
    servingUnit: 'g',
    caloriesKcal: 159,
    proteinG: 28.8,
    carbsG: 0.35,
    fatG: 4.66,
    sourceLabel: 'TBCA BRD0014F',
  },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function searchFoodCatalog(query: string) {
  const normalized = normalize(query);
  if (normalized.length < 2) return [];

  return foodCatalog
    .filter((item) => {
      const haystack = [item.name, ...item.aliases].map(normalize);
      return haystack.some((candidate) => candidate.includes(normalized));
    })
    .sort((a, b) => {
      const aNames = [a.name, ...a.aliases].map(normalize);
      const bNames = [b.name, ...b.aliases].map(normalize);
      const aExact = aNames.includes(normalized) ? 0 : 1;
      const bExact = bNames.includes(normalized) ? 0 : 1;
      return aExact - bExact || a.name.localeCompare(b.name, 'pt-BR');
    });
}

export function findExactFood(query: string) {
  const normalized = normalize(query);
  if (!normalized) return null;
  return foodCatalog.find((item) => [item.name, ...item.aliases].map(normalize).includes(normalized)) ?? null;
}

export function scaleFood(item: FoodCatalogItem, servings: number): ScaledFoodNutrition {
  const safeServings = Number.isFinite(servings) && servings > 0 ? servings : 1;
  return {
    caloriesKcal: item.caloriesKcal * safeServings,
    proteinG: item.proteinG * safeServings,
    carbsG: item.carbsG * safeServings,
    fatG: item.fatG * safeServings,
  };
}
