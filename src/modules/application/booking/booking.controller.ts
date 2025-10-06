import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RefundRequest } from './dto/refund-request.dto';
import { GetUserBookingsDto } from './dto/get-user-bookings.dto';
import { GetUserDashboardDto } from './dto/get-user-dashboard.dto';

@ApiBearerAuth()
@ApiTags('Booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }
  @ApiOperation({ summary: 'Create booking with dynamic ID processing' })
  @Post()
  async create(
    @Req() req: Request,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    const user_id = req.user.userId;
    return await this.bookingService.createBooking(
      user_id,
      createBookingDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all bookings' })
  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: { q?: string; status?: string; approve?: string; show_all?: string },
  ) {
    try {

      const user_id = req.user.userId;

      if (!user_id) {
        console.error('No user_id found in request object');
        return {
          success: false,
          message: 'User not authenticated or user ID not found',
        };
      }

      const bookings = await this.bookingService.findAll(user_id, query);

      return bookings;
    } catch (error) {
      console.error('Controller error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Get user bookings with pagination and filters' })
  // @Get('my-bookings')
  // async getUserBookings(
  //   @Req() req: Request,
  //   @Query() query: GetUserBookingsDto,
  // ) {
  //   try {
  //     const user_id = req.user.userId;

  //     if (!user_id) {
  //       return {
  //         success: false,
  //         message: 'User not authenticated or user ID not found',
  //       };
  //     }

  //     const result = await this.bookingService.getUserBookings(user_id, query);
  //     return result;
  //   } catch (error) {
  //     console.error('Controller error:', error);
  //     return {
  //       success: false,
  //       message: error.message,
  //     };
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @Get('dashboard')
  async getUserDashboard(
    @Req() req: Request,
    @Query() query: GetUserDashboardDto,
  ) {
    try {
      const user_id = req.user.userId;

      if (!user_id) {
        return {
          success: false,
          message: 'User not authenticated or user ID not found',
        };
      }

      const result = await this.bookingService.getUserDashboard(user_id, query);
      return result;
    } catch (error) {
      console.error('Controller error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get one booking' })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const booking = await this.bookingService.findOne(id, user_id);

      return booking;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create feedback for a booking' })
  @Post('feedback')
  async createFeedback(@Req() req: Request, @Body() createFeedbackDto: CreateFeedbackDto) {
    try {
      console.log(createFeedbackDto);
      const user_id = req.user.userId;
      const feedback = await this.bookingService.createFeedback(user_id, createFeedbackDto);

      return feedback;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get feedback for a specific booking' })
  @Get(':booking_id/feedback')
  async getFeedback(@Req() req: Request, @Param('booking_id') booking_id: string) {
    try {
      const user_id = req.user.userId;
      const feedback = await this.bookingService.getFeedback(booking_id, user_id);

      return feedback;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update feedback for a booking' })
  @Put(':booking_id/feedback')
  async updateFeedback(
    @Req() req: Request,
    @Param('booking_id') booking_id: string,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    try {
      const user_id = req.user.userId;
      const feedback = await this.bookingService.updateFeedback(user_id, booking_id, updateFeedbackDto);

      return feedback;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete feedback for a booking' })
  @Delete(':booking_id/feedback')
  async deleteFeedback(@Req() req: Request, @Param('booking_id') booking_id: string) {
    try {
      const user_id = req.user.userId;
      const result = await this.bookingService.deleteFeedback(user_id, booking_id);

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all feedback for the current user' })
  @Get('feedback/all')
  async getUserFeedback(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      const feedbacks = await this.bookingService.getUserFeedback(user_id);

      return feedbacks;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create payment intent for booking' })
  @Post('payment/create-intent')
  async createPaymentIntent(
    @Req() req: Request,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    try {
      const user_id = req.user.userId;
      const paymentIntent = await this.bookingService.createPaymentIntent(
        user_id,
        createPaymentDto,
      );
      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Confirm payment for booking' })
  @Post('payment/confirm/:payment_intent_id')
  async confirmPayment(
    @Req() req: Request,
    @Param('payment_intent_id') payment_intent_id: string,
    @Body() body: ConfirmPaymentDto,
  ) {
    const user_id = req.user.userId;
    return await this.bookingService.confirmPayment(
      user_id,
      payment_intent_id,
      body.payment_method_id
    );
  }

  @ApiOperation({ summary: 'Get payment status for booking' })
  @Get(':booking_id/payment-status')
  async getPaymentStatus(
    @Req() req: Request,
    @Param('booking_id') booking_id: string,
  ) {
    try {
      const paymentStatus = await this.bookingService.getPaymentStatus(
        booking_id,
      );
      return {
        success: true,
        data: paymentStatus,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Refund Request' })
  @Post('/payment/refund/:booking_id')
  async refund(
    @Req() req: Request,
    @Param('booking_id') booking_id: string,
    @Body() body: RefundRequest,
  ) {
    const user_id = req.user.userId;
    return await this.bookingService.refundRequest({ user_id, booking_id, refund_reason: body.refund_reason })
  }
}
