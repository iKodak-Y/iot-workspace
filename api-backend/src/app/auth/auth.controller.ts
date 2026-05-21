import { Body, Controller, Post } from '@nestjs/common';
import { IAuthResponseDto, ILoginDto } from '@iot-workspace/interfaces';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('login')
  public login(@Body() dto: ILoginDto): Promise<IAuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('setup-admin')
  public setupAdmin(@Body() dto: ILoginDto): Promise<string> {
    return this.authService.setupAdmin(dto);
  }
}
