import { Controller, Get } from '@nestjs/common';
import { PageService } from './page.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Page')
@Controller('page')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @ApiOperation({ summary: 'Get home page data' })
  @Get('home')
  async homePage() {
    try {
      const data = await this.pageService.homePage();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
