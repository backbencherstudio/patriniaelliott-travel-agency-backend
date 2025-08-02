import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { VendorPackageService } from './vendor-package.service';
import { SearchPackagesDto } from '../../admin/vendor-package/dto/search-packages.dto';
import { 
  VendorPackageSearchResponseDto, 
  VendorPackageDetailResponseDto, 
  VendorPackageListResponseDto 
} from './dto/vendor-package-response.dto';

@ApiTags('Vendor Packages')
@Controller('application/vendor-package')
export class VendorPackageController {
  constructor(private readonly vendorPackageService: VendorPackageService) {}

  @ApiOperation({ summary: 'Search vendor packages with filters' })
  @ApiResponse({ status: 200, description: 'Vendor packages found', type: VendorPackageSearchResponseDto })
  @Get()
  async searchVendorPackages(@Query() searchDto: SearchPackagesDto) {
    return this.vendorPackageService.searchVendorPackages(searchDto);
  }

  @ApiOperation({ summary: 'Get vendor package by ID' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Vendor package details', type: VendorPackageDetailResponseDto })
  @Get(':id')
  async getVendorPackageById(@Param('id') id: string) {
    return this.vendorPackageService.getVendorPackageById(id);
  }

  @ApiOperation({ summary: 'Get vendor packages by vendor ID' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Vendor packages by vendor', type: VendorPackageListResponseDto })
  @Get('vendor/:vendorId')
  async getVendorPackagesByVendor(
    @Param('vendorId') vendorId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.vendorPackageService.getVendorPackagesByVendor(vendorId, page, limit);
  }

  @ApiOperation({ summary: 'Get featured vendor packages' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of packages to return' })
  @ApiResponse({ status: 200, description: 'Featured vendor packages', type: VendorPackageListResponseDto })
  @Get('featured/list')
  async getFeaturedVendorPackages(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.vendorPackageService.getFeaturedVendorPackages(limit);
  }
} 