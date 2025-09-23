import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CountryService } from './country.service';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCountryDto } from './dto/create-country.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create country' })
  @Post()
  async create(@Body() body: CreateCountryDto) {
    try {
      return await this.countryService.create(body);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
