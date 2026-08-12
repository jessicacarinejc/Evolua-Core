import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class DailyCheckinDto {
  @IsInt()
  @Min(1)
  @Max(5)
  sleepQuality!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  energyLevel!: number;

  @IsInt()
  @Min(0)
  @Max(10)
  muscleSoreness!: number;

  @IsInt()
  @Min(0)
  @Max(10)
  jointPain!: number;

  @IsInt()
  @Min(15)
  @Max(180)
  availableMinutes!: number;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  painAreas!: string[];

  @IsBoolean()
  newSymptoms!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
