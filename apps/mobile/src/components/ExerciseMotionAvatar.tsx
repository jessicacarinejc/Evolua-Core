import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ExercisePoseFamily } from '../workouts/exercise-guidance';
import { theme } from '../theme';

type MotionPose = {
  bodyRotate?: [number, number];
  bodyY?: [number, number];
  bodyX?: [number, number];
  leftArm?: [number, number];
  rightArm?: [number, number];
  leftForearm?: [number, number];
  rightForearm?: [number, number];
  leftThigh?: [number, number];
  rightThigh?: [number, number];
  leftShin?: [number, number];
  rightShin?: [number, number];
};

const poses: Record<ExercisePoseFamily, MotionPose> = {
  squat: { bodyY: [0, 22], leftThigh: [8, 38], rightThigh: [-8, -38], leftShin: [-4, -28], rightShin: [4, 28] },
  press: { leftArm: [38, -70], rightArm: [-38, 70], leftForearm: [18, -8], rightForearm: [-18, 8] },
  pull: { leftArm: [78, 28], rightArm: [-78, -28], leftForearm: [0, -72], rightForearm: [0, 72] },
  hinge: { bodyRotate: [0, 28], bodyY: [0, 7], leftThigh: [3, 12], rightThigh: [-3, -12] },
  curl: { leftForearm: [8, -92], rightForearm: [-8, 92] },
  pushdown: { leftForearm: [-88, 0], rightForearm: [88, 0], leftArm: [16, 8], rightArm: [-16, -8] },
  'core-supine': { bodyRotate: [90, 90], leftArm: [-38, -70], rightArm: [38, 70], leftThigh: [52, 8], rightThigh: [-8, -52], leftShin: [-58, -18], rightShin: [18, 58] },
  quadruped: { bodyRotate: [90, 90], leftArm: [-12, -68], rightArm: [22, 22], leftThigh: [28, 28], rightThigh: [-12, -68], leftShin: [-56, -56], rightShin: [18, 4] },
  calf: { bodyY: [5, -8], leftThigh: [2, 2], rightThigh: [-2, -2], leftShin: [0, -5], rightShin: [0, 5] },
  bike: { bodyRotate: [12, 12], leftThigh: [42, -28], rightThigh: [-28, 42], leftShin: [-62, 24], rightShin: [24, -62] },
  pushup: { bodyRotate: [90, 90], bodyY: [-2, 12], leftArm: [18, 44], rightArm: [-18, -44], leftForearm: [0, -40], rightForearm: [0, 40] },
  'jumping-jack': { leftArm: [18, -132], rightArm: [-18, 132], leftThigh: [5, 34], rightThigh: [-5, -34] },
  dip: { bodyY: [-2, 18], leftArm: [14, 28], rightArm: [-14, -28], leftForearm: [-4, -62], rightForearm: [4, 62] },
  'high-knees': { bodyY: [1, -3], leftThigh: [4, 62], rightThigh: [-62, -4], leftShin: [0, -72], rightShin: [72, 0], leftArm: [24, -24], rightArm: [-24, 24] },
  'tai-chi': { bodyX: [-4, 4], leftArm: [42, -18], rightArm: [-18, -58], leftForearm: [-28, -62], rightForearm: [62, 28], leftThigh: [8, 18], rightThigh: [-18, -8] },
  walk: { bodyX: [-3, 3], leftArm: [24, -24], rightArm: [-24, 24], leftThigh: [-24, 24], rightThigh: [-24, 24], leftShin: [10, -16], rightShin: [16, -10] },
  lunge: { bodyY: [0, 14], leftThigh: [-10, 52], rightThigh: [-28, -45], leftShin: [8, -55], rightShin: [18, 46] },
};

function range(value: Animated.Value, pair: [number, number] | undefined, suffix = 'deg') {
  const [from, to] = pair ?? [0, 0];
  return value.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [`${from}${suffix}`, `${to}${suffix}`, `${from}${suffix}`],
  });
}

function numericRange(value: Animated.Value, pair: [number, number] | undefined) {
  const [from, to] = pair ?? [0, 0];
  return value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [from, to, from] });
}

function Limb({ progress, rotation, style }: { progress: Animated.Value; rotation?: [number, number]; style: object }) {
  return <Animated.View style={[styles.limb, style, { transform: [{ rotate: range(progress, rotation) }] }]} />;
}

