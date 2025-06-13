import { Controller, Get } from '@nestjs/common';
import { CountryService } from './country.service';

import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Country')
@Controller('admin/country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @ApiOperation({ summary: 'Get all countries' })
  @Get()
  async findAll() {
    try {
      const countries = await this.countryService.findAll();

      return countries;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
