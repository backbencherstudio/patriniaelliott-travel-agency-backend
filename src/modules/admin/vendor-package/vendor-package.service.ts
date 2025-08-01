import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorPackageDto } from './dto/create-vendor-package.dto';
import { Express } from 'express';
import appConfig from '../../../config/app.config';
import { SearchPackagesDto } from './dto/search-packages.dto';


@Injectable()
export class VendorPackageService {
  constructor(private readonly prisma: PrismaService) {}

  async getVendorPackage(
    page: number, 
    limit: number, 
    user_id: string, 
    searchParams?: {
      searchQuery?: string;
      status?: number;
      categoryId?: string;
      destinationId?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const where: any = {
      user_id: user_id,
      deleted_at: null
    };

    // Add search functionality
    if (searchParams?.searchQuery) {
      where.OR = [
        { name: { contains: searchParams.searchQuery, mode: 'insensitive' } },
        { description: { contains: searchParams.searchQuery, mode: 'insensitive' } },
      ];
    }

    // Add status filter
    if (searchParams?.status !== undefined) {
      where.status = Number(searchParams.status);
    }

    // Add category filter
    if (searchParams?.categoryId) {
      where.category_id = searchParams.categoryId;
    }

    // Add destination filter
    if (searchParams?.destinationId) {
      where.package_destinations = {
        some: {
          destination_id: searchParams.destinationId
        }
      };
    }
  
    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        where,
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
          },
          // Include package room types
          package_room_types: {
            where: {
              deleted_at: null
            },
            orderBy: {
              created_at: 'asc'
            }
          },
          // Include package availabilities
          package_availabilities: {
            orderBy: {
              date: 'asc'
            }
          }
        },
      }),
      this.prisma.package.count({
        where
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
        // Include package room types
        package_room_types: {
          where: {
            deleted_at: null
          },
          orderBy: {
            created_at: 'asc'
          }
        },
        // Include package availabilities
        package_availabilities: {
          orderBy: {
            date: 'asc'
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

    // Create package data
    const data: any = {
        ...createVendorPackageDto,
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

      // Extract nested data from DTO
      const { package_room_types, package_availabilities, ...packageData } = createVendorPackageDto;

      // Build the data object for Prisma
      const data: any = {
        ...packageData,
        user: { connect: { id: user_id } },
        // Create package files
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
      };

      // Add package room types if provided
      if (package_room_types && package_room_types.length > 0) {
        data.package_room_types = {
          create: package_room_types.map((roomType: any) => ({
            name: roomType.name,
            description: roomType.description,
            bedrooms: roomType.bedrooms,
            bathrooms: roomType.bathrooms,
            max_guests: roomType.max_guests,
            size_sqm: roomType.size_sqm,
            beds: roomType.beds,
            price: roomType.price,
            currency: roomType.currency || 'USD',
            is_default: roomType.is_default || false,
            is_available: roomType.is_available !== false,
            room_photos: roomType.room_photos
          }))
        };
      }

      // Add package availabilities if provided
      if (package_availabilities && package_availabilities.length > 0) {
        data.package_availabilities = {
          create: package_availabilities.map((availability: any) => ({
            date: new Date(availability.date),
            status: availability.status,
            rates: availability.rates,
            restrictions: availability.restrictions
          }))
        };
      }

      // Create package with nested data
      const result = await this.prisma.package.create({
        data,
        include: {
          package_files: true,
          package_room_types: true,
          package_availabilities: true,
          user: true
        }
      });

      return {
        success: true,
        data: result,
        message: 'Package created successfully with files, room types, and availabilities',
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

      // Extract nested data from DTO
      const { package_room_types, package_availabilities, ...packageData } = updateVendorPackageDto;

      // Build the data object for Prisma
      const data: any = {
        ...packageData,
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
      };

      // Update package room types if provided
      if (package_room_types && package_room_types.length > 0) {
        data.package_room_types = {
          deleteMany: {}, // Delete existing room types
          create: package_room_types.map((roomType: any) => ({
            name: roomType.name,
            description: roomType.description,
            bedrooms: roomType.bedrooms,
            bathrooms: roomType.bathrooms,
            max_guests: roomType.max_guests,
            size_sqm: roomType.size_sqm,
            beds: roomType.beds,
            price: roomType.price,
            currency: roomType.currency || 'USD',
            is_default: roomType.is_default || false,
            is_available: roomType.is_available !== false,
            room_photos: roomType.room_photos
          }))
        };
      }

      // Update package availabilities if provided
      if (package_availabilities && package_availabilities.length > 0) {
        data.package_availabilities = {
          deleteMany: {}, // Delete existing availabilities
          create: package_availabilities.map((availability: any) => ({
            date: new Date(availability.date),
            status: availability.status,
            rates: availability.rates,
            restrictions: availability.restrictions
          }))
        };
      }

      // Update package with nested data
      const result = await this.prisma.package.update({
        where: { id: packageId },
        data,
        include: {
          package_files: true,
          package_room_types: true,
          package_availabilities: true,
          user: true
        }
      });

      return {
        success: true,
        data: result,
        message: 'Package updated successfully with files, room types, and availabilities',
      };
    } catch (error) {
      throw new Error(`Failed to update package: ${error.message}`);
    }
  }
  
}