export function ExerciseMotionAvatar({
  pose,
  slow = false,
  playing = true,
}: {
  pose: ExercisePoseFamily;
  slow?: boolean;
  playing?: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const config = useMemo(() => poses[pose] ?? poses.walk, [pose]);

  useEffect(() => {
    progress.stopAnimation();
    if (!playing) return;
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: slow ? 5600 : 3200,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, progress, pose, slow]);

  return (
    <View style={styles.frame} accessibilityLabel="Demonstração animada contínua do movimento">
      <View style={styles.floor} />
      <Animated.View
        style={[
          styles.person,
          {
            transform: [
              { translateX: numericRange(progress, config.bodyX) },
              { translateY: numericRange(progress, config.bodyY) },
              { rotate: range(progress, config.bodyRotate) },
            ],
          },
        ]}
      >
        <View style={styles.head} />
        <View style={styles.neck} />
        <View style={styles.torso} />

        <View style={styles.leftShoulder}>
          <Limb progress={progress} rotation={config.leftArm} style={styles.upperArm} />
          <View style={styles.leftElbowAnchor}>
            <Limb progress={progress} rotation={config.leftForearm} style={styles.forearm} />
          </View>
        </View>
        <View style={styles.rightShoulder}>
          <Limb progress={progress} rotation={config.rightArm} style={styles.upperArm} />
          <View style={styles.rightElbowAnchor}>
            <Limb progress={progress} rotation={config.rightForearm} style={styles.forearm} />
          </View>
        </View>

        <View style={styles.leftHip}>
          <Limb progress={progress} rotation={config.leftThigh} style={styles.thigh} />
          <View style={styles.leftKneeAnchor}>
            <Limb progress={progress} rotation={config.leftShin} style={styles.shin} />
          </View>
        </View>
        <View style={styles.rightHip}>
          <Limb progress={progress} rotation={config.rightThigh} style={styles.thigh} />
          <View style={styles.rightKneeAnchor}>
            <Limb progress={progress} rotation={config.rightShin} style={styles.shin} />
          </View>
        </View>
      </Animated.View>
      <View style={styles.badge}><View style={styles.badgeDot} /></View>
    </View>
  );
}

const BODY = '#F3F7FB';
const JOINT = '#9DCC46';

const styles = StyleSheet.create({
  frame: { width: 128, height: 170, borderRadius: 22, backgroundColor: '#071B34', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  floor: { position: 'absolute', bottom: 19, width: 96, height: 2, borderRadius: 2, backgroundColor: '#274866' },
  person: { width: 84, height: 142, position: 'relative', marginTop: 5 },
  head: { position: 'absolute', top: 2, left: 31, width: 22, height: 22, borderRadius: 11, backgroundColor: BODY, borderWidth: 2, borderColor: JOINT },
  neck: { position: 'absolute', top: 23, left: 39, width: 6, height: 9, borderRadius: 3, backgroundColor: BODY },
  torso: { position: 'absolute', top: 29, left: 27, width: 30, height: 50, borderRadius: 12, backgroundColor: BODY, borderWidth: 2, borderColor: '#D5E0EA' },
  limb: { position: 'absolute', backgroundColor: BODY, borderRadius: 7, borderWidth: 1, borderColor: '#CFDAE5' },
  leftShoulder: { position: 'absolute', top: 32, left: 25, width: 12, height: 12, borderRadius: 6, backgroundColor: JOINT },
  rightShoulder: { position: 'absolute', top: 32, right: 25, width: 12, height: 12, borderRadius: 6, backgroundColor: JOINT },
  upperArm: { top: 5, left: 3, width: 7, height: 38 },
  forearm: { top: 0, left: 0, width: 7, height: 34 },
  leftElbowAnchor: { position: 'absolute', top: 37, left: 3, width: 7, height: 7, borderRadius: 4, backgroundColor: JOINT },
  rightElbowAnchor: { position: 'absolute', top: 37, right: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: JOINT },
  leftHip: { position: 'absolute', top: 73, left: 29, width: 10, height: 10, borderRadius: 5, backgroundColor: JOINT },
  rightHip: { position: 'absolute', top: 73, right: 29, width: 10, height: 10, borderRadius: 5, backgroundColor: JOINT },
  thigh: { top: 7, left: 2, width: 7, height: 42 },
  shin: { top: 0, left: 0, width: 7, height: 40 },
  leftKneeAnchor: { position: 'absolute', top: 45, left: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: JOINT },
  rightKneeAnchor: { position: 'absolute', top: 45, right: 1, width: 7, height: 7, borderRadius: 4, backgroundColor: JOINT },
  badge: { position: 'absolute', right: 9, top: 9, width: 12, height: 12, borderRadius: 6, backgroundColor: '#12365A', alignItems: 'center', justifyContent: 'center' },
  badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.lime },
});
