import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const mealTypes = ['cafe','lanche_manha','almoco','lanche_tarde','jantar','ceia','outro'] as const;

export class AddMealEntryDto {
  @IsIn(mealTypes)
  mealType!: typeof mealTypes[number];

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5000)
  quantityG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  caloriesKcal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  proteinG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2000)
  carbsG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  fatG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(300)
  fiberG?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AddHydrationDto {
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(5000)
  amountMl!: number;
}

export class SaveNutritionTargetDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(500)
  @Max(8000)
  caloriesKcal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  proteinG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1200)
  carbsG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  fatG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(150)
  fiberG?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(500)
  @Max(8000)
  waterMl?: number;
}
