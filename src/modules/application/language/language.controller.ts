import { Controller, Get } from '@nestjs/common';
import { LanguageService } from './language.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Language')
@Controller('language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @ApiOperation({ summary: 'Get all languages' })
  @Get()
  async findAll() {
    try {
      const languages = await this.languageService.findAll();

      return languages;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
