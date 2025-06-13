import { Controller, Get } from '@nestjs/common';
import { CancellationPolicyService } from './cancellation-policy.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Cancellation Policy')
@Controller('cancellation-policy')
export class CancellationPolicyController {
  constructor(
    private readonly cancellationPolicyService: CancellationPolicyService,
  ) {}

  @ApiOperation({ summary: 'Get cancellation policy' })
  @Get()
  async findAll() {
    try {
      const cancellationPolicy = await this.cancellationPolicyService.findAll();
      return cancellationPolicy;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
