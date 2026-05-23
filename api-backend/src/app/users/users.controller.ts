import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from '@iot-workspace/interfaces';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @Body('estado') estado: boolean) {
    return this.usersService.toggleStatus(id, estado);
  }
}
