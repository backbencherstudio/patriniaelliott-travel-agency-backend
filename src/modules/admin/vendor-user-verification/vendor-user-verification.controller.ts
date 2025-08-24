import { Controller, Get, Query, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorUserVerificationAdminService } from './vendor-user-verification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';

@ApiTags('Admin Vendor User Verification')
@Controller('admin/vendor-user-verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VENDOR)
export class VendorUserVerificationAdminController {
  constructor(private readonly service: VendorUserVerificationAdminService) {}

  @ApiOperation({ summary: 'List user documents' })
  @Get('documents')
  async list(@Query() query: { status?: string; page?: number; limit?: number }) {
    return this.service.listDocuments({
      status: query.status ,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    });
  }

  @ApiOperation({ summary: 'Approve a document' })
  @Patch('documents/:id/approve')
  async approveDocument(@Param('id') id: string) {
    console.log(id);
    return this.service.approveDocument(id);
  }

  @ApiOperation({ summary: 'Reject a document' })
  @Patch('documents/:id/reject')
  async rejectDocument(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.rejectDocument(id, body?.reason);
  }

  @ApiOperation({ summary: 'Approve vendor verification for a user' })
  @Patch('vendor/:userId/approve')
  async approveVendor(@Param('userId') userId: string) {
    return this.service.approveVendor(userId);
  }

  @ApiOperation({ summary: 'Reject vendor verification for a user' })
  @Patch('vendor/:userId/reject')
  async rejectVendor(@Param('userId') userId: string, @Body() body: { reason?: string }) {
    return this.service.rejectVendor(userId, body?.reason);
  }

  @ApiOperation({ summary: 'Update vendor verification by user id' })
  @Patch('vendor/:userId')
  async updateVendorByUserId(@Param('userId') userId: string, @Body() body: any) {
    return this.service.updateVendorByUserId(userId, body);
  }
}