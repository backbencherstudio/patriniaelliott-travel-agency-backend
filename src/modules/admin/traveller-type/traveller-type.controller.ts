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
import { TravellerTypeService } from './traveller-type.service';
import { CreateTravellerTypeDto } from './dto/create-traveller-type.dto';
import { UpdateTravellerTypeDto } from './dto/update-traveller-type.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Traveller Type')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/traveller-type')
export class TravellerTypeController {
  constructor(private readonly travellerTypeService: TravellerTypeService) {}

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create traveller-type' })
  @Post()
  async create(@Body() createTravellerTypeDto: CreateTravellerTypeDto) {
    try {
      const travellerType = await this.travellerTypeService.create(
        createTravellerTypeDto,
      );

      return travellerType;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get all traveller-type' })
  @Get()
  async findAll() {
    try {
      const travellerTypes = await this.travellerTypeService.findAll();

      return travellerTypes;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get one traveller-type' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const travellerType = await this.travellerTypeService.findOne(id);

      return travellerType;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update traveller-type' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTravellerTypeDto: UpdateTravellerTypeDto,
  ) {
    try {
      const travellerType = await this.travellerTypeService.update(
        id,
        updateTravellerTypeDto,
      );

      return travellerType;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete traveller-type' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const travellerType = await this.travellerTypeService.remove(id);

      return travellerType;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
