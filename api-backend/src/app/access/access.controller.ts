import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessService } from './access.service';
import { IValidateAccessDto, IAccessResponseDto } from '@iot-workspace/interfaces';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('access')
export class AccessController {
  public constructor(private readonly accessService: AccessService) {}

  @Post('validate')
  public validate(
    @Body() dto: IValidateAccessDto,
  ): Promise<IAccessResponseDto> {
    return this.accessService.validateAccess(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logs')
  public getLogs(): Promise<any[]> {
    return this.accessService.getAccessLogs();
  }
}
