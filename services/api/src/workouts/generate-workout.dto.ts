import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateWorkoutDto {
  @IsIn(['emagrecimento', 'hipertrofia', 'forca', 'condicionamento', 'manutencao'])
  goal!: 'emagrecimento' | 'hipertrofia' | 'forca' | 'condicionamento' | 'manutencao';

  @IsInt()
  @Min(15)
  @Max(180)
  availableMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  recoveryScore!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  jointPain?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  availableEquipment?: string[];
}
