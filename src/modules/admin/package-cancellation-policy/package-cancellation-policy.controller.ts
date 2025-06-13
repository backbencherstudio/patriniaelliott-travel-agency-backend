import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PackageCancellationPolicyService } from './package-cancellation-policy.service';
import { CreatePackageCancellationPolicyDto } from './dto/create-package-cancellation-policy.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UpdatePackageCancellationPolicyDto } from './dto/update-package-cancellation-policy.dto';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Package Cancellation Policy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VENDOR)
@Controller('admin/package-cancellation-policy')
export class PackageCancellationPolicyController {
  constructor(
    private readonly packageCancellationPolicyService: PackageCancellationPolicyService,
  ) {}

  @ApiOperation({ summary: 'Create package cancellation policy' })
  @Post()
  async create(
    @Req() req: Request,
    @Body()
    createPackageCancellationPolicyDto: CreatePackageCancellationPolicyDto,
  ) {
    try {
      const user_id = req.user.userId;

      const packageCancellationPolicy =
        await this.packageCancellationPolicyService.create(
          user_id,
          createPackageCancellationPolicyDto,
        );
      return packageCancellationPolicy;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get all package cancellation policies' })
  @Get()
  async findAll(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      const packageCancellationPolicies =
        await this.packageCancellationPolicyService.findAll(user_id);
      return packageCancellationPolicies;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get a package cancellation policy by id' })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const packageCancellationPolicy =
        await this.packageCancellationPolicyService.findOne(id, user_id);
      return packageCancellationPolicy;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update a package cancellation policy' })
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    updatePackageCancellationPolicyDto: UpdatePackageCancellationPolicyDto,
  ) {
    try {
      const user_id = req.user.userId;

      const packageCancellationPolicy =
        await this.packageCancellationPolicyService.update(
          id,
          user_id,
          updatePackageCancellationPolicyDto,
        );
      return packageCancellationPolicy;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete a package cancellation policy' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const packageCancellationPolicy =
        await this.packageCancellationPolicyService.remove(id);
      return packageCancellationPolicy;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
