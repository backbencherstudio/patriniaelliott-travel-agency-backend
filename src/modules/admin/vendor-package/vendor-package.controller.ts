import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  Param, 
  Get, 
  Query, 
  Delete, 
  Put, 
  Patch,
  UseInterceptors,
  ParseFilePipe,
  UploadedFiles
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorPackageService } from './vendor-package.service';
import { CreateVendorPackageDto } from './dto/create-vendor-package.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { GetVendorPackageDto } from './dto/get-vendor-package.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// Import file upload dependencies
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Express, Request } from 'express';
import { diskStorage } from 'multer';
import appConfig from '../../../config/app.config';
import { SearchPackagesDto } from './dto/search-packages.dto';
import { memoryStorage } from 'multer';
import { 
  CalendarQueryDto,
  SingleDateUpdateDto,
  BulkDateRangeUpdateDto,
  CalendarInitDto
} from './dto/calendar-availability.dto';

@ApiTags('VendorPackage')
@Controller('admin/vendor-package')
export class VendorPackageController {
  constructor(private readonly vendorPackageService: VendorPackageService) {}

  // Enhanced getVendorPackage with calendar support
  @ApiOperation({ summary: 'Get vendor packages with optional calendar data' })
  @Get()
  async getVendorPackage(
    @Query() query: GetVendorPackageDto & CalendarQueryDto, 
    @Req() req: any
  ) {
    const page = parseInt(query.page?.toString() || '1', 10);
    const limit = parseInt(query.limit?.toString() || '10', 10);
    const user_id = req.user?.userId || null;
    
    // Handle multiple type parameters
    const types = Array.isArray(query.type) ? query.type : 
                  (typeof query.type === 'string' && query.type.includes(',')) ? 
                  query.type.split(',').map(t => t.trim()) : 
                  query.type ? [query.type] : undefined;
    
    return this.vendorPackageService.getVendorPackage(
      page, 
      limit, 
      user_id, 
      { 
        searchQuery: query.q, 
        status: query.status, 
        categoryId: query.category_id, 
        destinationId: query.destination_id,
        type: types,
        freeCancellation: query.free_cancellation,
        languages: query.languages,
        ratings: query.ratings,
        budgetEnd: query.budget_end,
        budgetStart: query.budget_start,
        durationEnd: query.duration_end,
        durationStart: query.duration_start
      }
    );
  }

  // Enhanced get by ID with calendar data
  @ApiOperation({ summary: 'Get vendor package by ID with calendar data' })
  @Get(':id')
  async getVendorIdWise(
    @Param('id') id: string,
    @Query() calendarQuery: CalendarQueryDto
  ) {  
    return this.vendorPackageService.getVendorIdWise(id);
  }

