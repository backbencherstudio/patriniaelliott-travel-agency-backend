import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorPackageDto } from './dto/create-vendor-package.dto';
import { Express } from 'express';
import appConfig from '../../../config/app.config';

@Injectable()
export class VendorPackageService {
  constructor(private readonly prisma: PrismaService) {}

  async getVendorPackage(page: number, limit: number, user_id: string) {
    const skip = (page - 1) * limit;
  
    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        where: {
          user_id: user_id 
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              display_name: true,
              avatar: true,
              created_at: true
            }
          },
          // Add this to include package files
          package_files: {
            where: {
              deleted_at: null // Only get active files
            },
            orderBy: {
              sort_order: 'asc'
            }
          }
        },
      }),
      this.prisma.package.count({
        where: {
          user_id: user_id
        }
      }),
    ]);
  
    // Process the data to add full file URLs
    const processedData = data.map(pkg => ({
      ...pkg,
      package_files: pkg.package_files.map(file => ({
        ...file,
        file_url: `${appConfig().storageUrl.rootUrl}/${appConfig().storageUrl.package}/${file.file}`
      }))
    }));

    return {
      data: processedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getVendorIdWise(user_id: string) {
    console.log('Searching for user_id:', user_id);
  
    const data = await this.prisma.package.findUnique({
      where: {
        id: user_id  
      },
      include: {
        // Add this to include package files
        package_files: {
          where: {
            deleted_at: null
          },
          orderBy: {
            sort_order: 'asc'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            display_name: true,
            avatar: true
          }
        }
      }
    });
  
    // Process the data to add full file URLs
    const processedData = data ? {
      ...data,
      package_files: data.package_files.map(file => ({
        ...file,
        file_url: `${appConfig().storageUrl.rootUrl}/${appConfig().storageUrl.package}/${file.file}`
      }))
    } : null;

    console.log('Found packages:', processedData);
    return {
      success: true,
      data: processedData,
    };
  }

  async create(createVendorPackageDto: CreateVendorPackageDto, userId: string) {
    // Check if user exists
    const userData = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      throw new Error('User not found');
    }

    // Remove user_id from DTO before passing to Prisma
    const { user_id, ...rest } = createVendorPackageDto;
    const data:any={
        ...rest,
        user: { connect: { id: userId } },
    }

    const vendorPackage = await this.prisma.package.create({ data });

    return {
      success: true,
      data: vendorPackage,
    };
  }

  async updateVendorPackage(packageId: string, userId: string, updateVendorPackageDto: any) {
    try {
      const packageData = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: userId
        }
      });
  
      if (!packageData) {
        throw new Error('Package not found or you do not have permission to update it');
      }
      const updatedPackage = await this.prisma.package.update({
        where: {
          id: packageId
        },
        data: updateVendorPackageDto
      });
  
      return {
        success: true,
        message: 'Package updated successfully',
        data: updatedPackage
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async deleteVendorPackage(packageId: string, userId: string) {
    try {
      const packageData = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: userId
        }
      });
  
      if (!packageData) {
        throw new Error('Package not found or you do not have permission to delete it');
      }
  
      await this.prisma.package.delete({
        where: {
          id: packageId
        }
      });
  
      return {
        success: true,
        message: 'Package deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // New method for creating with files
  async createWithFiles(
    createVendorPackageDto: CreateVendorPackageDto, 
    user_id: string,
    files: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    }
  ) {
    try {
      // Process file URLs
      const package_files = files.package_files?.map(file => file.filename) || [];
      const trip_plans_images = files.trip_plans_images?.map(file => file.filename) || [];

      // Create package with file data
      const result = await this.prisma.package.create({
        data: {
          name: createVendorPackageDto.name,
          description: createVendorPackageDto.description,
          price: createVendorPackageDto.price,
          user: { connect: { id: user_id } },
          package_files: {
            create: [
              ...package_files.map(filename => ({
                file: filename,
                type: 'package_file',
                file_alt: `Package file: ${filename}`,
                sort_order: 0,
                is_featured: false
              })),
              ...trip_plans_images.map(filename => ({
                file: filename,
                type: 'trip_plan',
                file_alt: `Trip plan: ${filename}`,
                sort_order: 0,
                is_featured: false
              }))
            ]
          }
        },
        include: {
          package_files: true,
          user: true
        }
      });

      return {
        success: true,
        data: result,
        message: 'Package created successfully with files',
      };
    } catch (error) {
      throw new Error(`Failed to create package: ${error.message}`);
    }
  }

  // New method for updating with files
  async updateWithFiles(
    packageId: string,
    user_id: string,
    updateVendorPackageDto: CreateVendorPackageDto,
    files: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    }
  ) {
    try {
      // Check if package exists and belongs to user
      const existingPackage = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: user_id,
        },
      });

      if (!existingPackage) {
        throw new Error('Package not found or access denied');
      }

      // Process file URLs
      const package_files = files.package_files?.map(file => file.filename) || [];
      const trip_plans_images = files.trip_plans_images?.map(file => file.filename) || [];

      // Update package with file data
      const result = await this.prisma.package.update({
        where: { id: packageId },
        data: {
          ...updateVendorPackageDto,
          // Update package files
          package_files: {
            deleteMany: {}, // Delete existing files
            create: [
              ...package_files.map(filename => ({
                file: filename,
                type: 'package_file',
                file_alt: `Package file: ${filename}`,
                sort_order: 0,
                is_featured: false
              })),
              ...trip_plans_images.map(filename => ({
                file: filename,
                type: 'trip_plan',
                file_alt: `Trip plan: ${filename}`,
                sort_order: 0,
                is_featured: false
              }))
            ]
          }
        },
        include: {
          package_files: true,
          user: true
        }
      });

      return {
        success: true,
        data: result,
        message: 'Package updated successfully with files',
      };
    } catch (error) {
      throw new Error(`Failed to update package: ${error.message}`);
    }
  }
}
