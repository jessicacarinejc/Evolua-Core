import { generatedLocalExerciseClips } from './exercise-media.generated';

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
 * O registro efetivo de clipes locais é gerado no GitHub Actions a partir do
 * manifesto auditado. Isso permite empacotar MP4s no APK sem depender da
 * internet durante o uso e sem versionar binários grandes no repositório.
 *
 * Não usamos sequências de prints como vídeo final. Enquanto um clipe real
 * não existir, a tela mantém a demonstração animada contínua como fallback.
 */
const localExerciseClips: Record<string, number> = generatedLocalExerciseClips;

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