  // Create with file upload (from PackageController)
  @ApiOperation({ summary: 'Create vendor package with files' })
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'package_files' }, 
        { name: 'trip_plans_images' },
        { name: 'package_trip_plan_images' }, // Add this field for compatibility
        
        // Dynamic trip plans images (trip_plans_0_images, trip_plans_1_images, etc.)
        { name: 'trip_plans_0_images' },
        { name: 'trip_plans_1_images' },
        { name: 'trip_plans_2_images' },
        { name: 'trip_plans_3_images' },
        { name: 'trip_plans_4_images' },
        { name: 'trip_plans_5_images' },
        { name: 'trip_plans_6_images' },
        { name: 'trip_plans_7_images' },
        { name: 'trip_plans_8_images' },
        { name: 'trip_plans_9_images' },
        { name: 'room_photos', maxCount: 10 } // Add room_photos for gallery images
      ],
      {
        storage: memoryStorage(), // Use memory storage to get file buffer
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit
          files: 50 // Increased limit for multiple day images
        },
        fileFilter: (req, file, cb) => {
          // Allow only image files
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'), false);
          }
        }
      },
    ),
  )
  async create(
    @Req() req: Request,
    @Body() createVendorPackageDto: CreateVendorPackageDto,
    @UploadedFiles()
    files?: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
      package_trip_plan_images?: Express.Multer.File[]; // Add this field for compatibility
      
      // Dynamic trip plans images (trip_plans_0_images, trip_plans_1_images, etc.)
      trip_plans_0_images?: Express.Multer.File[];
      trip_plans_1_images?: Express.Multer.File[];
      trip_plans_2_images?: Express.Multer.File[];
      trip_plans_3_images?: Express.Multer.File[];
      trip_plans_4_images?: Express.Multer.File[];
      trip_plans_5_images?: Express.Multer.File[];
      trip_plans_6_images?: Express.Multer.File[];
      trip_plans_7_images?: Express.Multer.File[];
      trip_plans_8_images?: Express.Multer.File[];
      trip_plans_9_images?: Express.Multer.File[];
      room_photos?: Express.Multer.File[]; // Add room_photos files
    },
  ) {
    try {
      const user_id = req.user.userId;
      
      const result = await this.vendorPackageService.createWithFiles(
        createVendorPackageDto, 
        user_id, 
        files
      );
      return result;
    } catch (error) {
      console.error('Create package error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Update with file upload (from PackageController)
  @ApiOperation({ summary: 'Update vendor package with files' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'package_files' }, 
        { name: 'trip_plans_images' },
        { name: 'room_photos', maxCount: 10 } // Add room_photos for gallery images
      ],
      {
        storage: memoryStorage(), // Use memory storage to get file buffer
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit
          files: 20 // Total files limit
        },
        fileFilter: (req, file, cb) => {
          // Allow only image files
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'), false);
          }
        }
      },
    ),
  )
  async updateWithFiles(
    @Param('id') packageId: string,
    @Body() updateVendorPackageDto: CreateVendorPackageDto,
    @Req() req: Request,
    @UploadedFiles()
    files?: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
      room_photos?: Express.Multer.File[]; // Add room_photos files
    },
  ) {
    try {
      const user_id = req.user.userId;
      const result = await this.vendorPackageService.updateWithFiles(
        packageId, 
        user_id, 
        updateVendorPackageDto,
        files
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Keep your existing PUT method for simple updates
  @ApiOperation({ summary: 'Update vendor package (simple)' })
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateVendorPackage(
    @Param('id') packageId: string, 
    @Body() updateVendorPackageDto: CreateVendorPackageDto,
    @Req() req: any
  ) {
    const user_id = req.user.userId;
    return this.vendorPackageService.updateVendorPackage(packageId, user_id, updateVendorPackageDto);
  }

  @ApiOperation({ summary: 'Delete vendor package' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteVendorPackage(@Param('id') packageId: string, @Req() req: any) {
    const user_id = req.user.userId;
    return this.vendorPackageService.deleteVendorPackage(packageId, user_id);
  }

  // Review Endpoints
  @ApiOperation({ summary: 'Create a review for a package' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  async createReview(
    @Param('id') packageId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: any,
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorPackageService.createReview(
        packageId,
        user_id,
        createReviewDto,
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get all reviews for a package' })
  @Get(':id/reviews')
  async getPackageReviews(
    @Param('id') packageId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      return await this.vendorPackageService.getPackageReviews(
        packageId,
        pageNumber,
        limitNumber,
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get rating summary for a package' })
  @Get(':id/rating-summary')
  async getPackageRatingSummary(@Param('id') packageId: string) {
    try {
      return await this.vendorPackageService.getPackageRatingSummary(packageId);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update a review' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reviews/:reviewId')
  async updateReview(
    @Param('id') packageId: string,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req: any,
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorPackageService.updateReview(
        packageId,
        reviewId,
        user_id,
        updateReviewDto,
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete a review' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/reviews/:reviewId')
  async deleteReview(
    @Param('id') packageId: string,
    @Param('reviewId') reviewId: string,
    @Req() req: any,
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorPackageService.deleteReview(
        packageId,
        reviewId,
        user_id,
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ===== PROPERTY CALENDAR ENDPOINTS =====

  @ApiOperation({ summary: 'Initialize calendar for a package' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/calendar/init')
  async initializeCalendar(
    @Param('id') packageId: string,
    @Body() calendarInitDto: CalendarInitDto,
    @Req() req: any
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorPackageService.initializePropertyCalendar(
        packageId,
        user_id,
        calendarInitDto
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get calendar data for a specific package' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/calendar')
  async getPackageCalendar(
    @Param('id') packageId: string,
    @Query() query: CalendarQueryDto,
    @Req() req: any
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorPackageService.getPropertyCalendarData(
        packageId,
        user_id,
        query.calendar_month,
        query.room_type_id
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update single date in calendar' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/calendar/date')
  async updateSingleDate(
    @Param('id') packageId: string,
    @Body() updateDto: SingleDateUpdateDto,
    @Req() req: any
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorPackageService.updatePropertyCalendarDate(
        packageId,
        user_id,
        updateDto
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update calendar for date range (bulk operation)' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/calendar/bulk')
  async updateBulkCalendar(
    @Param('id') packageId: string,
    @Body() bulkUpdateDto: BulkDateRangeUpdateDto,
    @Req() req: any
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorPackageService.updatePropertyCalendarBulk(
        packageId,
        user_id,
        bulkUpdateDto
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get calendar summary for a package' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/calendar/summary')
  async getCalendarSummary(
    @Param('id') packageId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: any,
    @Query('room_type_id') roomTypeId?: string
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorPackageService.getPropertyCalendarSummary(
        packageId,
        user_id,
        new Date(startDate),
        new Date(endDate),
        roomTypeId
      );
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
