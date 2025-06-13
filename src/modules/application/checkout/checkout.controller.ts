import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { UpdateCheckoutDto } from './dto/update-checkout.dto';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @ApiOperation({ summary: 'Create a new checkout' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: Request,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ) {
    try {
      const user_id = req.user.userId;
      const checkout = await this.checkoutService.create(
        user_id,
        createCheckoutDto,
      );

      return checkout;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update checkout' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateCheckoutDto: UpdateCheckoutDto,
  ) {
    try {
      const user_id = req.user.userId;
      const checkout = await this.checkoutService.update(
        id,
        user_id,
        updateCheckoutDto,
      );

      return checkout;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Apply coupon' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/coupon')
  async applyCoupon(
    @Req() req: Request,
    @Param('id') id: string,
    // @Body() body: { coupons: ICoupon[] },
    @Body() body: { code: string },
  ) {
    try {
      const user_id = req.user.userId;
      const checkout = await this.checkoutService.applyCoupon({
        user_id: user_id,
        checkout_id: id,
        code: body.code,
      });
      return checkout;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Remove coupon' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/coupon/:coupon_id')
  async removeCoupon(
    @Req() req: Request,
    @Param() params: { id: string; coupon_id: string },
  ) {
    try {
      const user_id = req.user.userId;
      const coupon_id = params.coupon_id;
      const checkout_id = params.id;

      const checkout = await this.checkoutService.removeCoupon({
        coupon_id: coupon_id,
        user_id: user_id,
        checkout_id: checkout_id,
      });
      return checkout;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get checkout details' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const checkout = await this.checkoutService.findOne(id);
      return checkout;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
