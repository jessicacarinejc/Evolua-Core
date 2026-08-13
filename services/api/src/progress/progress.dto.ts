import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SaveBodyMetricDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(25)
  @Max(400)
  weightKg?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(2)
  @Max(80)
  bodyFatPercent?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(30)
  @Max(300)
  waistCm?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(30)
  @Max(300)
  hipCm?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(30)
  @Max(300)
  chestCm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
