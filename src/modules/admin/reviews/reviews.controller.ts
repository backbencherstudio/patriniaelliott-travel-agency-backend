import { Controller, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VENDOR)
@Controller('admin/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiResponse({ description: 'Get all reviews' })
  @Get()
  async findAll(@Req() req: Request) {
    try {
      const user_id = req.user.userId;

      const reviews = await this.reviewsService.findAll(user_id);
      return reviews;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiResponse({ description: 'Get one review' })
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

  @ApiResponse({ description: 'Delete review' })
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
