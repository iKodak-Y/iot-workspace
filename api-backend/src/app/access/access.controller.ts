import { Body, Controller, Post } from '@nestjs/common';
import { AccessService } from './access.service';
import { IValidateAccessDto, IAccessResponseDto } from '@iot-workspace/interfaces';

@Controller('access')
export class AccessController {
  public constructor(private readonly accessService: AccessService) {}

  @Post('validate')
  public validate(
    @Body() dto: IValidateAccessDto,
  ): Promise<IAccessResponseDto> {
    return this.accessService.validateAccess(dto);
  }
}
