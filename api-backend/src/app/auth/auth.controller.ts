import { Body, Controller, Post } from '@nestjs/common';
import { IActivationDto, IAuthResponseDto, ILoginDto, IRecoveryDto } from '@iot-workspace/interfaces';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('login')
  public login(@Body() dto: ILoginDto): Promise<IAuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('activate')
  public activate(@Body() dto: IActivationDto): Promise<IAuthResponseDto> {
    return this.authService.activate(dto);
  }

  @Post('recover')
  public recover(@Body() dto: IRecoveryDto): Promise<IAuthResponseDto> {
    return this.authService.recover(dto);
  }

  @Post('setup-admin')
  public setupAdmin(@Body() dto: ILoginDto): Promise<string> {
    return this.authService.setupAdmin(dto);
  }
}
