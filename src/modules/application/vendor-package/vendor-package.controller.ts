import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorPackageService } from './vendor-package.service';
import { CreateVendorPackageDto } from './dto/create-vendor-package.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('VendorPackage')
@Controller('application/vendor-package')
export class VendorPackageController {
  constructor(private readonly vendorPackageService: VendorPackageService) {}

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
