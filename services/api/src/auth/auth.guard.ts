import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

export type AuthContext = {
  userId: string;
  email: string;
  token: string;
};

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  auth: AuthContext;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const authorization = Array.isArray(header) ? header[0] : header;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Sessão ausente.');
    }

    const token = authorization.slice('Bearer '.length).trim();
    const auth = await this.authService.authenticateToken(token);

    if (!auth) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    request.auth = { ...auth, token };
    return true;
  }
}
