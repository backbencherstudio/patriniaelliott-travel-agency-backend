import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { CountryService } from './country.service';

import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'q', required: false, description: 'Search by name/country_code/dial_code' })
  @ApiQuery({ name: 'country_code', required: false })
  @ApiQuery({ name: 'dial_code', required: false })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @Get()
  async findAll(@Query() query: { q?: string; country_code?: string; dial_code?: string; page?: string; limit?: string }) {
    try {
      const countries = await this.countryService.findAll(query);

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update country' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: CreateCountryDto) {
    try {
      return await this.countryService.update(id, body);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete country' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.countryService.remove(id);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
