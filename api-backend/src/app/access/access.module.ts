import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { AccessGateway } from './access.gateway';

@Module({
  controllers: [AccessController],
  providers: [AccessService, AccessGateway],
})
export class AccessModule {}
