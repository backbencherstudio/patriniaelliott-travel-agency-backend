import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ExtraServiceService } from './extra-service.service';
import { CreateExtraServiceDto } from './dto/create-extra-service.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateExtraServiceDto } from './dto/update-extra-service.dto';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Extra Service')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/extra-service')
export class ExtraServiceController {
  constructor(private readonly extraServiceService: ExtraServiceService) {}

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create extra service' })
  @Post()
  async create(@Body() createExtraServiceDto: CreateExtraServiceDto) {
    try {
      const extraService = await this.extraServiceService.create(
        createExtraServiceDto,
      );

      return extraService;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get all extra services' })
  @Get()
  async findAll() {
    try {
      const extra_services = await this.extraServiceService.findAll();

      return extra_services;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get extra service by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const extra_service = await this.extraServiceService.findOne(id);

      return extra_service;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update extra service' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExtraServiceDto: UpdateExtraServiceDto,
  ) {
    try {
      const extra_service = await this.extraServiceService.update(
        id,
        updateExtraServiceDto,
      );

      return extra_service;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete extra service' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const extra_service = await this.extraServiceService.remove(id);

      return extra_service;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
