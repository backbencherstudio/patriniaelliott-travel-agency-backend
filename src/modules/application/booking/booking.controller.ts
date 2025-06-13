import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiBearerAuth()
@ApiTags('Booking')
@UseGuards(JwtAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @ApiOperation({ summary: 'Create booking' })
  @Post(':checkout_id')
  async create(
    @Req() req: Request,
    @Param('checkout_id') checkout_id: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    try {
      const user_id = req.user.userId;
      const booking = await this.bookingService.create(
        user_id,
        checkout_id,
        createBookingDto,
      );
      return booking;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get all bookings' })
  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: { q?: string; status?: number; approve?: string },
  ) {
    try {
      const user_id = req.user.userId;
      const q = query.q;
      const status = query.status;
      const approve = query.approve;
      const bookings = await this.bookingService.findAll({
        user_id,
        q,
        status,
        approve,
      });

      return bookings;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

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
}
