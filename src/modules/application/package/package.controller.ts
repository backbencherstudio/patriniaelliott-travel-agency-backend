import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackageService } from './package.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QueryPackageDto } from './dto/query-package.dto';
import { UpdateReviewDto } from 'src/modules/admin/reviews/dto/update-review.dto';
import { SearchPackagesDto } from '../../admin/vendor-package/dto/search-packages.dto';
import { EnhancedSearchDto } from './dto/enhanced-search.dto';
import { GetVendorPackageDto } from '../../admin/vendor-package/dto/get-vendor-package.dto';
import { CalendarQueryDto } from '../../admin/vendor-package/dto/calendar-availability.dto';

@ApiTags('Package')
@Controller('application/packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) { }

  @ApiOperation({ summary: 'Search and discover packages' })
  @Get('search')
  async searchPackages(@Query() searchDto: SearchPackagesDto) {
    try {
      return await this.packageService.searchPackages(searchDto);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Enhanced search with advanced filters (location, name, budget, ratings, etc.)' })
  @Get('enhanced-search')
  async enhancedSearch(@Query() searchDto: EnhancedSearchDto) {
    try {
      console.log('Enhanced search request:', searchDto);
      const result = await this.packageService.enhancedSearch(searchDto);
      // console.log('Enhanced search result count:', result.data?.packages?.length || 0);
      return result;
    } catch (error) {
      console.error('Enhanced search error:', error);
      return {
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  @ApiOperation({ summary: 'Debug cancellation policies' })
  @Get('debug-cancellation')
  async debugCancellationPolicies() {
    try {
      return await this.packageService.debugCancellationPolicies();
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Debug budget filtering' })
  @Get('debug-budget')
  async debugBudgetFiltering(@Query('budget_start') budget_start?: string, @Query('budget_end') budget_end?: string) {
    try {
      const budgetStart = budget_start ? Number(budget_start) : undefined;
      const budgetEnd = budget_end ? Number(budget_end) : undefined;
      return await this.packageService.debugBudgetFiltering(budgetStart, budgetEnd);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // @ApiOperation({ summary: 'Get all packages' })
  // @Get()
  // async findAll(@Query() query: QueryPackageDto) {
  //   try {
  //     const q = query.q;
  //     const type = query.type;
  //     const duration_start = query.duration_start;
  //     const duration_end = query.duration_end;
  //     const budget_start = query.budget_start;
  //     const budget_end = query.budget_end;
  //     const ratings = query.ratings;
  //     const free_cancellation = query.free_cancellation;
  //     const destinations = query.destinations;
  //     const languages = query.languages;

  //     const packages = await this.packageService.findAll({
  //       filters: {
  //         q: q,
  //         type: type,
  //         duration_start: duration_start,
  //         duration_end: duration_end,
  //         budget_start: budget_start,
  //         budget_end: budget_end,
  //         ratings: ratings,
  //         free_cancellation: free_cancellation,
  //         destinations: destinations,
  //         languages: languages,
  //       },
  //     });
  //     return packages;
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: error.message,
  //     };
  //   }
  // }

  @ApiOperation({
    summary: 'Get vendor packages with enhanced search capabilities',
    description: 'Search packages by name, description, country, location, destination, and other filters. Supports pagination and calendar data.'
  })
  @Get()
  async getVendorPackage(
    @Query() query: GetVendorPackageDto & CalendarQueryDto,
    @Req() req: any
  ) {
    try {
      const page = parseInt(query.page?.toString() || '1', 10);
      const limit = parseInt(query.limit?.toString() || '10', 10);
      const user_id = req.user?.userId || null;

      // Debug logging for rating parameter
      console.log('Ratings parameter received:', (query as any).ratings);
      console.log('Query object:', query);

      // Handle multiple type parameters
      const types = Array.isArray(query.type) ? query.type :
        (typeof query.type === 'string' && query.type.includes(',')) ?
          query.type.split(',').map(t => t.trim()) :
          query.type ? [query.type] : undefined;

      return await this.packageService.getVendorPackage(
        page,
        limit,
        user_id,
        {
          searchQuery: query.q,
          country: (query as any).country,
          location: (query as any).location,
          status: query.status,
          categoryId: query.category_id,
          destinationId: query.destination_id,
          type: types,
          freeCancellation: query.free_cancellation,
          languages: query.languages,
          ratings: (query as any).ratings,
          budgetEnd: query.budget_end,
          budgetStart: query.budget_start,
          durationEnd: query.duration_end,
          durationStart: query.duration_start
        }
      );
    } catch (error) {
      console.error('Error in getVendorPackage:', error);
      return {
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  @ApiOperation({
    summary: ''
  })
  @Get('/top-destinations')
  async topLocation() {
    return await this.packageService.topLocations()
  }

  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get package by id' })
  @Get('package/:id')
  async findOne(@Param('id') id: string) {
    try {
      const record = await this.packageService.findOne(id);
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add review to package' })
  @Post(':id/review')
  async createReview(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    try {
      const user_id = req.user.userId;
      const review = await this.packageService.createReview(
        id,
        user_id,
        createReviewDto,
      );
      return review;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // update review
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review' })
  @Patch(':id/review/:review_id')
  async updateReview(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('review_id') review_id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    try {
      const user_id = req.user.userId;
      const review = await this.packageService.updateReview(
        id,
        review_id,
        user_id,
        updateReviewDto,
      );
      return review;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove review from package' })
  @Delete(':id/review/:review_id')
  async removeReview(
    @Param('id') id: string,
    @Param('review_id') review_id: string,
    @Req() req: Request,
  ) {
    try {
      const user_id = req.user.userId;
      const review = await this.packageService.removeReview(
        id,
        review_id,
        user_id,
      );
      return review;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
