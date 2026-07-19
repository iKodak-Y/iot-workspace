import { Controller, Post, Body, UseGuards, Get, Param, Delete } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCredentialDto } from '@iot-workspace/interfaces';

@Controller('credentials')
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  assign(@Body() dto: CreateCredentialDto) {
    return this.credentialsService.assign(dto);
  }

  @Get('user/:userId')
  getByUserId(@Param('userId') userId: string) {
    return this.credentialsService.getByUserId(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.credentialsService.remove(id);
  }
}
