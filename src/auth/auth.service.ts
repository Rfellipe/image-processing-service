import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  register(): string {
    return 'Register path working';
  }

  login(): string {
    return 'Login path working';
  }
}
