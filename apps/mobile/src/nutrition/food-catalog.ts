/**
 * Catálogo local de referência para registro rápido (valores aproximados por 100 g
 * do alimento pronto para consumo, exceto quando indicado).
 * Não substitui tabela oficial ou informação de rótulo.
 */
export type FoodGroup = 'Raízes e cereais' | 'Proteínas' | 'Frutas' | 'Leguminosas' | 'Laticínios' | 'Gorduras e sementes' | 'Vegetais';
export type FoodItem = {
  id: string; name: string; group: FoodGroup; portionG: number;
  kcal: number; protein: number; carbs: number; fat: number; fiber: number;
  allergens?: string[];
  note?: string;
};
export type FoodMacros = { caloriesKcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number };
export const foodCatalog: FoodItem[] = [
  {id:'cuscuz',name:'Cuscuz de milho cozido',group:'Raízes e cereais',portionG:160,kcal:112,protein:2.2,carbs:25.3,fat:0.7,fiber:2.1},
  {id:'inhame',name:'Inhame cozido',group:'Raízes e cereais',portionG:160,kcal:97,protein:1.5,carbs:23.2,fat:0.1,fiber:1.7},
  {id:'banana-terra-cozida',name:'Banana-da-terra cozida',group:'Raízes e cereais',portionG:130,kcal:116,protein:1.2,carbs:30,fat:0.2,fiber:2.3},
  {id:'banana-terra-assada',name:'Banana-da-terra assada (sem óleo)',group:'Raízes e cereais',portionG:120,kcal:128,protein:1.1,carbs:33,fat:0.2,fiber:2.1},
  {id:'aipim',name:'Aipim (mandioca) cozido',group:'Raízes e cereais',portionG:130,kcal:125,protein:0.6,carbs:30.1,fat:0.3,fiber:1.9},
  {id:'batata-doce',name:'Batata-doce cozida',group:'Raízes e cereais',portionG:180,kcal:77,protein:0.6,carbs:18.4,fat:0.1,fiber:2.2},
  {id:'batata-inglesa',name:'Batata inglesa cozida',group:'Raízes e cereais',portionG:200,kcal:52,protein:1.2,carbs:11.9,fat:0,fiber:1.3},
  {id:'arroz-branco',name:'Arroz branco cozido',group:'Raízes e cereais',portionG:150,kcal:128,protein:2.5,carbs:28.1,fat:0.2,fiber:1.6},
  {id:'arroz-integral',name:'Arroz integral cozido',group:'Raízes e cereais',portionG:155,kcal:124,protein:2.6,carbs:25.8,fat:1,fiber:2.7},
  {id:'macarrao',name:'Macarrão cozido simples',group:'Raízes e cereais',portionG:140,kcal:158,protein:5.8,carbs:30.9,fat:0.9,fiber:1.8,allergens:['glúten','trigo']},
  {id:'pao-integral',name:'Pão integral',group:'Raízes e cereais',portionG:60,kcal:250,protein:10,carbs:48,fat:3.3,fiber:6,allergens:['glúten','trigo']},
  {id:'aveia',name:'Aveia em flocos',group:'Raízes e cereais',portionG:30,kcal:390,protein:15,carbs:66,fat:7,fiber:10,note:'Verificar rótulo para contaminação cruzada com glúten'},
  {id:'abobora',name:'Abóbora cozida',group:'Vegetais',portionG:150,kcal:45,protein:1.2,carbs:10.8,fat:0.2,fiber:1.5},
  {id:'brocolis',name:'Brócolis cozido',group:'Vegetais',portionG:120,kcal:35,protein:2.4,carbs:6.7,fat:0.4,fiber:3.3},
  {id:'cenoura',name:'Cenoura cozida',group:'Vegetais',portionG:100,kcal:30,protein:0.8,carbs:6.7,fat:0.2,fiber:2.6},
  {id:'frango',name:'Peito de frango grelhado',group:'Proteínas',portionG:120,kcal:165,protein:31,carbs:0,fat:3.6,fiber:0},
  {id:'frango-desfiado',name:'Frango desfiado cozido',group:'Proteínas',portionG:100,kcal:165,protein:31,carbs:0,fat:3.6,fiber:0},
  {id:'patinho',name:'Patinho moído cozido',group:'Proteínas',portionG:120,kcal:210,protein:28,carbs:0,fat:10,fiber:0},
  {id:'tilapia',name:'Tilápia grelhada',group:'Proteínas',portionG:130,kcal:129,protein:26,carbs:0,fat:2.7,fiber:0,allergens:['peixe']},
  {id:'atum',name:'Atum em água escorrido',group:'Proteínas',portionG:120,kcal:116,protein:26,carbs:0,fat:1,fiber:0,allergens:['peixe']},
  {id:'ovos',name:'Ovo de galinha cozido (peso sem casca)',group:'Proteínas',portionG:100,kcal:146,protein:13.3,carbs:0.6,fat:9.5,fiber:0,allergens:['ovo']},
  {id:'feijao',name:'Feijão carioca cozido',group:'Leguminosas',portionG:120,kcal:76,protein:4.8,carbs:13.6,fat:0.5,fiber:8},
  {id:'lentilha',name:'Lentilha cozida',group:'Leguminosas',portionG:120,kcal:93,protein:6.3,carbs:16.3,fat:0.5,fiber:7.9},
  {id:'grao-de-bico',name:'Grão-de-bico cozido',group:'Leguminosas',portionG:120,kcal:164,protein:8.9,carbs:27.4,fat:2.6,fiber:7.6},
  {id:'banana',name:'Banana prata',group:'Frutas',portionG:90,kcal:98,protein:1.3,carbs:26,fat:0.1,fiber:2},
  {id:'mamao',name:'Mamão',group:'Frutas',portionG:140,kcal:43,protein:0.5,carbs:10.8,fat:0.2,fiber:1.7},
  {id:'maca',name:'Maçã com casca',group:'Frutas',portionG:130,kcal:56,protein:0.3,carbs:15.2,fat:0.2,fiber:2},
  {id:'morango',name:'Morango',group:'Frutas',portionG:100,kcal:30,protein:0.7,carbs:6.8,fat:0.3,fiber:1.7},
  {id:'iogurte-proteico',name:'Iogurte proteico (média; conferir rótulo)',group:'Laticínios',portionG:170,kcal:70,protein:10,carbs:6,fat:0.7,fiber:0,allergens:['leite','lactose']},
  {id:'leite',name:'Leite semidesnatado',group:'Laticínios',portionG:200,kcal:47,protein:3.4,carbs:5,fat:1.6,fiber:0,allergens:['leite','lactose']},
  {id:'queijo-minas',name:'Queijo minas frescal',group:'Laticínios',portionG:40,kcal:264,protein:17.4,carbs:3.2,fat:20.2,fiber:0,allergens:['leite','lactose']},
  {id:'cottage',name:'Queijo cottage',group:'Laticínios',portionG:80,kcal:98,protein:11,carbs:3.4,fat:4.3,fiber:0,allergens:['leite','lactose']},
  {id:'azeite',name:'Azeite de oliva',group:'Gorduras e sementes',portionG:10,kcal:884,protein:0,carbs:0,fat:100,fiber:0},
  {id:'castanhas',name:'Mix de castanhas sem sal',group:'Gorduras e sementes',portionG:20,kcal:610,protein:15,carbs:21,fat:54,fiber:7,allergens:['castanhas','oleaginosas']},
  {id:'chia',name:'Chia',group:'Gorduras e sementes',portionG:10,kcal:486,protein:16.5,carbs:42.1,fat:30.7,fiber:34.4}
];
export type Recipe = { id:string; name:string; prepMinutes:number; meal:string; steps:string[]; ingredients:{foodId:string;grams:number}[] };
export const quickRecipes: Recipe[] = [
  {id:'cuscuz-frango',name:'Cuscuz nordestino com frango',prepMinutes:12,meal:'Pós-treino',ingredients:[{foodId:'cuscuz',grams:160},{foodId:'frango-desfiado',grams:100},{foodId:'queijo-minas',grams:30}],steps:['Hidrate e cozinhe o flocão até obter 160 g de cuscuz pronto.','Aqueça 100 g de frango já cozido e desfiado.','Monte com queijo minas e temperos de sua preferência.']},
  {id:'inhame-ovos',name:'Inhame com ovos',prepMinutes:12,meal:'Café da manhã',ingredients:[{foodId:'inhame',grams:160},{foodId:'ovos',grams:100},{foodId:'iogurte-proteico',grams:170}],steps:['Cozinhe o inhame previamente; separe 160 g.','Cozinhe ou mexa aproximadamente 2 ovos com pouco óleo.','Sirva com um iogurte proteico à parte.']},
  {id:'marmita-frango',name:'Marmita clássica proteica',prepMinutes:15,meal:'Almoço',ingredients:[{foodId:'arroz-branco',grams:150},{foodId:'feijao',grams:120},{foodId:'frango',grams:120},{foodId:'abobora',grams:150},{foodId:'azeite',grams:10}],steps:['Distribua arroz e feijão cozidos na marmita.','Acrescente frango grelhado e abóbora cozida.','Tempere com azeite após aquecer.']},
  {id:'banana-terra',name:'Banana-da-terra com ovos',prepMinutes:12,meal:'Café da manhã',ingredients:[{foodId:'banana-terra-assada',grams:130},{foodId:'ovos',grams:100},{foodId:'cottage',grams:80}],steps:['Asse a banana-da-terra sem óleo.','Prepare os ovos em frigideira antiaderente.','Sirva acompanhada do cottage.']},
  {id:'pote-proteico',name:'Pote proteico para o trabalho',prepMinutes:5,meal:'Lanche',ingredients:[{foodId:'iogurte-proteico',grams:170},{foodId:'aveia',grams:30},{foodId:'chia',grams:10},{foodId:'morango',grams:100}],steps:['Misture iogurte, aveia e chia em pote limpo.','Acrescente morangos picados.','Refrigere e transporte em bolsa térmica.']},
  {id:'peixe-inhame',name:'Tilápia com inhame e brócolis',prepMinutes:20,meal:'Jantar',ingredients:[{foodId:'tilapia',grams:130},{foodId:'inhame',grams:160},{foodId:'brocolis',grams:120},{foodId:'azeite',grams:5}],steps:['Grelhe a tilápia até ficar totalmente cozida.','Sirva com inhame e brócolis cozidos.','Finalize com azeite.']}
];
export function calculateFood(item: Pick<FoodItem,'kcal'|'protein'|'carbs'|'fat'|'fiber'>, grams:number):FoodMacros {
  if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) throw new Error('A porção deve estar entre 1 g e 5.000 g.');
  const factor = grams / 100;
  const round = (value:number) => Math.round(value * 10) / 10;
  return {caloriesKcal:round(item.kcal*factor),proteinG:round(item.protein*factor),carbsG:round(item.carbs*factor),fatG:round(item.fat*factor),fiberG:round(item.fiber*factor)};
}
export function recipeNutrition(recipe:Recipe):FoodMacros {
  return recipe.ingredients.reduce<FoodMacros>((total,ingredient)=>{
    const food = foodCatalog.find(item=>item.id===ingredient.foodId);
    if (!food) throw new Error('Ingrediente não encontrado: '+ingredient.foodId);
    const macros=calculateFood(food,ingredient.grams);
    return {caloriesKcal:total.caloriesKcal+macros.caloriesKcal,proteinG:total.proteinG+macros.proteinG,carbsG:total.carbsG+macros.carbsG,fatG:total.fatG+macros.fatG,fiberG:total.fiberG+macros.fiberG};
  },{caloriesKcal:0,proteinG:0,carbsG:0,fatG:0,fiberG:0});
}
export function normalizedFoodText(value:string) {return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
export function incompatibleFood(food:FoodItem,restrictions:string[]) {
  const terms = [food.name,food.id,...(food.allergens??[])].map(normalizedFoodText);
  return restrictions.some(value=>{
    const restriction = normalizedFoodText(value);
    return !!restriction && terms.some(term=>term.includes(restriction)||restriction.includes(term));
  });
}
export function alternativesTo(food:FoodItem,grams:number,restrictions:string[],limit=5) {
  const reference = calculateFood(food,grams);
  const target=food.group==='Proteínas'?reference.proteinG:reference.carbsG;
  const field=food.group==='Proteínas'?'protein':'carbs';
  return foodCatalog.filter(x=>x.id!==food.id && x.group===food.group && !incompatibleFood(x,restrictions) && x[field]>0)
    .map(x=>({food:x,grams:Math.round(target*100/x[field]/5)*5}))
    .filter(x=>x.grams>0 && x.grams<=500)
    .sort((a,b)=>Math.abs(calculateFood(a.food,a.grams).caloriesKcal-reference.caloriesKcal)-Math.abs(calculateFood(b.food,b.grams).caloriesKcal-reference.caloriesKcal))
    .slice(0,limit);
}
