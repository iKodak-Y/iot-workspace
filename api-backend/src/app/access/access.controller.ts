import { Body, Controller, Get, Post, UseGuards, Req, Sse, MessageEvent } from '@nestjs/common';
import { AccessService } from './access.service';
import { IValidateAccessDto, IAccessResponseDto } from '@iot-workspace/interfaces';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Observable, merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';

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

  @UseGuards(JwtAuthGuard)
  @Post('remote-open')
  public remoteOpen(
    @Req() req: any,
    @Body('puntoAccesoId') puntoAccesoId: string,
  ) {
    const userId = req.user.id;
    return this.accessService.triggerRemoteOpen(userId, puntoAccesoId || 'garita_principal');
  }

  @Sse('stream')
  public stream(): Observable<MessageEvent> {
    const keepAlive = interval(15000).pipe(
      map(() => ({ data: { type: 'ping' } } as MessageEvent))
    );
    
    const events = this.accessService.getRemoteOpenStream().pipe(
      map((event) => ({ data: event.data } as MessageEvent))
    );

    return merge(events, keepAlive);
  }
}
