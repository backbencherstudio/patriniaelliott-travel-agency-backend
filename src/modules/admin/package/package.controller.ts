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
  Req,
  ParseFilePipe,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Express, Request } from 'express';
import { diskStorage } from 'multer';
import appConfig from '../../../config/app.config';
@ApiBearerAuth()
@ApiTags('Package')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/package')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Create package' })
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'package_files' }, { name: 'trip_plans_images' }],
      {
        storage: diskStorage({
          destination:
            appConfig().storageUrl.rootUrl +
            '/' +
            appConfig().storageUrl.package,
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${file.originalname}`);
          },
        }),
      },
    ),
  )
  async create(
    @Req() req: Request,
    @Body() createPackageDto: CreatePackageDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          // support all image types
          // new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    files: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    },
  ) {
    try {
      const user_id = req.user.userId;
      const record = await this.packageService.create(
        user_id,
        createPackageDto,
        files,
      );
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get all packages' })
  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: { q?: string; vendor_id?: string },
  ) {
    try {
      const user_id = req.user.userId;
      const vendor_id = query.vendor_id;

      const packages = await this.packageService.findAll(user_id, vendor_id);

      return packages;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get package by id' })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const record = await this.packageService.findOne(id, user_id);
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Update package' })
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'package_files' }, { name: 'trip_plans_images' }],
      {
        storage: diskStorage({
          destination:
            appConfig().storageUrl.rootUrl +
            '/' +
            appConfig().storageUrl.package,
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${file.originalname}`);
          },
        }),
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
    @Req() req: Request,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          // support all image types
          // new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    files: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    },
  ) {
    try {
      const user_id = req.user.userId;
      const record = await this.packageService.update(
        id,
        user_id,
        updatePackageDto,
        files,
      );
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Update package status' })
  @Patch(':id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { status: number },
  ) {
    try {
      const user_id = req.user.userId;
      const record = await this.packageService.updateStatus(
        id,
        body.status,
        user_id,
      );

      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve package by id' })
  @Patch('approve/:id')
  async approve(@Param('id') id: string) {
    try {
      const record = await this.packageService.approve(id);
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject package by id' })
  @Patch('reject/:id')
  async reject(@Param('id') id: string) {
    try {
      const record = await this.packageService.reject(id);
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Delete package' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.packageService.remove(id);
      return {
        success: true,
        message: 'Package deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
