import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResidentService } from './resident.service';

@Controller('resident')
@UseGuards(JwtAuthGuard)
export class ResidentController {
  public constructor(private readonly residentService: ResidentService) {}

  @Get('me')
  public getMe(@Req() req: { user: { id: string } }) {
    return this.residentService.getProfile(req.user.id);
  }

  @Post('device-token/rotate')
  public rotateDeviceToken(@Req() req: { user: { id: string } }) {
    return this.residentService.rotateDeviceToken(req.user.id);
  }
}