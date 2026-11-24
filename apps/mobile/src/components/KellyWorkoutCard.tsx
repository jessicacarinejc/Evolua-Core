import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { theme } from '../theme';
const days = [["Segunda","Glúteos e quadríceps",[["Agachamento livre",3,"15–20"],["Elevação pélvica",4,"10"],["Leg press 45°",3,"10 + 10 curtinhas"],["Cadeira extensora + taça",4,"10"],["Afundo com halteres",3,"10"],["Cadeira abdutora neutra",3,"15"],["Panturrilha",3,"15"]]],["Terça","Costas, peito, ombros e bíceps",[["Puxada frontal",3,"15"],["Remada baixa",3,"12"],["Supino articulado",3,"15"],["Crucifixo com halteres",3,"12"],["Elevação frontal",3,"15"],["Desenvolvimento",3,"10"],["Rosca direta barra + martelo",3,"15"]]],["Quarta","Posterior e glúteos",[["Mesa flexora + stiff",3,"10"],["Agachamento sumô",4,"12"],["Elevação pélvica",3,"12"],["Coice no cabo",3,"15"],["Agachamento búlgaro",3,"12"],["Cadeira abdutora 45°",3,"15 + 10 curtinhas"],["Panturrilha sentada",3,"15"]]],["Quinta","Ombros, tríceps, bíceps e abdômen",[["Elevação lateral",3,"10"],["Crucifixo inverso",4,"12"],["Face pull",3,"10"],["Tríceps francês + corda",3,"12"],["Rosca Scott",3,"12"],["Rosca inversa polia",3,"12"],["Prancha",3,"30 segundos"]]],["Sexta","Corpo todo",[["Agachamento sumô",3,"12"],["Cadeira adutora",3,"10"],["Cadeira flexora",3,"15"],["Supino vertical",4,"12"],["Remada neutra unilateral",3,"15"],["Abdominal supra",4,"12"],["Abdominal infra",4,"10"]]]] as const;
export function KellyWorkoutCard() {
 const [day,setDay]=useState(Math.min(4,Math.max(0,new Date().getDay()-1)));
 const [done,setDone]=useState<Record<string,boolean>>({});
 const current=days[day];
 return <View style={s.card}>
 <Text style={s.title}>Treino Kelly — Ganho de massa magra</Text>
 <Text style={s.copy}>Ficha original de 18/11/2026. Selecione o dia. Marcações temporárias nesta tela.</Text>
 <View style={s.row}>{days.map((d,i)=><TouchableOpacity key={d[0]} onPress={()=>setDay(i)} style={[s.chip,day===i&&s.active]}><Text style={s.label}>{d[0].slice(0,3)}</Text></TouchableOpacity>)}</View>
 <Text style={s.title}>{current[0]} · {current[1]}</Text>
 {current[2].map(([name,sets,reps],i)=><View key={day+'-'+i} style={s.item}>
 <Text style={s.title}>{i+1}. {name}</Text><Text style={s.copy}>{sets} × {reps}</Text>
 <View style={s.row}>{Array.from({length:sets},(_,j)=>{const key=day+'-'+i+'-'+j;return <TouchableOpacity key={key} accessibilityRole="checkbox" accessibilityState={{checked:!!done[key]}} onPress={()=>setDone(old=>({...old,[key]:!old[key]}))} style={[s.chip,done[key]&&s.active]}><Text style={s.label}>{done[key]?'✓ ':''}{j+1}</Text></TouchableOpacity>})}</View>
 <TouchableOpacity onPress={()=>void Linking.openURL('https://www.youtube.com/results?search_query='+encodeURIComponent(name+' execução correta musculação')).catch(()=>{})}><Text style={s.link}>Buscar demonstração em vídeo ↗</Text></TouchableOpacity>
 </View>)}
 <Text style={s.copy}>Vídeos externos são resultados de busca, não revisados. Confirme variações, intervalos e exercícios combinados com sua professora. Interrompa se houver dor aguda ou tontura.</Text>
 </View>;
}
const s=StyleSheet.create({card:{backgroundColor:theme.colors.white,borderRadius:20,padding:16,marginBottom:18,borderWidth:1,borderColor:theme.colors.border},title:{color:theme.colors.navy,fontSize:17,fontWeight:'800'},copy:{color:theme.colors.textMuted,fontSize:13,lineHeight:20,marginVertical:6},row:{flexDirection:'row',flexWrap:'wrap',gap:6,marginVertical:10},chip:{padding:10,borderRadius:12,backgroundColor:'#EDF1F5'},active:{backgroundColor:theme.colors.lime},label:{color:theme.colors.navy,fontWeight:'800'},item:{borderTopWidth:1,borderColor:theme.colors.border,paddingVertical:12},link:{color:'#35691C',fontWeight:'700',paddingVertical:8}});
