import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  Param, 
  Get, 
  Delete
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Checkout')
@Controller('application/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @ApiOperation({ summary: 'Initiate checkout session' })
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiateCheckout(
    @Req() req: Request,
    @Body() initiateCheckoutDto: InitiateCheckoutDto
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.checkoutService.initiateCheckout(userId, initiateCheckoutDto);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get checkout session details' })
  @Get(':checkoutId')
  @UseGuards(JwtAuthGuard)
  async getCheckoutSession(
    @Req() req: Request,
    @Param('checkoutId') checkoutId: string
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.checkoutService.getCheckoutSession(checkoutId, userId);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Cancel checkout session' })
  @Delete(':checkoutId')
  @UseGuards(JwtAuthGuard)
  async cancelCheckoutSession(
    @Req() req: Request,
    @Param('checkoutId') checkoutId: string
  ) {
    try {
      const userId = req.user.userId;
      const result = await this.checkoutService.cancelCheckoutSession(checkoutId, userId);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
