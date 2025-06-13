import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';

@ApiBearerAuth()
@ApiTags('Coupon')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @ApiOperation({ summary: 'Create coupon' })
  @Post()
  async create(@Body() createCouponDto: CreateCouponDto) {
    try {
      const coupon = await this.couponService.create(createCouponDto);
      return coupon;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get all coupons' })
  @Get()
  async findAll(@Query() query: { q?: string; status?: number }) {
    try {
      const searchQuery = query.q;
      const status = query.status;

      const coupons = await this.couponService.findAll({
        q: searchQuery,
        status: status,
      });
      return coupons;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get a coupon by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const coupon = await this.couponService.findOne(id);
      return coupon;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update a coupon' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    try {
      const coupon = await this.couponService.update(id, updateCouponDto);
      return coupon;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete a coupon' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const coupon = await this.couponService.remove(id);
      return coupon;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
