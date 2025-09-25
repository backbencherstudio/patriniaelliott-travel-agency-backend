import { Controller, Get, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('Reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ 
    summary: 'Get all reviews with filtering',
    description: 'Get reviews with status filtering (all, approved, pending, rejected) and date range filtering'
  })
  @Get()
  async findAll(@Query() query: any) {
    try {
      const {
        status = 'all',
        date_range = 'all',
        page = 1,
        limit = 10,
        search = ''
      } = query;

      const reviews = await this.reviewsService.findAll({
        status,
        date_range,
        page: Number(page),
        limit: Number(limit),
        search
      });
      return reviews;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: 'Get review statistics',
    description: 'Get average review, total feedback count, and overall satisfaction metrics'
  })
  @Get('statistics')
  async getStatistics() {
    try {
      const statistics = await this.reviewsService.getStatistics();
      return statistics;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: 'Get detailed property review information',
    description: 'Get comprehensive property details with review, including property images, ratings, pricing, reviewer information, and feedback actions'
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const review = await this.reviewsService.findOne(id);
      return review;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: 'Update review status',
    description: 'Approve, reject, or update review status'
  })
  @Get(':id/status')
  async updateStatus(@Param('id') id: string, @Query() query: any) {
    try {
      const { status } = query;
      const result = await this.reviewsService.updateStatus(id, status);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: 'Delete review',
    description: 'Permanently delete a review'
  })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.reviewsService.remove(id);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
