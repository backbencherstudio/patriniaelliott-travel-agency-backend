import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @ApiOperation({ 
    summary: 'Get all bookings with pagination',
    description: 'Filter bookings by type: "all" (default), "hotel", "apartment", or "tour"'
  })
  @Get()
  async findAll(@Query() query: QueryBookingDto) {
    try {
      const {
        q,
        status,
        approve,
        type,
        date_range,
        page,
        limit,
        sort_by,
      } = query;

      // Set default values
      const pageNumber = page || 1; 
      const limitNumber = limit || 10;
      const sortBy = sort_by || 'created_at_desc';

      const bookings = await this.bookingService.findAll({
        q,
        status,
        approve,
        type,
        date_range,
        page: pageNumber,
        limit: limitNumber,
        sort_by: sortBy,
      });
      
      return bookings;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: 'Get detailed booking information',
    description: 'Get comprehensive booking details including package info, guest details, reservation details, and payment information'
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const booking = await this.bookingService.findOne(id);
      return booking;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: 'Update booking details',
    description: 'Update booking information. Payment status will be automatically updated based on booking status: canceled/cancelled → payment_status: canceled, approved → payment_status: approved, others → payment_status: pending'
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    try {
      const booking = await this.bookingService.update(id, updateBookingDto);
      return booking;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // update status
  @ApiOperation({ 
    summary: 'Update booking status',
    description: 'Update booking status. Payment status will be automatically updated based on booking status: canceled/cancelled → payment_status: canceled, approved → payment_status: approved, others → payment_status: pending'
  })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    try {
      const booking = await this.bookingService.updateStatus(
        id,
        updateBookingDto,
      );
      return booking;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: 'Get booking statistics by type',
    description: 'Get count of bookings for each service type (All, Hotel, Apartment, Tour)'
  })
  @Get('statistics')
  async getBookingStatistics() {
    try {
      const statistics = await this.bookingService.getBookingStatistics();
      return statistics;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: 'Export bookings as PDF',
    description: 'Export filtered bookings to PDF format'
  })
  @Get('export/pdf')
  async exportAsPdf(@Query() query: QueryBookingDto) {
    try {
      const {
        q,
        status,
        approve,
        type,
        date_range,
      } = query;

      const bookings = await this.bookingService.findAll({
        q,
        status,
        approve,
        type,
        date_range,
        page: 1,
        limit: 1000, // Export all matching records
        sort_by: 'created_at_desc',
      });

      // For now, return the data in a format that can be used to generate PDF
      // In a real implementation, you would use a PDF library like puppeteer or pdfkit
      return {
        success: true,
        message: 'Bookings data ready for PDF export',
        data: bookings.data,
        export_info: {
          total_records: bookings.pagination?.total_items || 0,
          export_date: new Date().toISOString(),
          filters_applied: {
            search: q || 'none',
            status: status || 'all',
            approval: approve || 'all',
            type: type || 'all'
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const booking = await this.bookingService.remove(id);
      return booking;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
