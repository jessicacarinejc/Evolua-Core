import { generatedLocalExerciseMedia } from './exercise-media.generated';

export type LocalExerciseMediaQuality = 'realistic-human-demo' | 'animated-fallback';

export type ExerciseMedia =
  | { kind: 'local-clip'; source: number; finalQuality: LocalExerciseMediaQuality; license?: string; attribution?: string }
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
 * O registro efetivo de mídia local é gerado no GitHub Actions a partir do
 * manifesto e dos overrides auditados. O player recebe também a qualidade da
 * mídia para não confundir animação procedural com demonstração humana realista.
 */
export function resolveExerciseMedia(name: string, videoUrl?: string | null): ExerciseMedia {
  const local = generatedLocalExerciseMedia[keyOf(name)];
  if (local != null) {
    return {
      kind: 'local-clip',
      source: local.source,
      finalQuality: local.finalQuality,
      license: local.license,
      attribution: local.attribution,
    };
  }

  if (!videoUrl || videoUrl.startsWith('evolua-guide://')) {
    return { kind: 'guided-fallback' };
  }

  if (/\.gif(?:\?|$)/i.test(videoUrl)) {
    return { kind: 'remote-image', source: videoUrl };
  }

  return { kind: 'remote-video', source: videoUrl };
}
