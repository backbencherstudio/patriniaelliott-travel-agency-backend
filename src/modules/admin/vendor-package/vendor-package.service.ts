import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorPackageDto } from './dto/create-vendor-package.dto';
import { Express } from 'express';
import appConfig from '../../../config/app.config';
import { SearchPackagesDto } from './dto/search-packages.dto';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class VendorPackageService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureStorageDirectory() {
    const storagePath = path.join(
      appConfig().storageUrl.rootUrl,
      appConfig().storageUrl.package
    );
    
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
  }

  private generateFileUrl(filePath: string, type: 'package' | 'avatar' = 'package'): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:4000';
    const storagePath = type === 'package' ? 'package' : 'avatar';
    return `${baseUrl}/public/storage/${storagePath}/${filePath}`;
  }

  async getVendorPackage(
    page: number, 
    limit: number, 
    user_id?: string | null, 
    searchParams?: {
      searchQuery?: string;
      status?: number;
      categoryId?: string;
      destinationId?: string;
      type?: string;
      freeCancellation?: boolean;
      languages?: string[];
      ratings?: number;
      budgetEnd?: number;
      budgetStart?: number;
      durationEnd?: number;
      durationStart?: number;
    }
  ) {
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const where: any = {
      deleted_at: null
    };

    // Add user_id filter only if provided
    if (user_id) {
      where.user_id = user_id;
    }

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

    // Add type filter
    if (searchParams?.type) {
      where.type = searchParams.type;
    }

    // Add free cancellation filter
    if (searchParams?.freeCancellation !== undefined) {
      where.cancellation_policy = {
        is: {
          policy: {
            contains: searchParams.freeCancellation ? 'free' : 'paid',
            mode: 'insensitive'
          }
        }
      };
    }

    // Add languages filter
    if (searchParams?.languages && searchParams.languages.length > 0) {
      where.package_languages = {
        some: {
          language_id: {
            in: searchParams.languages
          }
        }
      };
    }

    // Add ratings filter
    if (searchParams?.ratings !== undefined) {
      where.reviews = {
        some: {
          rating_value: {
            gte: searchParams.ratings
          }
        }
      };
    }

    // Add budget range filter
    if (searchParams?.budgetStart !== undefined || searchParams?.budgetEnd !== undefined) {
      where.price = {};
      if (searchParams.budgetStart !== undefined) {
        where.price.gte = searchParams.budgetStart;
      }
      if (searchParams.budgetEnd !== undefined) {
        where.price.lte = searchParams.budgetEnd;
      }
    }

    // Add duration range filter
    if (searchParams?.durationStart !== undefined || searchParams?.durationEnd !== undefined) {
      where.duration = {};
      if (searchParams.durationStart !== undefined) {
        where.duration.gte = searchParams.durationStart;
      }
      if (searchParams.durationEnd !== undefined) {
        where.duration.lte = searchParams.durationEnd;
      }
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
          },
          // Include cancellation policy for free_cancellation filter
          cancellation_policy: {
            select: {
              id: true,
              policy: true,
              description: true
            }
          },
          // Include package languages for languages filter
          package_languages: {
            include: {
              language: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          // Include reviews for ratings filter
          reviews: {
            select: {
              id: true,
              rating_value: true,
              comment: true,
              created_at: true
            },
            orderBy: {
              created_at: 'desc'
            }
          }
        },
      }),
      this.prisma.package.count({
        where
      }),
    ]);
  
    // Process the data to add full file URLs
    const processedData = data.map(pkg => {
      console.log('Processing package:', pkg.id, 'with files:', pkg.package_files.length);
      
      // Process package files with URLs
      const processedPackageFiles = pkg.package_files.map(file => {
        const fileUrl = SojebStorage.url(appConfig().storageUrl.package + file.file);
        console.log('Generated file URL:', fileUrl);
        return {
          ...file,
          file_url: fileUrl
        };
      });

      // Process package room types with room photos URLs
      const processedRoomTypes = pkg.package_room_types.map(roomType => {
        let processedRoomPhotos = roomType.room_photos;
        if (roomType.room_photos && typeof roomType.room_photos === 'object') {
          // If room_photos is an array of filenames, convert them to URLs
          if (Array.isArray(roomType.room_photos)) {
            processedRoomPhotos = roomType.room_photos.map(photo => 
              typeof photo === 'string' ? SojebStorage.url(appConfig().storageUrl.package + photo) : photo
            );
          }
        }
        return {
          ...roomType,
          room_photos: processedRoomPhotos
        };
      });

      // Process user avatar URL if exists
      const processedUser = pkg.user ? {
        ...pkg.user,
        avatar_url: pkg.user.avatar ? SojebStorage.url(appConfig().storageUrl.avatar + pkg.user.avatar) : null
      } : null;

      return {
        ...pkg,
        package_files: processedPackageFiles,
        package_room_types: processedRoomTypes,
        user: processedUser
      };
    });

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
        file_url: SojebStorage.url(appConfig().storageUrl.package + file.file)
      })),
      user: data.user ? {
        ...data.user,
        avatar_url: data.user.avatar ? SojebStorage.url(appConfig().storageUrl.avatar + data.user.avatar) : null
      } : null
    } : null;

    console.log('Found packages:', processedData);
    return {
      success: true,
      data: processedData,
    };
  }

  async create(createVendorPackageDto: CreateVendorPackageDto, userId: string) {
    // Check user and vendor verification status
    const userData = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      throw new Error('User not found');
    }

    const vendorVerification = await this.prisma.vendorVerification.findUnique({
      where: { user_id: userId },
    });

    const isVendorType = (userData.type || '').toLowerCase() === 'vendor';
    const isVendorVerified = !!vendorVerification && vendorVerification.status === 'approved';

    // Always require admin approval for vendor-created packages
    // approved_at remains null so it appears in admin dashboard pending approval
    const data: any = {
      ...createVendorPackageDto,
      user: { connect: { id: userId } },
      approved_at: null,
    };

    const vendorPackage = await this.prisma.package.create({ data });

    return {
      success: true,
      data: vendorPackage,
      meta: {
        requiresVendorVerification: !isVendorType || !isVendorVerified,
        requiresAdminApproval: true,
        notes: !isVendorType || !isVendorVerified
          ? 'Please complete vendor verification. Your property is created and will be visible to you, and will be listed for admin review after verification.'
          : 'Your property is created and pending admin approval before it becomes publicly visible.'
      }
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
    files?: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    }
  ) {
    try {
      // Ensure storage directory exists
      this.ensureStorageDirectory();
      
      // Process file URLs with null checks
      const package_files = files?.package_files?.map(file => file.filename) || [];
      const trip_plans_images = files?.trip_plans_images?.map(file => file.filename) || [];
      
      console.log('Files received:', { package_files, trip_plans_images });

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

      // Vendor verification status
      const userData = await this.prisma.user.findUnique({ where: { id: user_id } });
      const vendorVerification = await this.prisma.vendorVerification.findUnique({
        where: { user_id },
      });
      const isVendorType = (userData?.type || '').toLowerCase() === 'vendor';
      const isVendorVerified = !!vendorVerification && vendorVerification.status === 'approved';

      // Always require admin approval for vendor-created packages
      data.approved_at = null;

      // Create package with nested data
      const result = await this.prisma.package.create({
        data,
        include: {
          package_files: true,
          package_room_types: true,
          package_availabilities: true,
          user: true,
        },
      });

      // Post-process to attach public URLs using existing image function
      const processedResult = {
        ...result,
        package_files: (result.package_files || []).map((file) => ({
          ...file,
          file_url: SojebStorage.url(appConfig().storageUrl.package + file.file),
        })),
        package_room_types: (result.package_room_types || []).map((roomType) => {
          let processedRoomPhotos = roomType.room_photos;
          if (Array.isArray(roomType.room_photos)) {
            processedRoomPhotos = roomType.room_photos.map((photo: any) =>
              typeof photo === 'string'
                ? SojebStorage.url(appConfig().storageUrl.package + photo)
                : photo,
            );
          }
          return { ...roomType, room_photos: processedRoomPhotos };
        }),
        user: result.user
          ? {
              ...result.user,
              avatar_url: result.user.avatar
                ? SojebStorage.url(appConfig().storageUrl.avatar + result.user.avatar)
                : null,
            }
          : null,
      };

      return {
        success: true,
        data: processedResult,
        message: 'Package created successfully with files, room types, and availabilities',
        meta: {
          requiresVendorVerification: !isVendorType || !isVendorVerified,
          requiresAdminApproval: true,
          notes:
            !isVendorType || !isVendorVerified
              ? 'Please complete vendor verification. Your property is created and visible only to you until verification and admin approval.'
              : 'Your property is created and pending admin approval before it becomes publicly visible.',
        },
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
    files?: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
    }
  ) {
    try {
      // Ensure storage directory exists
      this.ensureStorageDirectory();
      
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

      // Process file URLs with null checks
      const package_files = files?.package_files?.map(file => file.filename) || [];
      const trip_plans_images = files?.trip_plans_images?.map(file => file.filename) || [];

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
