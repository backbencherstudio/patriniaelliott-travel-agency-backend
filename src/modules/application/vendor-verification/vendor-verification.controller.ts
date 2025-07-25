import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorVerificationService } from './vendor-verification.service';
import { CreateVendorVerificationDto } from './dto/create-vendor-verification.dto/create-vendor-verification.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('VendorVerification')
@Controller('application/vendor-verification')
export class VendorVerificationController {
  constructor(private readonly vendorVerificationService: VendorVerificationService) {}

  @ApiOperation({ summary: 'Create vendor verification' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createVendorVerificationDto: CreateVendorVerificationDto,
    @Req() req: any
  ) {
    const user_id = req.user.userId;
     console.log(user_id);
    //console.log(createVendorVerificationDto);
    try {
      const result = await this.vendorVerificationService.create(createVendorVerificationDto, user_id);
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}