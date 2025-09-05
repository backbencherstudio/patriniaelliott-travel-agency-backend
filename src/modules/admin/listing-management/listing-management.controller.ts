import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards 
} from '@nestjs/common';
import { ListingManagementService } from './listing-management.service';
import { CreateListingManagementDto } from './dto/create-listing-management.dto';
import { UpdateListingManagementDto } from './dto/update-listing-management.dto';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Listing Management')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ADMIN)
@Controller('admin/listing-management')
export class ListingManagementController {
  constructor(private readonly listingManagementService: ListingManagementService) {}

  @Get('overview')
  async overview() {
    const response = await this.listingManagementService.overview();
    return response;
  }

  @ApiResponse({ description: 'Get all packages with pagination and filtering' })
  @Get('all-properties')
  async findAll(
    @Query() query: { 
      type?: string; 
      status?: string;
      page?: string; 
      limit?: string;
      dateFilter?: string;
    },
  ) {
    try {
      const packages = await this.listingManagementService.findAll(query);
      return packages;
    } catch (error) {
      return { 
        success: false,
        message: error.message,
      };
    }
  }

  @ApiResponse({ description: 'Get a package by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const packageData = await this.listingManagementService.findOne(id);
      return packageData;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post()
  create(@Body() createListingManagementDto: CreateListingManagementDto) {
    return this.listingManagementService.create(createListingManagementDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateListingManagementDto: UpdateListingManagementDto) {
    return this.listingManagementService.update(id, updateListingManagementDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.listingManagementService.remove(id);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Approve package
  @Roles(Role.ADMIN)
  @ApiResponse({ description: 'Approve a package' })
  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    try {
      const result = await this.listingManagementService.approve(id);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Reject package
  @Roles(Role.ADMIN)
  @ApiResponse({ description: 'Reject a package' })
  @Post(':id/reject')
  async reject(@Param('id') id: string) {
    try {
      const result = await this.listingManagementService.reject(id);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
