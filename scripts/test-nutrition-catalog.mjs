import assert from 'node:assert/strict';
import { foodCatalog, calculateFood, alternativesTo, quickRecipes, recipeNutrition, incompatibleFood } from '../apps/mobile/src/nutrition/food-catalog.ts';

const ids=new Set();
for (const food of foodCatalog) {
  assert(!ids.has(food.id), 'ID duplicado: '+food.id); ids.add(food.id);
  assert(food.portionG>0, 'Porção inválida: '+food.id);
  for (const key of ['kcal','protein','carbs','fat','fiber']) assert(Number.isFinite(food[key])&&food[key]>=0, 'Nutriente inválido: '+food.id+' '+key);
  assert.equal(calculateFood(food,100).caloriesKcal,food.kcal);
}
for(const required of ['cuscuz','inhame','banana-terra-cozida','aipim','abobora','frango']){
  assert(ids.has(required),'Alimento regional ausente: '+required);
}
assert.throws(()=>calculateFood(foodCatalog[0],0),/porção/i);
assert.throws(()=>calculateFood(foodCatalog[0],Infinity),/porção/i);
const cuscuz=foodCatalog.find(f=>f.id==='cuscuz');
const single=calculateFood(cuscuz,160);
assert.equal(single.caloriesKcal,179.2);
assert.equal(single.carbsG,40.5);
const substitutions=alternativesTo(cuscuz,160,[]);
assert(substitutions.some(x=>x.food.id==='inhame'),'Inhame deveria substituir cuscuz na equivalência de carboidratos');
const allergens=foodCatalog.find(f=>f.id==='queijo-minas');
assert.equal(incompatibleFood(allergens,['leite']),true,'Restrição de leite deve bloquear queijo');
assert(!alternativesTo(cuscuz,160,['mandioca']).some(x=>x.food.id==='aipim'),'Restrições não podem ser ignoradas');
for(const recipe of quickRecipes){
  assert(recipe.ingredients.length>=2);
  assert(recipe.steps.length>=2);
  const macros=recipeNutrition(recipe);
  assert(macros.caloriesKcal>0 && macros.proteinG>0);
}
console.log('[nutri] OK:',foodCatalog.length,'alimentos e',quickRecipes.length,'receitas; cálculo, equivalências e restrições aprovados.');
