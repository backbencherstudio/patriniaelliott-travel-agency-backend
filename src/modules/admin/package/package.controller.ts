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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Express, Request, Response } from 'express';
import { diskStorage } from 'multer';
import appConfig from '../../../config/app.config';
import * as fs from 'fs';
import * as path from 'path';
@ApiBearerAuth()
@ApiTags('Package')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/package')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  /**
   * Ensure storage directories exist
   */
  private ensureStorageDirectories() {
    try {
      const storagePath = path.join(process.cwd(), 'public', 'storage', 'package');
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
        console.log('Created storage directory:', storagePath);
      }
    } catch (error) {
      console.error('Failed to create storage directories:', error);
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
      const storagePath = path.join(process.cwd(), 'public', 'storage', 'package');
      
      if (files.package_files) {
        for (const file of files.package_files) {
          const filePath = path.join(storagePath, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Cleaned up package file:', file.filename);
          }
        }
      }
      
      if (files.trip_plans_images) {
        for (const file of files.trip_plans_images) {
          const filePath = path.join(storagePath, file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Cleaned up trip plan image:', file.filename);
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
            console.log(`📄 File ${index + 1}:`, {
              id: file.id,
              filename: file.file,
              filenameLength: file.file.length,
              originalName: file.file_alt,
              type: file.type
            });
            
            // Check if filename is truncated
            if (file.file.length < 10) {
              console.log(`⚠️  WARNING: Filename seems too short: "${file.file}"`);
            }
            
            // Encode the filename to handle special characters and spaces
            const encodedFilename = encodeURIComponent(file.file);
            file.file_url = `${baseUrl}/public/storage/package/${encodedFilename}`;
          } else {
            console.log(`⚠️  File ${index + 1} missing file property:`, file);
          }
        });
      }
      
      // Add URLs to trip plan images
      if (packageData.package_trip_plans && packageData.package_trip_plans.length > 0) {
        packageData.package_trip_plans.forEach((tripPlan, tripIndex) => {
          if (tripPlan.package_trip_plan_images && tripPlan.package_trip_plan_images.length > 0) {
            tripPlan.package_trip_plan_images.forEach((image, imgIndex) => {
              if (image.image) {
                console.log(`📸 Trip plan ${tripIndex + 1} image ${imgIndex + 1}:`, {
                  id: image.id,
                  filename: image.image,
                  tripPlanTitle: tripPlan.title
                });
                
                // Encode the filename to handle special characters and spaces
                const encodedFilename = encodeURIComponent(image.image);
                image.image_url = `${baseUrl}/public/storage/package/${encodedFilename}`;
                console.log(`🖼️  Generated URL for trip plan image: ${image.image} -> ${image.image_url}`);
              } else {
                console.log(`⚠️  Trip plan ${tripIndex + 1} image ${imgIndex + 1} missing image property:`, image);
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

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Create package' })
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'package_files' }, { name: 'trip_plans_images' }],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            // Ensure storage directories exist
            const storagePath = path.join(process.cwd(), 'public', 'storage', 'package');
            if (!fs.existsSync(storagePath)) {
              fs.mkdirSync(storagePath, { recursive: true });
            }
            cb(null, storagePath);
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
            console.log(`📁 Generated filename: ${filename} from original: ${file.originalname}`);
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
          files: 10 // Maximum 10 files
        }
      },
    ),
  )
  async create(
    @Req() req: Request,
    @Body() createPackageDto: CreatePackageDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: false,
        errorHttpStatusCode: 400,
      }),
    )
    files: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    },
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

      // Validate uploaded files
      if (files.package_files) {
        for (const file of files.package_files) {
          if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException(`Invalid file type: ${file.originalname}. Only images are allowed.`);
          }
        }
      }
      
      if (files.trip_plans_images) {
        for (const file of files.trip_plans_images) {
          if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException(`Invalid file type: ${file.originalname}. Only images are allowed.`);
          }
        }
      }

      const user_id = req.user.userId;
      let record = await this.packageService.create(
        user_id,
        createPackageDto,
        files,
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
      if (files.package_files || files.trip_plans_images) {
        this.cleanupUploadedFiles(files);
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

      // Add full URLs to images for all packages
      if (packages.success && packages.data && Array.isArray(packages.data)) {
        packages.data = packages.data.map(pkg => this.addImageUrls(pkg));
        console.log(`🖼️  Added image URLs to ${packages.data.length} packages`);
      }

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

  @Roles(Role.ADMIN, Role.VENDOR)
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
    FileFieldsInterceptor(
      [{ name: 'package_files' }, { name: 'trip_plans_images' }],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            // Ensure storage directories exist
            const storagePath = path.join(process.cwd(), 'public', 'storage', 'package');
            if (!fs.existsSync(storagePath)) {
              fs.mkdirSync(storagePath, { recursive: true });
            }
            cb(null, storagePath);
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
            console.log(`📁 Generated filename: ${filename} from original: ${file.originalname}`);
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
          files: 10 // Maximum 10 files
        }
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
    @Req() req: Request,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: false,
        errorHttpStatusCode: 400,
      }),
    )
    files: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    },
  ) {
    try {
      // Ensure storage directories exist
      this.ensureStorageDirectories();
      
      // Validate uploaded files
      if (files.package_files) {
        for (const file of files.package_files) {
          if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException(`Invalid file type: ${file.originalname}. Only images are allowed.`);
          }
        }
      }
      
      if (files.trip_plans_images) {
        for (const file of files.trip_plans_images) {
          if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException(`Invalid file type: ${file.originalname}. Only images are allowed.`);
          }
        }
      }

      const user_id = req.user.userId;
      const record = await this.packageService.update(
        id,
        user_id,
        updatePackageDto,
        files,
      );
      return record;
    } catch (error) {
      console.error('Package update error:', error);
      
      // Clean up uploaded files on error
      if (files.package_files || files.trip_plans_images) {
        this.cleanupUploadedFiles(files);
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
