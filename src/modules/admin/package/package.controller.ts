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
  Res,
  ParseFilePipe,
  UploadedFiles,
  Query,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { AnyFilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { Express, Request, Response } from 'express';
import { diskStorage } from 'multer';
import appConfig from '../../../config/app.config';
import * as fs from 'fs';
import * as path from 'path';
@ApiBearerAuth()
@ApiTags('Package')
@Controller('admin/package')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  /**
   * Ensure storage directories exist
   */
  private ensureStorageDirectories() {
    try {     
      
      const storagePath = process.env.NODE_ENV === 'production' 
              ? path.join(process.cwd(), '..', 'public', 'storage', 'package')  // Production: /usr/src/app/public/storage/package (go up from dist to public)
              : path.join(process.cwd(), 'public', 'storage', 'package')         // Development: /project/public/storage/package;
      
      
      
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      } else {
      }
      
      // Test write permissions
      try {
        const testFile = path.join(storagePath, 'test-write.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (writeError) {
        console.error('❌ [STORAGE DEBUG] Write permissions test: FAILED', writeError);
      }
      
    } catch (error) {
      console.error('❌ [STORAGE DEBUG] Failed to create storage directories:', error);
      throw new InternalServerErrorException('Failed to initialize storage system');
    }
  }

  /**
   * Clean up uploaded files on error
   */
  private cleanupUploadedFiles(files: {
    package_files?: Express.Multer.File[];
    trip_plans_images?: Express.Multer.File[];
  }) {
    try {
      const storagePath = process.env.NODE_ENV === 'production' 
              ? path.join(process.cwd(), '..', 'public', 'storage', 'package')  // Production: /usr/src/app/public/storage/package (go up from dist to public)
              : path.join(process.cwd(), 'public', 'storage', 'package')         // Development: /project/public/storage/package;
      
      if (files.package_files) {
        for (const file of files.package_files) {
          const filePath = path.join(storagePath, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
      
      if (files.trip_plans_images) {
        for (const file of files.trip_plans_images) {
          const filePath = path.join(storagePath, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup uploaded files:', error);
    }
  }

  /**
   * Add full URLs to package images
   */
  private addImageUrls(packageData: any) {
    try {
      const baseUrl = process.env.APP_URL || 'http://localhost:4000';
      
      // Add URLs to package files
      if (packageData.package_files && packageData.package_files.length > 0) {
        packageData.package_files.forEach((file, index) => {
          if (file.file) {         
            // Encode the filename to handle special characters and spaces
            const encodedFilename = encodeURIComponent(file.file);
            file.file_url = `${baseUrl}/public/storage/package/${encodedFilename}`;
          } else {
          }
        });
      }
      
      // Add URLs to trip plan images
      if (packageData.package_trip_plans && packageData.package_trip_plans.length > 0) {
        packageData.package_trip_plans.forEach((tripPlan, tripIndex) => {
          if (tripPlan.package_trip_plan_images && tripPlan.package_trip_plan_images.length > 0) {
            tripPlan.package_trip_plan_images.forEach((image, imgIndex) => {
              if (image.image) {
                
                // Encode the filename to handle special characters and spaces
                const encodedFilename = encodeURIComponent(image.image);
                image.image_url = `${baseUrl}/public/storage/package/${encodedFilename}`;
              } else {
              }
            });
          }
        });
      }
      
      return packageData;
    } catch (error) {
      console.error('Failed to add image URLs:', error);
      return packageData;
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create package' })
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {        
            
            // Ensure storage directories exist
            const storagePath = process.env.NODE_ENV === 'production' 
              ? path.join(process.cwd(), '..', 'public', 'storage', 'package')  // Production: /usr/src/app/public/storage/package (go up from dist to public)
              : path.join(process.cwd(), 'public', 'storage', 'package')         // Development: /project/public/storage/package;
            
            
            try {
              if (!fs.existsSync(storagePath)) {
                fs.mkdirSync(storagePath, { recursive: true });
              } else {
              }
              
              // Test write permissions
              const testFile = path.join(storagePath, 'test-write-permission.txt');
              fs.writeFileSync(testFile, 'test');
              fs.unlinkSync(testFile);
              cb(null, storagePath);
            } catch (error) {
              console.error('❌ [MULTER DEBUG] Error in destination callback:', error);
              cb(error, null);
            }
          },
          filename: (req, file, cb) => {
            // Generate unique filename with timestamp and clean name
            const timestamp = Date.now();
            const randomName = Array(16)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            const extension = path.extname(file.originalname);
            
            // Clean the original filename to remove special characters and spaces
            const cleanOriginalName = file.originalname
              .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
              .replace(/_+/g, '_') // Replace multiple underscores with single
              .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
            
            const filename = `${timestamp}_${randomName}_${cleanOriginalName}`;
            cb(null, filename);
          },
        }),
      fileFilter: (req, file, cb) => {
          // Validate file types
          const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
          ];
          
          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new BadRequestException(`Invalid file type: ${file.mimetype}. Only images are allowed.`), false);
          }
        },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 30 // Allow more files across dynamic fields
      }
    }),
  )
  async create(
    @Req() req: Request,
    @Body() createPackageDto: CreatePackageDto,
    @UploadedFiles(new ParseFilePipe({ validators: [], fileIsRequired: false, errorHttpStatusCode: 400 }))
    uploadedFiles: Express.Multer.File[],
  ) {
    try {
      
      
      // Ensure storage directories exist
      this.ensureStorageDirectories();
      
      // Normalize bedrooms payload to expected JSON string
      if (createPackageDto && (createPackageDto as any).bedrooms !== undefined) {
        try {
          let parsedBedrooms: any = null;
          if (typeof (createPackageDto as any).bedrooms === 'string') {
            parsedBedrooms = JSON.parse((createPackageDto as any).bedrooms as unknown as string);
          } else {
            parsedBedrooms = (createPackageDto as any).bedrooms;
            (createPackageDto as any).bedrooms = JSON.stringify(
              (createPackageDto as any).bedrooms,
            );
          }

          // Compute total_bedrooms from bedrooms array when available
          if (Array.isArray(parsedBedrooms)) {
            const computedTotal = parsedBedrooms.length;

            // Coerce incoming total_bedrooms to number if it came as string
            if ((createPackageDto as any).total_bedrooms != null && typeof (createPackageDto as any).total_bedrooms === 'string') {
              const coerced = Number((createPackageDto as any).total_bedrooms);
              if (!Number.isNaN(coerced)) {
                (createPackageDto as any).total_bedrooms = coerced as any;
              }
            }

            // If not provided or mismatch, set the correct value
            if (
              (createPackageDto as any).total_bedrooms == null ||
              (createPackageDto as any).total_bedrooms !== computedTotal
            ) {
              (createPackageDto as any).total_bedrooms = computedTotal as any;
            }
          } else {
            throw new Error('bedrooms must be an array');
          }
        } catch (err) {
          throw new BadRequestException(
            'Invalid bedrooms format. Provide valid JSON (array of bedroom objects).',
          );
        }
      }

      // Group uploaded files by field name and validate
      const grouped: { 
        package_files?: Express.Multer.File[]; 
        trip_plans_images?: Express.Multer.File[]; 
        trip_plans_by_index?: Record<number, Express.Multer.File[]>;
      } = { trip_plans_by_index: {} } as any;

      if (Array.isArray(uploadedFiles)) {
        for (const f of uploadedFiles) {
          if (!f.mimetype.startsWith('image/')) {
            throw new BadRequestException(`Invalid file type: ${f.originalname}. Only images are allowed.`);
          }
          if (f.fieldname === 'package_files') {
            (grouped.package_files ??= []).push(f);
          } else if (f.fieldname === 'trip_plans_images') {
            (grouped.trip_plans_images ??= []).push(f);
          } else {
            const match = /^trip_plans_(\d+)_images$/.exec(f.fieldname);
            if (match) {
              const idx = Number(match[1]);
              (grouped.trip_plans_by_index[idx] ??= []).push(f);
            }
          }
        }
      }

      const user_id = req.user.userId;
      let record = await this.packageService.create(
        user_id,
        createPackageDto,
        grouped as any,
      );
      // Enrich with image URLs like in findOne/findAll and attach computed price
      if (record && record.success && record.data) {
        record.data = this.addImageUrls(record.data);
        const pkg: any = record.data as any;
        const basePrice = Number(pkg.price ?? 0);
        const discountPercent = Number(pkg.discount ?? 0);
        const fee = Number(pkg.service_fee ?? 0);
        const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
        const computed_price = discounted + (isNaN(fee) ? 0 : fee);
        record.data = { ...pkg, computed_price } as any;
      }
      return record;
    } catch (error) {
      console.error('Package creation error:', error);
      
      // Clean up uploaded files on error
      try {
        const storagePath = path.join(process.cwd(), 'public', 'storage', 'package');
        console.log('-----------storagePath---------------------');
        console.log(storagePath);
        console.log('--------------------------------');
        
        if (Array.isArray(uploadedFiles)) {
          for (const f of uploadedFiles) {
            const filePath = path.join(storagePath, f.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        }
      } catch (cleanupErr) {
        console.error('Failed during error cleanup:', cleanupErr);
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      return {
        success: false,
        message: error.message || 'Failed to create package',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all packages' })
  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: { q?: string; vendor_id?: string; type?: string },
  ) {
    try {
      const user_id = req.user.userId;
      const vendor_id = query.vendor_id;
      const filters = {
        q: query.q,
        type: query.type
      };

      const packages = await this.packageService.findAll(user_id, vendor_id, filters);

      // Add full URLs to images for all packages
      if (packages.success && packages.data && Array.isArray(packages.data)) {
        packages.data = packages.data.map(pkg => this.addImageUrls(pkg));
      }

      return packages;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get packages by current user with pagination' })
  @Get('my-packages')
  async getMyPackages(
    @Req() req: Request,
    @Query() query: { 
      q?: string; 
      type?: string; 
      status?: number;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    },
  ) {
    try {
      const user_id = req.user.userId;
      
      // Pagination parameters
      const page = Math.max(1, parseInt(query.page?.toString()) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(query.limit?.toString()) || 10)); // Max 50 items per page
      const skip = (page - 1) * limit;
      
      // Sorting parameters
      const sort_by = query.sort_by || 'created_at';
      const sort_order = query.sort_order || 'desc';
      
      // Validate sort fields to prevent injection
      const allowedSortFields = ['created_at', 'updated_at', 'name', 'price', 'status'];
      const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
      
      const filters = {
        q: query.q,
        type: query.type
      };

      // Always filter by current user - ensure data isolation
      const where_condition: any = { 
        user_id: user_id,  // Always restrict to current user
        deleted_at: null   // Only show non-deleted packages
      };
      
      if (query.status !== undefined) {
        where_condition.status = parseInt(query.status.toString());
      }
      
      const testPackages = await this.packageService.findAll(user_id, null, {}, { user_id, deleted_at: null });
      
      // If no packages found, let's try without the deleted_at filter
      if (testPackages.success && testPackages.data?.length === 0) {
        const testPackages2 = await this.packageService.findAll(user_id, null, {}, { user_id });
      }

      // Try the pagination method first, fallback to regular findAll if it fails
      let packages;
      try {
        packages = await this.packageService.findAllWithPagination(
          user_id, 
          null, 
          filters, 
          where_condition,
          {
            page,
            limit,
            skip,
            sort_by: validSortBy,
            sort_order
          }
        );
      } catch (paginationError) {
        // Fallback to regular findAll and add pagination manually
        const allPackages = await this.packageService.findAll(user_id, null, filters, where_condition);
        
        if (allPackages.success && allPackages.data) {
          const totalCount = allPackages.data.length;
          const totalPages = Math.ceil(totalCount / limit);
          const hasNextPage = page < totalPages;
          const hasPrevPage = page > 1;
          
          // Apply pagination manually
          const startIndex = skip;
          const endIndex = skip + limit;
          const paginatedData = allPackages.data.slice(startIndex, endIndex);
          
          packages = {
            success: true,
            data: paginatedData,
            pagination: {
              current_page: page,
              total_pages: totalPages,
              total_items: totalCount,
              items_per_page: limit,
              has_next_page: hasNextPage,
              has_prev_page: hasPrevPage,
              next_page: hasNextPage ? page + 1 : null,
              prev_page: hasPrevPage ? page - 1 : null,
            },
          };
        } else {
          packages = allPackages;
        }
      }

      // Add full URLs to images for all packages
      if (packages.success && (packages as any).data && Array.isArray((packages as any).data)) {
        (packages as any).data = (packages as any).data.map((pkg: any) => this.addImageUrls(pkg));
      }

      return packages;
    } catch (error) {
      console.error('Error fetching user packages:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get package by id' })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const record = await this.packageService.findOne(id, user_id);
      
      // Add full URLs to images if package exists
      if (record.success && record.data) {
        record.data = this.addImageUrls(record.data);
      }
      
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get package images' })
  @Get(':id/images')
  async getPackageImages(@Param('id') id: string, @Req() req: Request) {
    try {
      const user_id = req.user.userId;
      const record = await this.packageService.findOne(id, user_id);
      
      if (!record.success || !record.data) {
        return {
          success: false,
          message: 'Package not found',
        };
      }
      
      // Extract only image information with URLs
      const images = {
        package_files: [],
        trip_plan_images: []
      };
      
      // if (record.data.package_files && record.data.package_files.length > 0) {
      //   images.package_files = record.data.package_files.map((file: any) => ({
      //     id: file.id,
      //     filename: file.file,
      //     original_name: file.file_alt || file.originalname || 'Unknown',
      //     type: file.type || 'image',
      //     url: `${process.env.APP_URL || 'http://localhost:4000'}/storage/package/${encodeURIComponent(file.file)}`
      //   }));
      // }
      
      // if (record.data.package_trip_plans && record.data.package_trip_plans.length > 0) {
      //   record.data.package_trip_plans.forEach((tripPlan: any) => {
      //     if (tripPlan.package_trip_plan_images && tripPlan.package_trip_plan_images.length > 0) {
      //       tripPlan.package_trip_plan_images.forEach((image: any) => {
      //         images.trip_plan_images.push({
      //           id: image.id,
      //           filename: image.image,
      //           original_name: image.image_alt || image.originalname || 'Unknown',
      //           trip_plan_title: tripPlan.title,
      //           url: `${process.env.APP_URL || 'http://localhost:4000'}/storage/package/${encodeURIComponent(image.image)}`
      //         });
      //       });
      //     }
      //   });
      // }
      
      return {
        success: true,
        data: images
      };
      
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
            
            // Ensure storage directories exist
            const storagePath = process.env.NODE_ENV === 'production' 
              ? path.join(process.cwd(), '..', 'public', 'storage', 'package')  // Production: /usr/src/app/public/storage/package (go up from dist to public)
              : path.join(process.cwd(), 'public', 'storage', 'package')
            
            try {
              if (!fs.existsSync(storagePath)) {
                fs.mkdirSync(storagePath, { recursive: true });
              } else {
              }
              
              // Test write permissions
              const testFile = path.join(storagePath, 'test-write-permission.txt');
              fs.writeFileSync(testFile, 'test');
              fs.unlinkSync(testFile);
              cb(null, storagePath);
            } catch (error) {
              console.error('❌ [MULTER DEBUG] Error in destination callback:', error);
              cb(error, null);
            }
          },
          filename: (req, file, cb) => {
            // Generate unique filename with timestamp and clean name
            const timestamp = Date.now();
            const randomName = Array(16)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            const extension = path.extname(file.originalname);
            
            // Clean the original filename to remove special characters and spaces
            const cleanOriginalName = file.originalname
              .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
              .replace(/_+/g, '_') // Replace multiple underscores with single
              .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
            
            const filename = `${timestamp}_${randomName}_${cleanOriginalName}`;
            cb(null, filename);
          },
        }),
      fileFilter: (req, file, cb) => {
          // Validate file types
          const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
          ];
          
          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new BadRequestException(`Invalid file type: ${file.mimetype}. Only images are allowed.`), false);
          }
        },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 30 // Allow more files across dynamic fields
      }
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
    @Req() req: Request,
    @UploadedFiles(new ParseFilePipe({ validators: [], fileIsRequired: false, errorHttpStatusCode: 400 }))
    uploadedFiles: Express.Multer.File[],
  ) {
    try {
      // Ensure storage directories exist
      this.ensureStorageDirectories();
      
      // Group uploaded files by field name and validate
      const grouped: { 
        package_files?: Express.Multer.File[]; 
        trip_plans_images?: Express.Multer.File[]; 
        trip_plans_by_index?: Record<number, Express.Multer.File[]>;
      } = { trip_plans_by_index: {} } as any;

      if (Array.isArray(uploadedFiles)) {
        for (const f of uploadedFiles) {
          if (!f.mimetype.startsWith('image/')) {
            throw new BadRequestException(`Invalid file type: ${f.originalname}. Only images are allowed.`);
          }
          if (f.fieldname === 'package_files') {
            (grouped.package_files ??= []).push(f);
          } else if (f.fieldname === 'trip_plans_images') {
            (grouped.trip_plans_images ??= []).push(f);
          } else {
            const match = /^trip_plans_(\d+)_images$/.exec(f.fieldname);
            if (match) {
              const idx = Number(match[1]);
              (grouped.trip_plans_by_index[idx] ??= []).push(f);
            }
          }
        }
      }

      const user_id = req.user.userId;
      const record = await this.packageService.update(
        id,
        user_id,
        updatePackageDto,
        grouped as any,
      );
      return record;
    } catch (error) {
      console.error('Package update error:', error);
      
      // Clean up uploaded files on error
      try {
        const storagePath = process.env.NODE_ENV === 'production' 
          ? path.join(process.cwd(), '..', 'public', 'storage', 'package')  // Production: /usr/src/app/public/storage/package (go up from dist to public)
          : path.join(process.cwd(), 'public', 'storage', 'package');         // Development: /project/public/storage/package;
        if (Array.isArray(uploadedFiles)) {
          for (const f of uploadedFiles) {
            const filePath = path.join(storagePath, f.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        }
      } catch (cleanupErr) {
        console.error('Failed during error cleanup:', cleanupErr);
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      return {
        success: false,
        message: error.message || 'Failed to update package',
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
