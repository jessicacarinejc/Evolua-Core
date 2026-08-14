import { IsEmail, IsEnum, IsString, IsUUID, Length } from 'class-validator';

export class CreateProfessionalReviewDto {
  @IsUUID()
  clientUserId!: string;

  @IsEnum(['geral', 'treino', 'nutricao', 'seguranca'])
  reviewType!: 'geral' | 'treino' | 'nutricao' | 'seguranca';

  @IsString()
  @Length(3, 2000)
  note!: string;
}

export class SetUserRoleDto {
  @IsEmail()
  email!: string;

  @IsEnum(['user', 'professional', 'admin'])
  role!: 'user' | 'professional' | 'admin';
}

export class AssignProfessionalDto {
  @IsUUID()
  professionalUserId!: string;

  @IsUUID()
  clientUserId!: string;
}
