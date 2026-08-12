import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type ExerciseRow = {
  id: string;
  slug: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  movement_pattern: string;
  equipment: string[];
  instructions: string | null;
  common_errors: string | null;
  safety_notes: string | null;
  video_url: string | null;
};

@Injectable()
export class ExercisesService {
  constructor(private readonly db: DatabaseService) {}

  async list() {
    const result = await this.db.query<ExerciseRow>(
      `SELECT
         e.id,
         e.slug,
         e.name,
         e.primary_muscle,
         e.secondary_muscles,
         e.movement_pattern,
         e.equipment,
         e.instructions,
         e.common_errors,
         e.safety_notes,
         COALESCE(v.url, e.video_url) AS video_url
       FROM exercises e
       LEFT JOIN LATERAL (
         SELECT ev.url
         FROM exercise_videos ev
         WHERE ev.exercise_id = e.id
         ORDER BY ev.is_primary DESC, ev.created_at ASC
         LIMIT 1
       ) v ON true
       WHERE e.active = true
       ORDER BY e.primary_muscle, e.name`,
    );

    return result.rows.map((exercise) => ({
      id: exercise.id,
      slug: exercise.slug,
      name: exercise.name,
      primaryMuscle: exercise.primary_muscle,
      secondaryMuscles: exercise.secondary_muscles,
      movementPattern: exercise.movement_pattern,
      equipment: exercise.equipment,
      instructions: exercise.instructions,
      commonErrors: exercise.common_errors,
      safetyNotes: exercise.safety_notes,
      videoUrl: exercise.video_url,
    }));
  }
}
