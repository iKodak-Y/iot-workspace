import { Controller, Post, Body, UseGuards } from '@nestjs/common';
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
}
