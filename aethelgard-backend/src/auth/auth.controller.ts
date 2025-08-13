import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type LoginBody = { message: string; signature: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce/:address')
  async nonce(@Param('address') address: string) {
    const nonce = await this.authService.generateNonce(address);
    return { nonce };
  }

  @Post('login')
  async login(@Body() body: LoginBody) {
    const { accessToken, walletAddress } = await this.authService.verifySiweAndIssueJwt(body.message, body.signature);
    return { accessToken, walletAddress };
  }
}
