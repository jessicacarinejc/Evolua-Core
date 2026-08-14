import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type RestrictionRow = { item: string; type: string; hard_block: boolean };
type ConditionRow = { code: string; label: string };
type ProfileRow = { primary_goal: string | null };

type Candidate = {
  title: string;
  ingredients: string[];
  tags: string[];
};

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const catalog: Record<string, Candidate[]> = {
  cafe: [
    { title: 'Ovos, fruta e aveia', ingredients: ['ovos', 'fruta', 'aveia'], tags: ['ovo', 'aveia', 'gluten'] },
    { title: 'Tapioca com frango e fruta', ingredients: ['tapioca', 'frango', 'fruta'], tags: ['mandioca', 'frango'] },
    { title: 'Tofu, fruta e mandioca', ingredients: ['tofu', 'fruta', 'mandioca'], tags: ['soja', 'mandioca'] },
  ],
  almoco: [
    { title: 'Arroz, feijão, frango e vegetais', ingredients: ['arroz', 'feijão', 'frango', 'vegetais'], tags: ['arroz', 'feijao', 'frango'] },
    { title: 'Batata, peixe e vegetais', ingredients: ['batata', 'peixe', 'vegetais'], tags: ['batata', 'peixe'] },
    { title: 'Arroz, lentilha, tofu e vegetais', ingredients: ['arroz', 'lentilha', 'tofu', 'vegetais'], tags: ['arroz', 'lentilha', 'soja'] },
  ],
  lanche: [
    { title: 'Fruta, iogurte e castanhas', ingredients: ['fruta', 'iogurte natural', 'castanhas'], tags: ['leite', 'lactose', 'castanhas'] },
    { title: 'Fruta com pasta de amendoim', ingredients: ['fruta', 'pasta de amendoim'], tags: ['amendoim'] },
    { title: 'Grão-de-bico, vegetais e tapioca', ingredients: ['grão-de-bico', 'vegetais', 'tapioca'], tags: ['grao-de-bico', 'mandioca'] },
  ],
  jantar: [
    { title: 'Omelete, vegetais e batata', ingredients: ['ovos', 'vegetais', 'batata'], tags: ['ovo', 'batata'] },
    { title: 'Frango, arroz e vegetais', ingredients: ['frango', 'arroz', 'vegetais'], tags: ['frango', 'arroz'] },
    { title: 'Lentilha, mandioca e vegetais', ingredients: ['lentilha', 'mandioca', 'vegetais'], tags: ['lentilha', 'mandioca'] },
  ],
};

@Injectable()
export class MealPlanService {
  constructor(private readonly db: DatabaseService) {}

  private isBlocked(candidate: Candidate, restrictions: RestrictionRow[]) {
    return restrictions.some((restriction) => {
      if (!restriction.hard_block) return false;
      const item = normalize(restriction.item);
      return candidate.tags.some((tag) => normalize(tag).includes(item) || item.includes(normalize(tag)));
    });
  }

  private select(kind: keyof typeof catalog, restrictions: RestrictionRow[]) {
    const safe = catalog[kind].filter((candidate) => !this.isBlocked(candidate, restrictions));
    return {
      selected: safe[0] ?? null,
      alternatives: safe.slice(1),
      unavailable: safe.length === 0,
    };
  }

  async getPlan(userId: string) {
    const [profileResult, restrictionsResult, conditionsResult] = await Promise.all([
      this.db.query<ProfileRow>('SELECT primary_goal FROM profiles WHERE user_id = $1', [userId]),
      this.db.query<RestrictionRow>('SELECT item, type, hard_block FROM food_restrictions WHERE user_id = $1 ORDER BY hard_block DESC, item', [userId]),
      this.db.query<ConditionRow>('SELECT code, label FROM health_conditions WHERE user_id = $1 ORDER BY created_at', [userId]),
    ]);

    const restrictions = restrictionsResult.rows;
    const clinicalReviewRecommended = conditionsResult.rows.length > 0 || restrictions.some((item) => item.type === 'clinica');
    const meal = (key: keyof typeof catalog, label: string) => ({ key, label, ...this.select(key, restrictions) });

    return {
      goal: profileResult.rows[0]?.primary_goal ?? 'manutencao',
      meals: [
        meal('cafe', 'Café da manhã'),
        meal('almoco', 'Almoço'),
        meal('lanche', 'Lanche'),
        meal('jantar', 'Jantar'),
      ],
      safety: {
        hardBlocksApplied: restrictions.filter((item) => item.hard_block).map((item) => item.item),
        clinicalReviewRecommended,
        automaticPrescription: false,
        conditions: conditionsResult.rows,
        note: clinicalReviewRecommended
          ? 'Há condição clínica cadastrada. O plano serve como organização educativa e requer revisão individual antes de uso clínico.'
          : 'As opções respeitam bloqueios cadastrados; confirme ingredientes e rótulos antes do consumo.',
      },
    };
  }
}
