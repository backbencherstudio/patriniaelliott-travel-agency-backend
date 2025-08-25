import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { VendorVerificationService } from './vendor-verification.service';
import { CreateVendorVerificationDto } from './dto/create-vendor-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateVendorVerificationDto } from './dto/update-vendor-verification.dto';
import { GetVendorTransactionsDto } from './dto/get-vendor-transactions.dto';
import { GetVendorBookingsDto } from './dto/get-vendor-bookings.dto';
import { GetVendorRefundsDto } from './dto/get-vendor-refunds.dto';

@ApiTags('Vendor')
@Controller('vendor')
@UseGuards(JwtAuthGuard)
export class VendorVerificationController {
  constructor(
    private readonly vendorVerificationService: VendorVerificationService,
  ) {}

  @Get('invoice/:id')
  @ApiOperation({ summary: 'Get invoice details by ID' })
  async getInvoiceDetails(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.vendorVerificationService.getInvoiceDetails(userId, id);
  }

  @Get('refund/:id')
  @ApiOperation({ summary: 'Get refund details by transaction ID' })
  async getRefundDetails(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.vendorVerificationService.getRefundDetails(userId, id);
  }        

  @Get('bookings')
  @ApiOperation({ summary: 'Get vendor bookings' })
  asyncgetBookings(
    @Req() req: Request,
    @Query() query: GetVendorBookingsDto,
  ) {
    const userId = req.user.userId;
    return this.vendorVerificationService.getBookings(userId, query);
  }

  @Get('refunds')
  @ApiOperation({ summary: 'Get vendor refunds' })
  asyncgetRefunds(
    @Req() req: Request,
    @Query() query: GetVendorRefundsDto,
  ) {
    const userId = req.user.userId;
    return this.vendorVerificationService.getRefunds(userId, query);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get vendor transaction history' })
  async getTransactionHistory(
    @Req() req: Request,
    @Query() query: GetVendorTransactionsDto,
  ) {
    const userId = req.user.userId;
    return this.vendorVerificationService.getTransactionHistory(userId, query);
  }

  @Patch('verification')
  @ApiOperation({ summary: 'Update vendor verification details' })
  async updateVerification(
    @Req() req: Request,
    @Body() updateDto: UpdateVendorVerificationDto,
  ) {
    const userId = req.user.userId;
    return this.vendorVerificationService.updateVerification(userId, updateDto);
  }

  @Post('add-profile-info')
  @ApiOperation({ summary: 'Submit vendor verification details' })
  async submitVerification(
    @Req() req: Request,
    @Body() createDto: CreateVendorVerificationDto,
  ) {
    const userId = req.user.userId;
    return this.vendorVerificationService.createOrUpdateVerification(
      userId,
      createDto,
    );
  }
}
