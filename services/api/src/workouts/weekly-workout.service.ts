import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class WeeklyWorkoutService {
  constructor(private readonly db: DatabaseService) {}
}
