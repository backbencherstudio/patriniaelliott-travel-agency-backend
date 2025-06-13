import { Controller, Get } from '@nestjs/common';
import { FooterService } from './footer.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Footer')
@Controller('footer')
export class FooterController {
  constructor(private readonly footerService: FooterService) {}

  @ApiOperation({ summary: 'Get footer' })
  @Get()
  async findAll() {
    try {
      const footer = await this.footerService.findAll();
      return footer;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
