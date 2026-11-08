import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, MealType, NutritionDay } from '../api/client';
import { alternativesTo, calculateFood, foodCatalog, incompatibleFood, normalizedFoodText, quickRecipes, recipeNutrition, FoodItem, Recipe } from './food-catalog';
import { theme } from '../theme';

type Props={token:string; restrictions:string[]; mealType:MealType; onSaved:(day:NutritionDay)=>void};
type Mode='alimento'|'receita';
const fmt=(n:number)=>Number.isFinite(n)?n.toFixed(1).replace('.',','):'—';
export function QuickFoodLogger({token,restrictions,mealType,onSaved}:Props){
  const [mode,setMode]=useState<Mode>('alimento');
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<FoodItem|null>(foodCatalog[0] ?? null);
  const [grams,setGrams]=useState('160');
  const [showAlternatives,setShowAlternatives]=useState(false);
  const [saving,setSaving]=useState(false);
  const [showSteps,setShowSteps]=useState<string|null>(null);
  const results=useMemo(()=>foodCatalog.filter(food=>normalizedFoodText(food.name).includes(normalizedFoodText(query))||normalizedFoodText(food.group).includes(normalizedFoodText(query))).slice(0,15),[query]);
  const amount=Number(grams.replace(',','.'));
  const valid=Number.isFinite(amount)&&amount>0&&amount<=5000;
  const preview=selected&&valid?calculateFood(selected,amount):null;
  const alternatives=selected&&valid?alternativesTo(selected,amount,restrictions):[];
  const blocked=selected?incompatibleFood(selected,restrictions):false;
  const addFood=async()=>{
    if(!selected||!preview||blocked)return;
    setSaving(true);
    try{
      const day=await api.addMealEntry(token,{mealType,name:selected.name,quantityG:amount,...preview,notes:'Estimativa automática do catálogo Evolua Core (porção em gramas).'});
      onSaved(day);
      Alert.alert('Registrado','Alimento adicionado ao diário com calorias e macronutrientes estimados.');
    }catch(error){Alert.alert('Não foi possível salvar',error instanceof Error?error.message:'Tente novamente.');}
    finally{setSaving(false);}
  };
  const addRecipe=async(recipe:Recipe)=>{
    const ingredients=recipe.ingredients.map(ingredient=>foodCatalog.find(food=>food.id===ingredient.foodId)).filter((item):item is FoodItem=>!!item);
    if(ingredients.some(food=>incompatibleFood(food,restrictions))){
      Alert.alert('Receita incompatível','A receita contém ingrediente marcado em suas restrições alimentares.');return;
    }
    const macros=recipeNutrition(recipe);
    const totalGrams=recipe.ingredients.reduce((sum,item)=>sum+item.grams,0);
    if(totalGrams>5000){Alert.alert('Quantidade excessiva','A receita excede o limite de registro.');return;}
    setSaving(true);
    try{
      const day=await api.addMealEntry(token,{mealType,name:recipe.name,quantityG:totalGrams,...macros,notes:'Receita do catálogo Evolua Core. Quantidades de ingredientes prontos.'});
      onSaved(day);
      Alert.alert('Receita registrada','A receita foi adicionada integralmente ao diário alimentar.');
    }catch(error){Alert.alert('Não foi possível salvar',error instanceof Error?error.message:'Tente novamente.');}
    finally{setSaving(false);}
  };
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>NUTRI IA PRO · REGISTRO INTELIGENTE</Text>
    <Text style={styles.title}>O que você comeu?</Text>
    <Text style={styles.help}>Selecione um alimento ou receita. Calculamos as estimativas automaticamente pela quantidade consumida.</Text>
    <View style={styles.tabs}>
      {([['alimento','Alimentos'],['receita','Receitas práticas']] as const).map(([key,label])=>
        <TouchableOpacity key={key} onPress={()=>setMode(key)} style={[styles.tab,mode===key&&styles.tabActive]}>
          <Text style={[styles.tabText,mode===key&&styles.tabTextActive]}>{label}</Text>
        </TouchableOpacity>
      )}
    </View>
    {mode==='alimento'?<>
      <TextInput style={styles.input} placeholder="Buscar: cuscuz, inhame, frango..." value={query} onChangeText={setQuery} accessibilityLabel="Pesquisar alimento" />
      <ScrollView nestedScrollEnabled style={styles.results} keyboardShouldPersistTaps="handled">
        {results.map(food=><TouchableOpacity key={food.id} onPress={()=>{setSelected(food);setGrams(String(food.portionG));setShowAlternatives(false);}}
          style={[styles.result,selected?.id===food.id&&styles.resultActive]}>
          <View style={{flex:1}}>
            <Text style={styles.resultTitle}>{food.name}</Text>
            <Text style={styles.resultSubtitle}>{food.group} · {food.kcal} kcal/100 g</Text>
          </View>
          {selected?.id===food.id?<Text style={styles.tick}>✓</Text>:null}
        </TouchableOpacity>)}
        {!results.length?<Text style={styles.help}>Nenhum alimento encontrado. Use o registro manual abaixo para consultar o rótulo.</Text>:null}
      </ScrollView>
      {selected?<View style={styles.selectedCard}>
        <Text style={styles.selectedTitle}>{selected.name}</Text>
        <Text style={styles.resultSubtitle}>Quantidade consumida, em gramas (alimento preparado)</Text>
        <TextInput style={styles.gramInput} value={grams} onChangeText={setGrams} keyboardType="decimal-pad" placeholder="Ex.: 160" accessibilityLabel="Quantidade em gramas" />
        {preview?<View style={styles.macros}>
          <View style={styles.macro}><Text style={styles.macroValue}>{Math.round(preview.caloriesKcal)}</Text><Text style={styles.macroLabel}>kcal</Text></View>
          <View style={styles.macro}><Text style={styles.macroValue}>{fmt(preview.proteinG)}</Text><Text style={styles.macroLabel}>proteína</Text></View>
          <View style={styles.macro}><Text style={styles.macroValue}>{fmt(preview.carbsG)}</Text><Text style={styles.macroLabel}>carbo.</Text></View>
          <View style={styles.macro}><Text style={styles.macroValue}>{fmt(preview.fatG)}</Text><Text style={styles.macroLabel}>gorduras</Text></View>
        </View>:<Text style={styles.warn}>Informe uma quantidade válida entre 1 e 5.000 g.</Text>}
        {blocked?<Text style={styles.warn}>Alimento bloqueado por restrição cadastrada. Confira também ingredientes e rótulos.</Text>:null}
        <TouchableOpacity style={[styles.button,(saving||blocked||!preview)&&styles.buttonDisabled]} disabled={saving||blocked||!preview} onPress={()=>void addFood()}>
          {saving?<ActivityIndicator color={theme.colors.navy}/>:<Text style={styles.buttonText}>+ Adicionar ao diário</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.swapButton} onPress={()=>setShowAlternatives(v=>!v)}>
          <Text style={styles.swapText}>{showAlternatives?'Ocultar substituições':'Ver substituições equivalentes ≈'}</Text>
        </TouchableOpacity>
        {showAlternatives?<View style={styles.swaps}>
          <Text style={styles.note}>Equivalência por carboidratos (ou proteína quando for carne/ovo), não por calorias. São estimativas.</Text>
          {alternatives.map(item=><TouchableOpacity key={item.food.id} onPress={()=>{setSelected(item.food);setGrams(String(item.grams));setShowAlternatives(false);}} style={styles.swap}>
            <Text style={styles.swapName}>{item.food.name}</Text><Text style={styles.swapQty}>{item.grams} g</Text>
          </TouchableOpacity>)}
          {alternatives.length===0?<Text style={styles.note}>Não há substituição segura encontrada neste grupo.</Text>:null}
        </View>:null}
      </View>:null}
    </>:<View style={{gap:10}}>
      {quickRecipes.map(recipe=>{
        const macros=recipeNutrition(recipe);
        const unavailable=recipe.ingredients.some(ingredient=>{const food=foodCatalog.find(item=>item.id===ingredient.foodId);return food?incompatibleFood(food,restrictions):true;});
        return <View key={recipe.id} style={styles.recipe}>
          <Text style={styles.resultSubtitle}>{recipe.meal.toUpperCase()} · {recipe.prepMinutes} MIN</Text>
          <Text style={styles.recipeTitle}>{recipe.name}</Text>
          <Text style={styles.resultSubtitle}>{Math.round(macros.caloriesKcal)} kcal · {Math.round(macros.proteinG)} g proteína</Text>
          {showSteps===recipe.id?<View style={{marginTop:8,gap:4}}>
            {recipe.steps.map((step,index)=><Text key={index} style={styles.step}>{index+1}. {step}</Text>)}
          </View>:null}
          {unavailable?<Text style={styles.warn}>Contém ingrediente em suas restrições.</Text>:null}
          <View style={styles.recipeActions}>
            <TouchableOpacity onPress={()=>setShowSteps(showSteps===recipe.id?null:recipe.id)} style={styles.secondaryButton}><Text style={styles.secondaryText}>{showSteps===recipe.id?'Fechar preparo':'Como preparar'}</Text></TouchableOpacity>
            <TouchableOpacity disabled={saving||unavailable} onPress={()=>void addRecipe(recipe)} style={[styles.smallButton,(saving||unavailable)&&styles.buttonDisabled]}><Text style={styles.buttonText}>+ Registrar</Text></TouchableOpacity>
          </View>
        </View>;
      })}
    </View>}
    <Text style={styles.footer}>Valores nutricionais aproximados por 100 g. Rótulos, receitas, óleo utilizado e modo de preparo alteram os resultados. O catálogo não substitui orientação profissional.</Text>
  </View>;
}
const styles=StyleSheet.create({
  card:{backgroundColor:theme.colors.white,borderRadius:24,padding:16,borderColor:theme.colors.border,borderWidth:1,marginVertical:12},
  eyebrow:{color:theme.colors.navy,fontSize:10,fontWeight:'900',letterSpacing:1.1},
  title:{color:theme.colors.text,fontSize:21,fontWeight:'900',marginTop:6},
  help:{color:theme.colors.textMuted,fontSize:12,lineHeight:18,marginTop:7,marginBottom:10},
  tabs:{flexDirection:'row',gap:8,marginVertical:10},
  tab:{flex:1,borderRadius:12,paddingVertical:12,alignItems:'center',backgroundColor:'#EEF2F7'},
  tabActive:{backgroundColor:theme.colors.navy},
  tabText:{color:theme.colors.textMuted,fontWeight:'700',fontSize:12},
  tabTextActive:{color:theme.colors.white},
  input:{backgroundColor:'#F7F9FC',borderRadius:12,borderColor:theme.colors.border,borderWidth:1,padding:13,fontSize:14,color:theme.colors.text},
  results:{maxHeight:204,marginTop:8},
  result:{flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderColor:theme.colors.border,padding:10},
  resultActive:{backgroundColor:'#EFF6E6',borderRadius:10},
  resultTitle:{color:theme.colors.text,fontSize:13,fontWeight:'700'},
  resultSubtitle:{color:theme.colors.textMuted,fontSize:11,marginTop:3},
  tick:{color:theme.colors.navy,fontWeight:'900',fontSize:18},
  selectedCard:{backgroundColor:'#F7F9FC',borderRadius:16,padding:12,marginTop:12},
  selectedTitle:{fontSize:15,fontWeight:'800',color:theme.colors.navy,marginBottom:4},
  gramInput:{borderColor:theme.colors.border,borderWidth:1,borderRadius:12,backgroundColor:theme.colors.white,padding:12,fontSize:16,fontWeight:'700',color:theme.colors.navy,marginTop:8},
  macros:{flexDirection:'row',justifyContent:'space-between',marginTop:12,marginBottom:12},
  macro:{flex:1,alignItems:'center'},
  macroValue:{fontSize:17,fontWeight:'900',color:theme.colors.navy},
  macroLabel:{fontSize:10,color:theme.colors.textMuted},
  warn:{color:theme.colors.danger,fontSize:11,marginVertical:9,fontWeight:'700'},
  button:{backgroundColor:theme.colors.lime,borderRadius:13,paddingVertical:13,alignItems:'center'},
  buttonDisabled:{opacity:0.45},
  buttonText:{color:theme.colors.navyDark,fontWeight:'900',fontSize:12},
  swapButton:{paddingVertical:13,alignItems:'center'},
  swapText:{fontSize:12,color:theme.colors.navy,fontWeight:'800'},
  swaps:{borderTopWidth:1,borderColor:theme.colors.border,paddingTop:8},
  swap:{paddingVertical:8,flexDirection:'row',justifyContent:'space-between',borderBottomWidth:1,borderColor:theme.colors.border},
  swapName:{fontSize:11,color:theme.colors.text,flex:1},
  swapQty:{fontWeight:'900',color:theme.colors.navy,fontSize:12},
  note:{fontSize:10,color:theme.colors.textMuted,lineHeight:16,marginVertical:6},
  recipe:{borderWidth:1,borderColor:theme.colors.border,borderRadius:15,padding:13},
  recipeTitle:{fontSize:15,color:theme.colors.navy,fontWeight:'800',marginTop:3},
  step:{fontSize:11,color:theme.colors.text,lineHeight:18},
  recipeActions:{flexDirection:'row',gap:8,marginTop:12},
  secondaryButton:{flex:1,borderWidth:1,borderColor:theme.colors.border,padding:10,borderRadius:10,alignItems:'center'},
  secondaryText:{fontWeight:'800',fontSize:11,color:theme.colors.navy},
  smallButton:{flex:1,backgroundColor:theme.colors.lime,padding:10,borderRadius:10,alignItems:'center'},
  footer:{fontSize:10,color:theme.colors.textMuted,lineHeight:15,marginTop:12}
});