import { Controller, Post, Body, UseGuards, Req,Param,Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorPackageService } from './vendor-package.service';
import { CreateVendorPackageDto } from './dto/create-vendor-package.dto';
import { GetVendorPackageDto } from './dto/get-vendor-package.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('VendorPackage')
@Controller('application/vendor-package')
export class VendorPackageController {
  constructor(private readonly vendorPackageService: VendorPackageService) {}
  // ... existing code ...
@ApiOperation({ summary: 'get vendor package' })
@Get()
@UseGuards(JwtAuthGuard) 
async getVendorPackage(@Query() query: GetVendorPackageDto, @Req() req: any) {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '10', 10);
  const user_id = req.user.userId; 

  return this.vendorPackageService.getVendorPackage(page, limit, user_id);
}

@ApiOperation({ summary: 'get vendor package by id' })
  @Get(':id')
  @UseGuards(JwtAuthGuard) 
  async getVendorPackageIdWise(@Param('id') id: string) {  
    const user_id = id;

    return this.vendorPackageService.getVendorIdWise(user_id);
  }
// ... existing code ...


  @ApiOperation({ summary: 'Create vendor package' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createVendorPackageDto: CreateVendorPackageDto,
    @Req() req: any
  ) {
    const user_id = req.user.userId;
    console.log(user_id);
    try {
      const result = await this.vendorPackageService.create(createVendorPackageDto, user_id);
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
