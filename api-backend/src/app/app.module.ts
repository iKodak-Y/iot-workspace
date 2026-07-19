import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@iot-workspace/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessModule } from './access/access.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CredentialsModule } from './credentials/credentials.module';
import { ResidentModule } from './resident/resident.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    CoreModule,
    AccessModule,
    AuthModule,
    UsersModule,
    CredentialsModule,
    ResidentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
