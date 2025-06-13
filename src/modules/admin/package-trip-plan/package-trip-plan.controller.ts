import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackageTripPlanService } from './package-trip-plan.service';
import { CreatePackageTripPlanDto } from './dto/create-package-trip-plan.dto';
import { UpdatePackageTripPlanDto } from './dto/update-package-trip-plan.dto';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { diskStorage } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import appConfig from 'src/config/app.config';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Package Trip Plan')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/package/:package_id/package-trip-plan')
export class PackageTripPlanController {
  constructor(
    private readonly packageTripPlanService: PackageTripPlanService,
  ) {}

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Create package trip plan' })
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.package,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${file.originalname}`);
        },
      }),
    }),
  )
  async create(
    @Req() req: Request,
    @Param('package_id') package_id: string,
    @Body() createPackageTripPlanDto: CreatePackageTripPlanDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 10485760 }), // 10mb
          // new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    images?: Express.Multer.File[],
  ) {
    try {
      // const user_id = req.user.userId;
      const trip_plan = await this.packageTripPlanService.create(
        package_id,
        createPackageTripPlanDto,
        images,
      );

      return trip_plan;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get all package trip plans' })
  @Get()
  async findAll() {
    try {
      const package_trip_plans = await this.packageTripPlanService.findAll();
      return {
        success: true,
        data: package_trip_plans,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get a package trip plan' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Param('package_id') package_id: string,
  ) {
    try {
      const package_trip_plan = await this.packageTripPlanService.findOne(
        id,
        package_id,
      );
      return package_trip_plan;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Update a package trip plan' })
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.package,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${file.originalname}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Param('package_id') package_id: string,
    @Body() updatePackageTripPlanDto: UpdatePackageTripPlanDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 10485760 }), // 10mb
          // new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    images?: Express.Multer.File[],
  ) {
    try {
      const package_trip_plan = await this.packageTripPlanService.update(
        id,
        package_id,
        updatePackageTripPlanDto,
        images,
      );
      return package_trip_plan;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Delete a package trip plan' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Param('package_id') package_id: string,
  ) {
    try {
      const package_trip_plan = await this.packageTripPlanService.remove(
        id,
        package_id,
      );
      return {
        success: true,
        data: package_trip_plan,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
