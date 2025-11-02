import { Controller, Get, Query, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorUserVerificationAdminService } from './vendor-user-verification.service';
import { UpdateVendorVerificationDto } from './dto/update-vendor-verification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';

@ApiTags('Admin Vendor User Verification')
@Controller('admin/vendor-user-verification')

export class VendorUserVerificationAdminController {
  constructor(private readonly service: VendorUserVerificationAdminService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'List user documents' })
  @Get('documents')
  async list(@Query() query: { status?: string; page?: number; limit?: number; dateFilter?: string }) {
    return this.service.listDocuments({
      status: query.status,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      dateFilter: query.dateFilter,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve a document' })
  @Patch('documents/:id/approve')
  async approveDocument(@Param('id') id: string) {
    console.log(id);
    return this.service.approveDocument(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject a document' })
  @Patch('documents/:id/reject')
  async rejectDocument(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.rejectDocument(id, body?.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve vendor verification for a user' })
  @Patch('vendor/:userId/approve')
  async approveVendor(@Param('userId') userId: string) {
    console.log(userId);
    return this.service.approveVendor(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject vendor verification for a user' })
  @Patch('vendor/:userId/reject')
  async rejectVendor(@Param('userId') userId: string, @Body() body: { reason?: string }) {
    return this.service.rejectVendor(userId, body?.reason);
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Get vendor verification by user id',
    description: 'Get vendor verification details for a specific user. Users can only view their own data and must be vendors. Admins can view any vendor data.'
  })
  @Get('vendor/:userId')
  async getVendorByUserId(
    @Param('userId') userId: string,
    @Req() req: any
  ) {
    return this.service.getVendorByUserId(userId, req.user);
  }

  @Roles(Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Update vendor verification by user id',
    description: 'Update vendor verification details for a specific user. Users can only update their own data and must be vendors. Admins can update any vendor data. All fields are optional - only provided fields will be updated.'
  })
  @Patch('vendor/:userId')
  async updateVendorByUserId(
    @Param('userId') userId: string, 
    @Body() body: UpdateVendorVerificationDto,
    @Req() req: any
  ) {
    return this.service.updateVendorByUserId(userId, body, req.user);
  }
}