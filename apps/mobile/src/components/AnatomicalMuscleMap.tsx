import { StyleSheet, View } from 'react-native';
import type { MuscleImpact } from '../workouts/workout-impact';

const neutral = '#D9E0E8';
const outline = '#AAB8C6';

function fillFor(label: string, impact: MuscleImpact[]) {
  const item = impact.find((muscle) => muscle.label === label);
  if (!item) return neutral;
  if (item.percent >= 72) return '#FF7A59';
  if (item.percent >= 38) return '#FFB08C';
  return '#F7D0BE';
}

function Piece({ style, color = neutral }: { style: object | object[]; color?: string }) {
  return <View style={[styles.piece, style, { backgroundColor: color }]} />;
}

function FrontBody({ impact }: { impact: MuscleImpact[] }) {
  return (
    <View style={styles.body}>
      <Piece style={styles.head} />
      <Piece style={styles.neck} />
      <Piece style={[styles.shoulder, styles.shoulderLeft]} color={fillFor('Ombros', impact)} />
      <Piece style={[styles.shoulder, styles.shoulderRight]} color={fillFor('Ombros', impact)} />
      <Piece style={[styles.chest, styles.chestLeft]} color={fillFor('Peitoral', impact)} />
      <Piece style={[styles.chest, styles.chestRight]} color={fillFor('Peitoral', impact)} />
      <Piece style={[styles.upperArm, styles.upperArmLeft]} color={fillFor('Bíceps', impact)} />
      <Piece style={[styles.upperArm, styles.upperArmRight]} color={fillFor('Bíceps', impact)} />
      <Piece style={[styles.forearm, styles.forearmLeft]} color={fillFor('Antebraços', impact)} />
      <Piece style={[styles.forearm, styles.forearmRight]} color={fillFor('Antebraços', impact)} />
      <Piece style={styles.abdomen} color={fillFor('Core', impact)} />
      <Piece style={[styles.abSegment, styles.ab1]} color={fillFor('Core', impact)} />
      <Piece style={[styles.abSegment, styles.ab2]} color={fillFor('Core', impact)} />
      <Piece style={[styles.abSegment, styles.ab3]} color={fillFor('Core', impact)} />
      <Piece style={styles.pelvis} />
      <Piece style={[styles.thigh, styles.thighLeft]} color={fillFor('Quadríceps', impact)} />
      <Piece style={[styles.thigh, styles.thighRight]} color={fillFor('Quadríceps', impact)} />
      <Piece style={[styles.calf, styles.calfLeft]} color={fillFor('Panturrilhas', impact)} />
      <Piece style={[styles.calf, styles.calfRight]} color={fillFor('Panturrilhas', impact)} />
    </View>
  );
}

function BackBody({ impact }: { impact: MuscleImpact[] }) {
  return (
    <View style={styles.body}>
      <Piece style={styles.head} />
      <Piece style={styles.neck} />
      <Piece style={[styles.shoulder, styles.shoulderLeft]} color={fillFor('Ombros', impact)} />
      <Piece style={[styles.shoulder, styles.shoulderRight]} color={fillFor('Ombros', impact)} />
      <Piece style={[styles.backUpper, styles.backUpperLeft]} color={fillFor('Costas', impact)} />
      <Piece style={[styles.backUpper, styles.backUpperRight]} color={fillFor('Costas', impact)} />
      <Piece style={[styles.upperArm, styles.upperArmLeft]} color={fillFor('Tríceps', impact)} />
      <Piece style={[styles.upperArm, styles.upperArmRight]} color={fillFor('Tríceps', impact)} />
      <Piece style={[styles.forearm, styles.forearmLeft]} color={fillFor('Antebraços', impact)} />
      <Piece style={[styles.forearm, styles.forearmRight]} color={fillFor('Antebraços', impact)} />
      <Piece style={styles.lowerBack} color={fillFor('Core', impact)} />
      <Piece style={[styles.glute, styles.gluteLeft]} color={fillFor('Glúteos', impact)} />
      <Piece style={[styles.glute, styles.gluteRight]} color={fillFor('Glúteos', impact)} />
      <Piece style={[styles.thigh, styles.thighLeft]} color={fillFor('Posteriores', impact)} />
      <Piece style={[styles.thigh, styles.thighRight]} color={fillFor('Posteriores', impact)} />
      <Piece style={[styles.calf, styles.calfLeft]} color={fillFor('Panturrilhas', impact)} />
      <Piece style={[styles.calf, styles.calfRight]} color={fillFor('Panturrilhas', impact)} />
    </View>
  );
}

export function AnatomicalMuscleMap({ impact }: { impact: MuscleImpact[] }) {
  return (
    <View style={styles.wrap}>
      <FrontBody impact={impact} />
      <BackBody impact={impact} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  body: { width: 74, height: 160, position: 'relative' },
  piece: { position: 'absolute', borderWidth: 0.7, borderColor: outline },
  head: { width: 22, height: 25, borderRadius: 11, left: 26, top: 0 },
  neck: { width: 10, height: 10, borderRadius: 4, left: 32, top: 22 },
  shoulder: { width: 20, height: 12, borderRadius: 8, top: 29 },
  shoulderLeft: { left: 14, transform: [{ rotate: '12deg' }] },
  shoulderRight: { right: 14, transform: [{ rotate: '-12deg' }] },
  chest: { width: 22, height: 24, top: 35, borderRadius: 8 },
  chestLeft: { left: 15 },
  chestRight: { right: 15 },
  upperArm: { width: 11, height: 38, top: 38, borderRadius: 8 },
  upperArmLeft: { left: 6, transform: [{ rotate: '8deg' }] },
  upperArmRight: { right: 6, transform: [{ rotate: '-8deg' }] },
  forearm: { width: 9, height: 37, top: 72, borderRadius: 7 },
  forearmLeft: { left: 1, transform: [{ rotate: '6deg' }] },
  forearmRight: { right: 1, transform: [{ rotate: '-6deg' }] },
  abdomen: { width: 30, height: 39, top: 57, left: 22, borderRadius: 9 },
  abSegment: { width: 7, height: 9, borderRadius: 3, left: 33 },
  ab1: { top: 60 },
  ab2: { top: 71 },
  ab3: { top: 82 },
  pelvis: { width: 31, height: 18, top: 94, left: 22, borderRadius: 10 },
  thigh: { width: 14, height: 43, top: 107, borderRadius: 9 },
  thighLeft: { left: 21, transform: [{ rotate: '2deg' }] },
  thighRight: { right: 21, transform: [{ rotate: '-2deg' }] },
  calf: { width: 11, height: 35, top: 143, borderRadius: 8 },
  calfLeft: { left: 22 },
  calfRight: { right: 22 },
  backUpper: { width: 24, height: 34, top: 34, borderRadius: 9 },
  backUpperLeft: { left: 13, transform: [{ rotate: '5deg' }] },
  backUpperRight: { right: 13, transform: [{ rotate: '-5deg' }] },
  lowerBack: { width: 30, height: 31, top: 65, left: 22, borderRadius: 8 },
  glute: { width: 18, height: 20, top: 92, borderRadius: 10 },
  gluteLeft: { left: 19 },
  gluteRight: { right: 19 },
});