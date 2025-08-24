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

@ApiTags('VendorPackage')
@Controller('admin/vendor-package')
export class VendorPackageController {
  constructor(private readonly vendorPackageService: VendorPackageService) {}

  @ApiOperation({ summary: 'get vendor package' })
  @Get()
  async getVendorPackage(@Query() query: GetVendorPackageDto, @Req() req: any) {
    const page = parseInt(query.page?.toString() || '1', 10);
    const limit = parseInt(query.limit?.toString() || '10', 10);
    const user_id = req.user?.userId || null; // Make user_id optional
    return this.vendorPackageService.getVendorPackage(
      page, 
      limit, 
      user_id, 
      { 
        searchQuery: query.q, 
        status: query.status, 
        categoryId: query.category_id, 
        destinationId: query.destination_id,
        type: query.type,
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

  @ApiOperation({ summary: 'get vendor package by id' })
  @Get(':id')
  async getVendorIdWise(@Param('id') id: string) {  
    const user_id = id;
    return this.vendorPackageService.getVendorIdWise(user_id);
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
  async create(
    @Req() req: Request,
    @Body() createVendorPackageDto: CreateVendorPackageDto,
    @UploadedFiles()
    files?: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
      room_photos?: Express.Multer.File[]; // Add room_photos files
    },
  ) {
    try {
      const user_id = req.user.userId;
      console.log('User ID:', user_id);
      console.log('Files received:', {
        package_files: files?.package_files?.length || 0,
        trip_plans_images: files?.trip_plans_images?.length || 0,
        room_photos: files?.room_photos?.length || 0
      });
      
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
}
