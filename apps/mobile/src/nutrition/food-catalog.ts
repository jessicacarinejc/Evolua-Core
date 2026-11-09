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
  servingG?: number;
  servingLabel?: string;
  note?: string;
  source?: 'TBCA' | 'TACO' | 'estimativa';
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
  { id: "ovo-frito", name: "Ovo inteiro frito com óleo", category: "Ovos", emoji: "🍳", kcal: 235, protein: 15.6, carbs: 1.19, fat: 18.6, search: "ovo ovos frito fritos frigideira", tags: ["ovos"], servingG: 50, servingLabel: "1 ovo médio (50 g)", source: "TBCA", note: "TBCA BRC0015J: ovo frito em óleo de soja. A quantidade de óleo absorvido varia; não some novamente o mesmo óleo usado nesta opção." },
  { id: "ovo-frito-sem-oleo", name: "Ovo na frigideira sem óleo", category: "Ovos", emoji: "🍳", kcal: 143, protein: 13, carbs: 1.6, fat: 8.9, search: "ovo ovos frito sem oleo antiaderente", tags: ["ovos"], servingG: 50, servingLabel: "1 ovo médio (50 g)", source: "estimativa", note: "Valores de ovo inteiro sem adição de óleo ou manteiga." },
  { id: "ovo-mexido", name: "Ovos mexidos sem óleo", category: "Ovos", emoji: "🍳", kcal: 143, protein: 13, carbs: 1.6, fat: 8.9, search: "ovo ovos mexidos mexido", tags: ["ovos"], servingG: 50, servingLabel: "1 ovo (50 g)", source: "estimativa", note: "Sem óleo ou manteiga. Se adicionou gordura, prefira registrar ingredientes separadamente." },
  { id: "ovo-mexido-manteiga", name: "Ovos mexidos com manteiga", category: "Ovos", emoji: "🍳", kcal: 195, protein: 12.4, carbs: 1.4, fat: 15.4, search: "ovo ovos mexidos com manteiga", tags: ["ovos","leite","lactose","laticinios"], servingG: 100, servingLabel: "porção (100 g)", source: "estimativa", note: "Depende de quanto de manteiga foi usado." },
  { id: "omelete-simples", name: "Omelete simples", category: "Ovos", emoji: "🍳", kcal: 174, protein: 12.7, carbs: 1, fat: 13.2, search: "ovo ovos omelete simples", tags: ["ovos"], servingG: 100, servingLabel: "porção (100 g)", source: "estimativa", note: "Sem queijo; quantidade de gordura adicionada muda os valores." },
  { id: "omelete-queijo", name: "Omelete com queijo", category: "Ovos", emoji: "🧀", kcal: 268, protein: 15.6, carbs: 0.4, fat: 22, search: "ovo ovos omelete queijo", tags: ["ovos","leite","lactose","laticinios"], servingG: 100, servingLabel: "porção (100 g)", source: "TACO", note: "TACO 4ª edição, omelete de queijo." },
  { id: "ovo-clara", name: "Clara de ovo cozida", category: "Ovos", emoji: "🥚", kcal: 59, protein: 13.4, carbs: 0, fat: 0.1, search: "ovo ovos clara cozida", tags: ["ovos"], servingG: 33, servingLabel: "1 clara (33 g)", source: "TACO", note: "TACO, clara cozida." },
  { id: "ovo-cru", name: "Ovo inteiro cru", category: "Ovos", emoji: "🥚", kcal: 143, protein: 13, carbs: 1.6, fat: 8.9, search: "ovo ovos cru inteiro", tags: ["ovos"], servingG: 50, servingLabel: "1 ovo (50 g)", source: "TACO", note: "TACO, ovo cru. Consumo cru tem risco microbiológico." },
  { id: "ovo-poche", name: "Ovo pochê", category: "Ovos", emoji: "🥚", kcal: 143, protein: 13, carbs: 1.6, fat: 8.9, search: "ovo ovos poche escalfado", tags: ["ovos"], servingG: 50, servingLabel: "1 ovo (50 g)", source: "estimativa", note: "Preparado sem gordura adicional." },
  { id: "ovo-codorna", name: "Ovo de codorna cozido", category: "Ovos", emoji: "🥚", kcal: 177, protein: 13.7, carbs: 0.8, fat: 12.7, search: "ovo ovos codorna", tags: ["ovos"], servingG: 10, servingLabel: "1 ovo de codorna (10 g)", source: "TACO", note: "TACO traz valor de ovo de codorna cru; valor para cozido é aproximação." },
  { id: 'peixe', name: 'Tilápia grelhada', category: 'Proteínas', emoji: '🐟', kcal: 128, protein: 26, carbs: 0, fat: 2.5, search: 'peixe tilapia filé', tags: ['peixe', 'frutos do mar', 'carne'], image: foodPhoto.prato },
  { id: 'patinho', name: 'Patinho moído cozido', category: 'Proteínas', emoji: '🥩', kcal: 190, protein: 27, carbs: 0, fat: 9.0, search: 'carne patinho moido', tags: ['carne'] },
  { id: 'batata-doce', name: 'Batata-doce cozida', category: 'Raízes e cereais', emoji: '🍠', kcal: 77, protein: 0.6, carbs: 18.4, fat: 0.1, search: 'batata doce', tags: [] },
  { id: 'aveia', name: 'Aveia em flocos', category: 'Raízes e cereais', emoji: '🌾', kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, search: 'aveia flocos', tags: ['aveia', 'gluten'] },
  { id: 'banana', name: 'Banana-prata crua', category: 'Frutas', emoji: '🍌', kcal: 98, protein: 1.3, carbs: 26.0, fat: 0.1, search: 'banana prata', tags: ['banana'] },
  { id: 'iogurte', name: 'Iogurte natural integral', category: 'Laticínios', emoji: '🥛', kcal: 63, protein: 3.5, carbs: 4.7, fat: 3.3, search: 'iogurte leite natural', tags: ['leite', 'lactose', 'laticinios'], image: foodPhoto.cafe },
  { id: "cuscuz-ovos", name: "Cuscuz com ovos mexidos", category: "Pratos e receitas", emoji: "🍲", kcal: 169, protein: 8.9, carbs: 20.6, fat: 5.7, search: "cuscuz ovo ovos mexido", tags: ["milho","ovos"], servingG: 150, servingLabel: "porção pequena (150 g)", source: 'estimativa', note: "Combinação média: depende das quantidades de cuscuz, ovos e gordura." },
  { id: "cuscuz-frango", name: "Cuscuz com frango desfiado", category: "Pratos e receitas", emoji: "🍲", kcal: 163, protein: 13.7, carbs: 20.4, fat: 3.3, search: "cuscuz frango desfiado", tags: ["milho","carne"], servingG: 150, servingLabel: "porção pequena (150 g)", source: 'estimativa', note: "Combinação média: frango e recheio podem variar." },
  { id: "cuscuz-manteiga", name: "Cuscuz com manteiga", category: "Pratos e receitas", emoji: "🌽", kcal: 185, protein: 2.2, carbs: 23.4, fat: 9.4, search: "cuscuz manteiga", tags: ["milho","leite","lactose","laticinios"], servingG: 100, servingLabel: "porção (100 g)", source: 'estimativa', note: "Para maior precisão registre cuscuz e manteiga separadamente." },
  { id: "tapioca", name: "Tapioca pronta sem recheio", category: "Pães e cereais", emoji: "🥞", kcal: 230, protein: 0.2, carbs: 56, fat: 0.1, search: "tapioca beiju goma", tags: ["mandioca"], servingG: 60, servingLabel: "1 disco pequeno (60 g)", source: 'estimativa' },
  { id: "crepioca", name: "Crepioca simples", category: "Pratos e receitas", emoji: "🥞", kcal: 190, protein: 9, carbs: 23, fat: 7, search: "crepioca tapioca ovos", tags: ["mandioca","ovos"], servingG: 120, servingLabel: "1 unidade (120 g)", source: 'estimativa', note: "Valor depende da proporção de tapioca e ovos." },
  { id: "tapioca-queijo", name: "Tapioca com queijo coalho", category: "Pratos e receitas", emoji: "🥞", kcal: 267, protein: 8.7, carbs: 42, fat: 6.8, search: "tapioca queijo coalho", tags: ["mandioca","leite","lactose","laticinios"], servingG: 120, servingLabel: "1 unidade (120 g)", source: 'estimativa', note: "Preparo e quantidade de queijo alteram valores." },
  { id: "pao-frances", name: "Pão francês", category: "Pães e cereais", emoji: "🥖", kcal: 300, protein: 8, carbs: 58.6, fat: 3.1, search: "pao frances cacetinho", tags: ["trigo","gluten"], servingG: 50, servingLabel: "1 unidade (50 g)", source: 'estimativa' },
  { id: "pao-integral", name: "Pão de forma integral", category: "Pães e cereais", emoji: "🍞", kcal: 252, protein: 9.4, carbs: 49.9, fat: 3.7, search: "pao integral fatia", tags: ["trigo","gluten"], servingG: 25, servingLabel: "1 fatia (25 g)", source: 'estimativa' },
  { id: "pao-queijo", name: "Pão de queijo", category: "Pães e cereais", emoji: "🧀", kcal: 363, protein: 5.1, carbs: 34.2, fat: 24.6, search: "pao queijo", tags: ["leite","lactose","laticinios","ovos"], servingG: 30, servingLabel: "1 unidade pequena (30 g)", source: 'estimativa' },
  { id: "queijo-coalho", name: "Queijo coalho", category: "Laticínios", emoji: "🧀", kcal: 330, protein: 23, carbs: 2, fat: 25, search: "queijo coalho", tags: ["leite","lactose","laticinios"], servingG: 30, servingLabel: "1 fatia (30 g)", source: 'estimativa' },
  { id: "queijo-minas", name: "Queijo minas frescal", category: "Laticínios", emoji: "🧀", kcal: 264, protein: 17.4, carbs: 3.2, fat: 20.2, search: "queijo branco minas frescal", tags: ["leite","lactose","laticinios"], servingG: 30, servingLabel: "1 fatia (30 g)", source: 'estimativa' },
  { id: "ricota", name: "Ricota fresca", category: "Laticínios", emoji: "🧀", kcal: 140, protein: 12.6, carbs: 3.8, fat: 8.1, search: "ricota queijo fresco", tags: ["leite","lactose","laticinios"], servingG: 30, servingLabel: "1 porção (30 g)", source: 'estimativa' },
  { id: "requeijao", name: "Requeijão cremoso", category: "Laticínios", emoji: "🧀", kcal: 257, protein: 9.6, carbs: 2.4, fat: 23.4, search: "requeijao creme", tags: ["leite","lactose","laticinios"], servingG: 30, servingLabel: "1 colher (30 g)", source: 'estimativa' },
  { id: "leite-integral", name: "Leite integral", category: "Bebidas", emoji: "🥛", kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.5, search: "leite integral", tags: ["leite","lactose","laticinios"], servingG: 200, servingLabel: "1 copo (200 ml aprox.)", source: 'estimativa' },
  { id: "leite-desnatado", name: "Leite desnatado", category: "Bebidas", emoji: "🥛", kcal: 35, protein: 3.4, carbs: 5, fat: 0.1, search: "leite desnatado", tags: ["leite","lactose","laticinios"], servingG: 200, servingLabel: "1 copo (200 ml aprox.)", source: 'estimativa' },
  { id: "iogurte-desnatado", name: "Iogurte natural desnatado", category: "Laticínios", emoji: "🥛", kcal: 43, protein: 3.8, carbs: 5.5, fat: 0.2, search: "iogurte desnatado", tags: ["leite","lactose","laticinios"], servingG: 170, servingLabel: "1 pote (170 g)", source: 'estimativa' },
  { id: "frango-desfiado", name: "Peito de frango cozido desfiado", category: "Carnes e proteínas", emoji: "🍗", kcal: 165, protein: 31, carbs: 0, fat: 3.6, search: "frango peito desfiado cozido", tags: ["carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa', note: "Sem molho ou gordura extra." },
  { id: "frango-assado", name: "Frango assado sem pele", category: "Carnes e proteínas", emoji: "🍗", kcal: 190, protein: 29, carbs: 0, fat: 7.7, search: "frango assado forno", tags: ["carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "coxa-frango", name: "Coxa de frango assada sem pele", category: "Carnes e proteínas", emoji: "🍗", kcal: 209, protein: 26, carbs: 0, fat: 11, search: "coxa frango assada", tags: ["carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "carne-moida", name: "Carne moída refogada", category: "Carnes e proteínas", emoji: "🥩", kcal: 212, protein: 26, carbs: 1, fat: 11, search: "carne moida patinho refogada", tags: ["carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa', note: "Depende do corte e óleo no refogado." },
  { id: "bife-grelhado", name: "Bife bovino grelhado", category: "Carnes e proteínas", emoji: "🥩", kcal: 219, protein: 30, carbs: 0, fat: 10.6, search: "bife grelhado carne alcatra", tags: ["carne"], servingG: 100, servingLabel: "1 bife pequeno (100 g)", source: 'estimativa' },
  { id: "carne-panela", name: "Carne de panela cozida", category: "Carnes e proteínas", emoji: "🥩", kcal: 198, protein: 29, carbs: 0, fat: 9, search: "carne de panela cozida", tags: ["carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "lombo-suino", name: "Lombo suíno assado", category: "Carnes e proteínas", emoji: "🥩", kcal: 200, protein: 29, carbs: 0, fat: 8, search: "lombo porco suino", tags: ["carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "atum", name: "Atum em água escorrido", category: "Carnes e proteínas", emoji: "🐟", kcal: 116, protein: 26, carbs: 0, fat: 1, search: "atum enlatado água", tags: ["peixe","frutos do mar","carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "sardinha", name: "Sardinha em conserva (escorrida)", category: "Carnes e proteínas", emoji: "🐟", kcal: 210, protein: 24.6, carbs: 0, fat: 12, search: "sardinha lata enlatada", tags: ["peixe","frutos do mar","carne"], servingG: 84, servingLabel: "lata escorrida (84 g)", source: 'estimativa' },
  { id: "salmao", name: "Salmão grelhado", category: "Carnes e proteínas", emoji: "🐟", kcal: 206, protein: 22.1, carbs: 0, fat: 12.4, search: "salmao grelhado peixe", tags: ["peixe","frutos do mar","carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "camarao", name: "Camarão cozido", category: "Carnes e proteínas", emoji: "🦐", kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, search: "camarao cozido", tags: ["crustaceos","frutos do mar","carne"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "tofu", name: "Tofu firme", category: "Proteínas vegetais", emoji: "🌱", kcal: 83, protein: 8.1, carbs: 1.9, fat: 4.8, search: "tofu soja", tags: ["soja"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "lentilha", name: "Lentilha cozida", category: "Leguminosas", emoji: "🫘", kcal: 93, protein: 6.3, carbs: 16.3, fat: 0.5, search: "lentilha", tags: ["leguminosas"], servingG: 100, servingLabel: "1 concha pequena (100 g)", source: 'estimativa' },
  { id: "grao-bico", name: "Grão-de-bico cozido", category: "Leguminosas", emoji: "🫘", kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, search: "grao bico", tags: ["leguminosas"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "feijao-preto", name: "Feijão preto cozido", category: "Leguminosas", emoji: "🫘", kcal: 77, protein: 4.5, carbs: 14, fat: 0.5, search: "feijao preto", tags: ["leguminosas"], servingG: 100, servingLabel: "1 concha pequena (100 g)", source: 'estimativa' },
  { id: "feijao-fradinho", name: "Feijão-fradinho cozido", category: "Leguminosas", emoji: "🫘", kcal: 116, protein: 8, carbs: 20.8, fat: 0.4, search: "feijao fradinho macassar", tags: ["leguminosas"], servingG: 100, servingLabel: "1 concha (100 g)", source: 'estimativa' },
  { id: "ervilha", name: "Ervilha cozida", category: "Leguminosas", emoji: "🫛", kcal: 84, protein: 5.4, carbs: 15.6, fat: 0.2, search: "ervilha", tags: ["leguminosas"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "arroz-parboilizado", name: "Arroz parboilizado cozido", category: "Raízes e cereais", emoji: "🍚", kcal: 123, protein: 2.9, carbs: 26.8, fat: 0.4, search: "arroz parboilizado", tags: ["arroz"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "macarrao", name: "Macarrão cozido sem molho", category: "Pães e cereais", emoji: "🍝", kcal: 157, protein: 5.8, carbs: 30.9, fat: 0.9, search: "macarrao massa espaguete", tags: ["trigo","gluten"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "macarrao-molho", name: "Macarrão ao molho de tomate", category: "Pratos e receitas", emoji: "🍝", kcal: 137, protein: 4.4, carbs: 24.5, fat: 2.3, search: "macarrao molho tomate", tags: ["trigo","gluten"], servingG: 150, servingLabel: "1 porção (150 g)", source: 'estimativa', note: "Depende de óleo e molho." },
  { id: "batata", name: "Batata inglesa cozida", category: "Raízes e cereais", emoji: "🥔", kcal: 52, protein: 1.2, carbs: 11.9, fat: 0, search: "batata inglesa", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "batata-assada", name: "Batata assada sem óleo", category: "Raízes e cereais", emoji: "🥔", kcal: 93, protein: 2.5, carbs: 21.2, fat: 0.1, search: "batata forno assada", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "pure-batata", name: "Purê de batata com leite", category: "Pratos e receitas", emoji: "🥔", kcal: 113, protein: 2.1, carbs: 16.3, fat: 4.3, search: "pure batata", tags: ["leite","lactose","laticinios"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa', note: "Varia com manteiga e leite." },
  { id: "banana-terra-assada", name: "Banana-da-terra assada", category: "Frutas", emoji: "🍌", kcal: 123, protein: 1.3, carbs: 32.1, fat: 0.2, search: "banana da terra assada", tags: ["banana"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "banana-terra-frita", name: "Banana-da-terra frita", category: "Frutas", emoji: "🍌", kcal: 204, protein: 1.4, carbs: 36, fat: 6, search: "banana da terra frita óleo", tags: ["banana"], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa', note: "Depende do óleo absorvido." },
  { id: "mamao", name: "Mamão papaia", category: "Frutas", emoji: "🍈", kcal: 43, protein: 0.5, carbs: 10.8, fat: 0.3, search: "mamao papaya", tags: [], servingG: 100, servingLabel: "1 fatia (100 g)", source: 'estimativa' },
  { id: "maca", name: "Maçã com casca", category: "Frutas", emoji: "🍎", kcal: 59, protein: 0.3, carbs: 15.2, fat: 0.2, search: "maca", tags: [], servingG: 130, servingLabel: "1 unidade pequena (130 g)", source: 'estimativa' },
  { id: "laranja", name: "Laranja pera", category: "Frutas", emoji: "🍊", kcal: 37, protein: 1, carbs: 8.9, fat: 0.1, search: "laranja", tags: [], servingG: 130, servingLabel: "1 unidade (130 g)", source: 'estimativa' },
  { id: "manga", name: "Manga madura", category: "Frutas", emoji: "🥭", kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, search: "manga", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "melancia", name: "Melancia", category: "Frutas", emoji: "🍉", kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, search: "melancia", tags: [], servingG: 150, servingLabel: "1 fatia pequena (150 g)", source: 'estimativa' },
  { id: "abacaxi", name: "Abacaxi", category: "Frutas", emoji: "🍍", kcal: 48, protein: 0.5, carbs: 12.3, fat: 0.1, search: "abacaxi", tags: [], servingG: 100, servingLabel: "1 fatia (100 g)", source: 'estimativa' },
  { id: "morango", name: "Morango", category: "Frutas", emoji: "🍓", kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, search: "morango", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "uva", name: "Uva", category: "Frutas", emoji: "🍇", kcal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, search: "uva", tags: [], servingG: 100, servingLabel: "1 cacho pequeno (100 g)", source: 'estimativa' },
  { id: "abacate", name: "Abacate", category: "Frutas", emoji: "🥑", kcal: 96, protein: 1.2, carbs: 6, fat: 8.4, search: "abacate", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "castanha-caju", name: "Castanha de caju torrada", category: "Oleaginosas", emoji: "🥜", kcal: 574, protein: 15.3, carbs: 32.7, fat: 46.3, search: "castanha caju", tags: ["castanhas","oleaginosas"], servingG: 30, servingLabel: "1 punhado (30 g)", source: 'estimativa' },
  { id: "amendoim", name: "Amendoim torrado sem sal", category: "Oleaginosas", emoji: "🥜", kcal: 606, protein: 22.5, carbs: 18.7, fat: 54, search: "amendoim torrado", tags: ["amendoim","oleaginosas"], servingG: 30, servingLabel: "1 punhado (30 g)", source: 'estimativa' },
  { id: "chia", name: "Semente de chia", category: "Sementes", emoji: "🌱", kcal: 486, protein: 16.5, carbs: 42.1, fat: 30.7, search: "chia sementes", tags: ["sementes"], servingG: 10, servingLabel: "1 colher de sopa (10 g)", source: 'estimativa' },
  { id: "linhaca", name: "Semente de linhaça", category: "Sementes", emoji: "🌾", kcal: 534, protein: 18.3, carbs: 28.9, fat: 42.2, search: "linhaca linhaça", tags: ["sementes"], servingG: 10, servingLabel: "1 colher de sopa (10 g)", source: 'estimativa' },
  { id: "azeite", name: "Azeite de oliva", category: "Óleos e gorduras", emoji: "🫒", kcal: 884, protein: 0, carbs: 0, fat: 100, search: "azeite oliva", tags: ["oleo"], servingG: 5, servingLabel: "1 colher de chá (5 g)", source: 'estimativa' },
  { id: "oleo-soja", name: "Óleo de soja", category: "Óleos e gorduras", emoji: "🫗", kcal: 884, protein: 0, carbs: 0, fat: 100, search: "oleo de soja", tags: ["soja","oleo"], servingG: 5, servingLabel: "1 colher de chá (5 g)", source: 'estimativa' },
  { id: "manteiga", name: "Manteiga com sal", category: "Óleos e gorduras", emoji: "🧈", kcal: 717, protein: 0.9, carbs: 0.1, fat: 81, search: "manteiga", tags: ["leite","lactose","laticinios"], servingG: 10, servingLabel: "1 colher rasa (10 g)", source: 'estimativa' },
  { id: "brocolis", name: "Brócolis cozido", category: "Legumes", emoji: "🥦", kcal: 35, protein: 2.4, carbs: 7.2, fat: 0.4, search: "brocolis", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "cenoura", name: "Cenoura cozida", category: "Legumes", emoji: "🥕", kcal: 30, protein: 0.8, carbs: 6.7, fat: 0.2, search: "cenoura", tags: [], servingG: 80, servingLabel: "1 porção (80 g)", source: 'estimativa' },
  { id: "tomate", name: "Tomate cru", category: "Legumes", emoji: "🍅", kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, search: "tomate", tags: [], servingG: 100, servingLabel: "1 unidade (100 g)", source: 'estimativa' },
  { id: "alface", name: "Alface crua", category: "Legumes", emoji: "🥬", kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, search: "alface", tags: [], servingG: 60, servingLabel: "porção (60 g)", source: 'estimativa' },
  { id: "couve", name: "Couve refogada", category: "Legumes", emoji: "🥬", kcal: 86, protein: 1.6, carbs: 8.7, fat: 5.3, search: "couve refogada", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa', note: "Varia com o óleo utilizado." },
  { id: "pepino", name: "Pepino cru", category: "Legumes", emoji: "🥒", kcal: 15, protein: 0.6, carbs: 3.6, fat: 0.1, search: "pepino", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "beterraba", name: "Beterraba cozida", category: "Legumes", emoji: "🥗", kcal: 43, protein: 1.6, carbs: 10, fat: 0.2, search: "beterraba", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "chuchu", name: "Chuchu cozido", category: "Legumes", emoji: "🥬", kcal: 19, protein: 0.8, carbs: 4.5, fat: 0.1, search: "chuchu", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa' },
  { id: "cafe-preto", name: "Café preto sem açúcar", category: "Bebidas", emoji: "☕", kcal: 2, protein: 0.3, carbs: 0, fat: 0, search: "cafe coado expresso", tags: [], servingG: 100, servingLabel: "1 xícara (100 ml aprox.)", source: 'estimativa' },
  { id: "suco-laranja", name: "Suco de laranja natural sem açúcar", category: "Bebidas", emoji: "🍊", kcal: 45, protein: 0.7, carbs: 10.4, fat: 0.2, search: "suco laranja natural", tags: [], servingG: 200, servingLabel: "1 copo (200 ml aprox.)", source: 'estimativa' },
  { id: "acai-polpa", name: "Açaí polpa sem xarope", category: "Frutas", emoji: "🫐", kcal: 65, protein: 1.2, carbs: 6.2, fat: 3.9, search: "acai polpa puro", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa', note: "Açaí comercial adoçado varia muito." },
  { id: "acai-adocado", name: "Açaí adoçado tipo creme", category: "Sobremesas", emoji: "🍨", kcal: 130, protein: 1.8, carbs: 25.2, fat: 2.7, search: "acai adocado xarope", tags: [], servingG: 100, servingLabel: "1 porção (100 g)", source: 'estimativa', note: "Verificar rótulo da marca; pode variar bastante." },
  { id: "chocolate", name: "Chocolate ao leite", category: "Sobremesas", emoji: "🍫", kcal: 535, protein: 7.6, carbs: 59.4, fat: 29.7, search: "chocolate ao leite", tags: ["leite","lactose","laticinios"], servingG: 25, servingLabel: "1 barra pequena (25 g)", source: 'estimativa' },
  { id: "bolo-simples", name: "Bolo simples caseiro", category: "Sobremesas", emoji: "🍰", kcal: 322, protein: 5.4, carbs: 56.5, fat: 8.3, search: "bolo caseiro", tags: ["trigo","gluten","ovos","leite","lactose"], servingG: 60, servingLabel: "1 fatia (60 g)", source: 'estimativa', note: "Ingredientes variam por receita." },
  { id: "granola", name: "Granola tradicional", category: "Pães e cereais", emoji: "🥣", kcal: 404, protein: 10, carbs: 64, fat: 12, search: "granola cereais", tags: ["aveia","gluten","oleaginosas"], servingG: 30, servingLabel: "3 colheres (30 g)", source: 'estimativa', note: "Confira marca e alérgenos." },
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
