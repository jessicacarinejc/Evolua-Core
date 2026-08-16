export type ExerciseMedia =
  | { kind: 'local-clip'; source: number }
  | { kind: 'remote-video'; source: string }
  | { kind: 'remote-image'; source: string }
  | { kind: 'guided-fallback' };

function keyOf(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Registro intencionalmente separado da UI para receber clipes reais,
 * licenciados e empacotados no APK. Ao adicionar um arquivo em assets,
 * associe aqui com require('../../assets/exercises/<arquivo>.mp4').
 *
 * Não usamos sequências de prints como vídeo final. Enquanto um clipe real
 * não existir, a tela mantém o guia textual/animado offline como fallback.
 */
const localExerciseClips: Record<string, number> = {
  // 'agachamento-livre': require('../../assets/exercises/agachamento-livre.mp4'),
};

export function resolveExerciseMedia(name: string, videoUrl?: string | null): ExerciseMedia {
  const local = localExerciseClips[keyOf(name)];
  if (local != null) return { kind: 'local-clip', source: local };

  if (!videoUrl || videoUrl.startsWith('evolua-guide://')) {
    return { kind: 'guided-fallback' };
  }

  if (/\.gif(?:\?|$)/i.test(videoUrl)) {
    return { kind: 'remote-image', source: videoUrl };
  }

  return { kind: 'remote-video', source: videoUrl };
}
