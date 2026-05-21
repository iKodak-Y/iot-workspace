import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class CoreModule {}
