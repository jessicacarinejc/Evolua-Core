import { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { WorkoutExercise } from '../api/client';
import { theme } from '../theme';
import { guidanceUrl } from '../workouts/exercise-guidance';
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer';

type Props = {
  exercises: WorkoutExercise[];
};

function targetLabel(exercise: WorkoutExercise) {
  if (exercise.durationSeconds) return `${exercise.durationSeconds}s`;
  if (exercise.repsMin && exercise.repsMax) return `${exercise.repsMin}-${exercise.repsMax} rep`;
  return 'por tempo';
}

export function WorkoutGuidedHero({ exercises }: Props) {
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = exercises[selectedIndex];

  const totalSets = useMemo(
    () => exercises.reduce((sum, exercise) => sum + Number(exercise.sets ?? 0), 0),
    [exercises],
  );

  const open = () => {
    setSelectedIndex(0);
    setVisible(true);
  };

  const go = (index: number) => {
    if (index < 0 || index >= exercises.length) return;
    setSelectedIndex(index);
  };

  return (
    <>
      <TouchableOpacity onPress={open} activeOpacity={0.88} style={styles.hero} accessibilityRole="button">
        <View style={styles.heroIcon}><Text style={styles.heroIconText}>▶</Text></View>
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>PRÉVIA DO TREINO</Text>
          <Text style={styles.heroTitle}>Visualizar antes de começar</Text>
          <Text style={styles.heroBody}>Veja a sequência completa, abra a demonstração de cada exercício e confira séries, repetições e descanso.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>PRÉVIA COMPLETA</Text>
              <Text style={styles.modalTitle}>Seu treino antes de iniciar</Text>
            </View>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}><Text style={styles.summaryValue}>{exercises.length}</Text><Text style={styles.summaryLabel}>exercícios</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryValue}>{totalSets}</Text><Text style={styles.summaryLabel}>séries/blocos</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryValue}>{selectedIndex + 1}/{exercises.length}</Text><Text style={styles.summaryLabel}>visualizando</Text></View>
            </View>

            {selected ? (
              <View style={styles.focusCard}>
                <Text style={styles.stepLabel}>EXERCÍCIO {selectedIndex + 1} DE {exercises.length}</Text>
                <Text style={styles.exerciseTitle}>{selected.name}</Text>
                <Text style={styles.exerciseMuscle}>{selected.primaryMuscle}</Text>

                <View style={styles.prescriptionRow}>
                  <View><Text style={styles.prescriptionValue}>{selected.sets}</Text><Text style={styles.prescriptionLabel}>séries</Text></View>
                  <View><Text style={styles.prescriptionValue}>{targetLabel(selected)}</Text><Text style={styles.prescriptionLabel}>alvo</Text></View>
                  <View><Text style={styles.prescriptionValue}>{selected.restSeconds}s</Text><Text style={styles.prescriptionLabel}>descanso</Text></View>
                  <View><Text style={styles.prescriptionValue}>RIR {selected.targetRir}</Text><Text style={styles.prescriptionLabel}>esforço</Text></View>
                </View>

                <ExerciseVideoPlayer
                  title={selected.name}
                  videoUrl={selected.videoUrl ?? guidanceUrl(selected.name)}
                  license={selected.videoLicense}
                  attribution={selected.videoAttribution}
                />

                {selected.instructions ? <Text style={styles.instructions}>{selected.instructions}</Text> : null}

                <View style={styles.navigationRow}>
                  <TouchableOpacity disabled={selectedIndex === 0} onPress={() => go(selectedIndex - 1)} style={[styles.navButton, selectedIndex === 0 && styles.navDisabled]}>
                    <Text style={styles.navText}>‹ Anterior</Text>
                  </TouchableOpacity>
                  <TouchableOpacity disabled={selectedIndex === exercises.length - 1} onPress={() => go(selectedIndex + 1)} style={[styles.navButton, selectedIndex === exercises.length - 1 && styles.navDisabled]}>
                    <Text style={styles.navText}>Próximo ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <Text style={styles.sequenceTitle}>Sequência do treino</Text>
            {exercises.map((exercise, index) => (
              <TouchableOpacity key={exercise.id} onPress={() => go(index)} style={[styles.sequenceRow, index === selectedIndex && styles.sequenceRowActive]}>
                <View style={[styles.sequenceIndex, index === selectedIndex && styles.sequenceIndexActive]}>
                  <Text style={[styles.sequenceIndexText, index === selectedIndex && styles.sequenceIndexTextActive]}>{index + 1}</Text>
                </View>
                <View style={styles.sequenceText}>
                  <Text style={styles.sequenceName}>{exercise.name}</Text>
                  <Text style={styles.sequenceMeta}>{exercise.sets} séries · {targetLabel(exercise)} · {exercise.restSeconds}s descanso</Text>
                </View>
                <Text style={styles.sequenceArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', backgroundColor: theme.colors.navy, borderRadius: 22, padding: 16, marginBottom: 16, alignItems: 'center' },
  heroIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  heroIconText: { color: theme.colors.navyDark, fontSize: 18, fontWeight: '900', marginLeft: 2 },
  heroText: { flex: 1 },
  eyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '900', marginTop: 3 },
  heroBody: { color: '#C8D4E3', fontSize: 10, lineHeight: 15, marginTop: 4 },
  chevron: { color: theme.colors.lime, fontSize: 30, fontWeight: '300', marginLeft: 8 },
  modalRoot: { flex: 1, backgroundColor: '#F4F6F9' },
  modalHeader: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: theme.colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalEyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  modalTitle: { color: theme.colors.white, fontSize: 20, fontWeight: '900', marginTop: 3 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#23436D', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: theme.colors.white, fontSize: 28, lineHeight: 30, fontWeight: '500' },
  modalContent: { padding: 18, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryItem: { flex: 1, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 9 },
  summaryValue: { color: theme.colors.navy, fontSize: 15, fontWeight: '900' },
  summaryLabel: { color: theme.colors.textMuted, fontSize: 8, marginTop: 2 },
  focusCard: { backgroundColor: theme.colors.white, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  stepLabel: { color: theme.colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  exerciseTitle: { color: theme.colors.navy, fontSize: 24, lineHeight: 29, fontWeight: '900', marginTop: 5 },
  exerciseMuscle: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3, textTransform: 'capitalize' },
  prescriptionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 14 },
  prescriptionValue: { color: theme.colors.text, fontSize: 12, fontWeight: '900' },
  prescriptionLabel: { color: theme.colors.textMuted, fontSize: 8, marginTop: 2 },
  instructions: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 12 },
  navigationRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  navButton: { flex: 1, borderRadius: 13, backgroundColor: theme.colors.navy, paddingVertical: 12, alignItems: 'center' },
  navDisabled: { opacity: 0.3 },
  navText: { color: theme.colors.white, fontSize: 12, fontWeight: '900' },
  sequenceTitle: { color: theme.colors.navy, fontSize: 18, fontWeight: '900', marginTop: 22, marginBottom: 8 },
  sequenceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, padding: 12, marginTop: 8 },
  sequenceRowActive: { borderColor: theme.colors.lime, backgroundColor: '#F3F8E9' },
  sequenceIndex: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E7EDF4', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sequenceIndexActive: { backgroundColor: theme.colors.lime },
  sequenceIndexText: { color: theme.colors.navy, fontWeight: '900', fontSize: 11 },
  sequenceIndexTextActive: { color: theme.colors.navyDark },
  sequenceText: { flex: 1 },
  sequenceName: { color: theme.colors.navy, fontSize: 12, fontWeight: '900' },
  sequenceMeta: { color: theme.colors.textMuted, fontSize: 8, marginTop: 3 },
  sequenceArrow: { color: theme.colors.navy, fontSize: 22, marginLeft: 5 },
});