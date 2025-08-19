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
import { GetVendorPackageDto } from './dto/get-vendor-package.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// Import file upload dependencies
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Express, Request } from 'express';
import { diskStorage } from 'multer';
import appConfig from '../../../config/app.config';
import { SearchPackagesDto } from './dto/search-packages.dto';

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
    @Body() createVendorPackageDto: CreateVendorPackageDto,
    @UploadedFiles()
    files?: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    },
  ) {
    try {
      const user_id = req.user.userId;
      console.log(user_id);
      const result = await this.vendorPackageService.createWithFiles(
        createVendorPackageDto, 
        user_id, 
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

  // Update with file upload (from PackageController)
  @ApiOperation({ summary: 'Update vendor package with files' })
  @UseGuards(JwtAuthGuard)
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
            return cb(null, `${randomName}${randomName}${file.originalname}`);
          },
        }),
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

  
}
