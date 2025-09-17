import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorPackageDto } from './dto/create-vendor-package.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Express } from 'express';
import appConfig from '../../../config/app.config';
import { SearchPackagesDto } from './dto/search-packages.dto';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import * as fs from 'fs';
import * as path from 'path';
import { 
  CalendarQueryDto,
  SingleDateUpdateDto,
  BulkDateRangeUpdateDto,
  CalendarInitDto,
  CalendarStatus
} from './dto/calendar-availability.dto';


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

  // Use SojebStorage.url() for generating file URLs
  private generateFileUrl(filePath: string, type: 'package' | 'avatar' = 'package'): string {
    const storagePath = type === 'package' ? appConfig().storageUrl.package : appConfig().storageUrl.avatar;
    return SojebStorage.url(storagePath + filePath);
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
      type?: string | string[]; // Allow both string and array
      freeCancellation?: boolean;
      languages?: string[];
      ratings?: number[];
      budgetEnd?: number;
      budgetStart?: number;
      durationEnd?: string;
      durationStart?: string;
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
      where.type = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
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
    if (searchParams?.ratings && searchParams.ratings.length > 0) {
      where.reviews = {
        some: {
          rating_value: {
            in: searchParams.ratings
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

    // Add date range filter for availability
    if (searchParams?.durationStart || searchParams?.durationEnd) {
      where.package_availabilities = {
        some: {
          AND: []
        }
      };
      
      if (searchParams.durationStart) {
        where.package_availabilities.some.AND.push({
          date: {
            gte: new Date(searchParams.durationStart)
          }
        });
      }
      
      if (searchParams.durationEnd) {
        where.package_availabilities.some.AND.push({
          date: {
            lte: new Date(searchParams.durationEnd)
          }
        });
      }
    }
  
    const [packages, total] = await Promise.all([
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
              created_at: true,
            },
          },
          package_files: {
            where: { deleted_at: null },
            orderBy: { sort_order: 'asc' },
            select: { id: true, file: true, type: true, sort_order: true },
          },
          package_room_types: {
            where: { deleted_at: null },
            orderBy: { created_at: 'asc' },
            select: { id: true, name: true, description: true, price: true, currency: true, room_photos: true },
          },
          package_availabilities: {
            orderBy: { date: 'asc' },
            select: { id: true, date: true, status: true },
          },
          cancellation_policy: {
            select: { id: true, policy: true, description: true },
          },
          package_languages: {
            include: { language: { select: { id: true, name: true, code: true } } },
          },
                  package_extra_services: {
          include: { 
            extra_service: { 
              select: { id: true, name: true, price: true, description: true } 
            } 
          },
        },
        },
      }),
      this.prisma.package.count({ where }),
    ]);
  
    // Fetch rating aggregates for all returned package IDs in one query
    const packageIds = packages.map(p => p.id);
    const ratingAgg = await this.prisma.review.groupBy({
      by: ['package_id'],
      where: {
        package_id: { in: packageIds },
        deleted_at: null,
        status: 1,
      },
      _avg: { rating_value: true },
      _count: { rating_value: true },
    });

    const packageIdToRating = new Map<string, { averageRating: number; totalReviews: number }>();
    for (const row of ratingAgg as any[]) {
      packageIdToRating.set(row.package_id, {
        averageRating: row._avg?.rating_value ?? 0,
        totalReviews: row._count?.rating_value ?? 0,
      });
    }
    // Build per-package rating distribution (1..5)
    const distributionAgg = await this.prisma.review.groupBy({
      by: ['package_id', 'rating_value'],
      where: {
        package_id: { in: packageIds },
        deleted_at: null,
        status: 1,
      },
      _count: { rating_value: true },
    });

    const packageIdToDistribution = new Map<string, Record<number, number>>();
    for (const row of distributionAgg as any[]) {
      const current = packageIdToDistribution.get(row.package_id) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      // rating_value may be float; clamp to 1..5 integer bucket
      const bucket = Math.round(row.rating_value as number) as 1|2|3|4|5;
      if (bucket >= 1 && bucket <= 5) {
        current[bucket] = row._count?.rating_value ?? 0;
      }
      packageIdToDistribution.set(row.package_id, current);
    }

    // Confirmed bookings per package (approved bookings only)
    const confirmedAgg = await this.prisma.bookingItem.groupBy({
      by: ['package_id'],
      where: {
        package_id: { in: packageIds },
        deleted_at: null,
        booking: {
          deleted_at: null,
          status: 'approved',
        },
      },
      _count: { _all: true },
      _sum: { quantity: true },
    });

    const packageIdToConfirmed = new Map<string, { confirmedBookings: number; confirmedQuantity: number }>();
    for (const row of confirmedAgg as any[]) {
      packageIdToConfirmed.set(row.package_id, {
        confirmedBookings: row._count?._all ?? 0,
        confirmedQuantity: row._sum?.quantity ?? 0,
      });
    }
  
    // Process the data to add file URLs, avatar URLs, and rating summary
    const processedData = packages.map(pkg => {
      const processedPackageFiles = pkg.package_files.map(file => ({
        ...file,
        file_url: this.generateFileUrl(file.file, 'package'),
      }));

      const processedRoomTypes = pkg.package_room_types.map(roomType => {
        let processedRoomPhotos = roomType.room_photos;
        if (Array.isArray(roomType.room_photos)) {
          processedRoomPhotos = roomType.room_photos.map(photo =>
            typeof photo === 'string' ? SojebStorage.url(appConfig().storageUrl.package + photo) : photo,
          );
        }
        return { ...roomType, room_photos: processedRoomPhotos };
      });

      const processedExtraServices = pkg.package_extra_services.map(service => ({
        id: service.id,
        extra_service: {
          id: service.extra_service.id,
          name: service.extra_service.name,
          price: service.extra_service.price,
          description: service.extra_service.description
        }
      }));

             const processedUser = pkg.user
         ? {
             ...pkg.user,
             avatar_url: pkg.user.avatar
               ? this.generateFileUrl(pkg.user.avatar, 'avatar')
               : null,
           }
         : null;

      const rating = packageIdToRating.get(pkg.id) ?? { averageRating: 0, totalReviews: 0 };
      const ratingDistribution = packageIdToDistribution.get(pkg.id) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const confirmed = packageIdToConfirmed.get(pkg.id) ?? { confirmedBookings: 0, confirmedQuantity: 0 };
      const approvedDate = pkg.approved_at ? pkg.approved_at.toISOString() : null;

      // Extract room photos from processed data
    const allRoomPhotos = processedRoomTypes.flatMap(roomType => roomType.room_photos || []);

      return {
        ...pkg,
        package_files: processedPackageFiles,
        package_room_types: processedRoomTypes,
        package_extra_services: processedExtraServices,
        user: processedUser,
        rating_summary: {
          averageRating: rating.averageRating,
          totalReviews: rating.totalReviews,
          ratingDistribution,
        },
        
        roomFiles: allRoomPhotos,
        confirmed_bookings: confirmed.confirmedBookings,
        confirmed_quantity: confirmed.confirmedQuantity,
        approved_at: pkg.approved_at,
        approved_date: approvedDate,
      } as any;
    });

    // Add calendar configuration to each package
    for (const pkg of processedData) {
      const calendarConfig = await this.getCalendarConfiguration(pkg.id);
      if (calendarConfig) {
        (pkg as any).calendar_configuration = calendarConfig;
      }
    }

    

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
            avatar: true,
            created_at: true,
          }
        },
        cancellation_policy: {
          select: { id: true, policy: true, description: true },
        },
        package_languages: {
          include: { language: { select: { id: true, name: true, code: true } } },
        },
        package_extra_services: {
          include: { 
            extra_service: { 
              select: { id: true, name: true, price: true, description: true } 
            } 
          },
        },
      }
    });

    if (!data) {
      return {
        success: false,
        message: 'Package not found',
        data: null,
      };
    }

    // Fetch rating aggregates
    const ratingAgg = await this.prisma.review.groupBy({
      by: ['package_id'],
      where: {
        package_id: data.id,
        deleted_at: null,
        status: 1,
      },
      _avg: { rating_value: true },
      _count: { rating_value: true },
    });

    const rating = ratingAgg.length > 0 ? {
      averageRating: ratingAgg[0]._avg?.rating_value ?? 0,
      totalReviews: ratingAgg[0]._count?.rating_value ?? 0,
    } : { averageRating: 0, totalReviews: 0 };

    // Build rating distribution
    const distributionAgg = await this.prisma.review.groupBy({
      by: ['package_id', 'rating_value'],
      where: {
        package_id: data.id,
        deleted_at: null,
        status: 1,
      },
      _count: { rating_value: true },
    });

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distributionAgg.forEach((stat) => {
      ratingDistribution[stat.rating_value] = stat._count?.rating_value ?? 0;
    });

    // Confirmed bookings
    const confirmedAgg = await this.prisma.bookingItem.groupBy({
      by: ['package_id'],
      where: {
        package_id: data.id,
        deleted_at: null,
        booking: {
          deleted_at: null,
          status: 'approved',
        },
      },
      _count: { _all: true },
      _sum: { quantity: true },
    });

    const confirmed = confirmedAgg.length > 0 ? {
      confirmedBookings: confirmedAgg[0]._count?._all ?? 0,
      confirmedQuantity: confirmedAgg[0]._sum?.quantity ?? 0,
    } : { confirmedBookings: 0, confirmedQuantity: 0 };

    // Process the data to add full file URLs
    const processedData = {
      ...data,
      package_files: data.package_files.map(file => ({
        ...file,
        file_url: this.generateFileUrl(file.file, 'package')
      })),
      package_room_types: data.package_room_types.map(roomType => {
        let processedRoomPhotos = roomType.room_photos;
        if (Array.isArray(roomType.room_photos)) {
          processedRoomPhotos = roomType.room_photos.map(photo =>
            typeof photo === 'string' ? this.generateFileUrl(photo, 'package') : photo,
          );
        }
        return { ...roomType, room_photos: processedRoomPhotos };
      }),
      package_extra_services: data.package_extra_services.map(service => ({
        id: service.id,
        extra_service: {
          id: service.extra_service.id,
          name: service.extra_service.name,
          price: service.extra_service.price,
          description: service.extra_service.description
        }
      })),
      user: data.user ? {
        ...data.user,
        avatar_url: data.user.avatar ? this.generateFileUrl(data.user.avatar, 'avatar') : null
      } : null,
      rating_summary: {
        averageRating: rating.averageRating,
        totalReviews: rating.totalReviews,
        ratingDistribution,
      },
      confirmed_bookings: confirmed.confirmedBookings,
      confirmed_quantity: confirmed.confirmedQuantity,
      approved_date: data.approved_at ? data.approved_at.toISOString() : null,
    };

    const allRoomPhotos = processedData.package_room_types.flatMap(roomType => roomType.room_photos || []);

    // Add calendar configuration
    const calendarConfig = await this.getCalendarConfiguration(processedData.id);
    if (calendarConfig) {
      (processedData as any).calendar_configuration = calendarConfig;
    }

    console.log('Found package:', processedData);
    return {
      success: true,
      data: {
        ...processedData,
        roomFiles: allRoomPhotos,
      },
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
      room_photos?: Express.Multer.File[]; // Add room_photos files
    }
  ) {
    try {
      // Test URL generation using existing function
      console.log('=== URL Generation Test ===');
      console.log('APP_URL:', process.env.APP_URL);
      const testUrl = this.generateFileUrl('test.jpg', 'package');
      console.log('Test URL generated:', testUrl);
      
      // Ensure storage directory exists
      this.ensureStorageDirectory();
      
      // Upload files using SojebStorage and get filenames
      const package_files: string[] = [];
      const trip_plans_images: string[] = [];
      const room_photos: string[] = [];
      
      // Upload package files
      if (files?.package_files) {
        for (const file of files.package_files) {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${file.originalname}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          package_files.push(fileName);
          console.log(`Successfully uploaded package file: ${fileName}`);
        }
      }
      
      // Upload trip plans images
      if (files?.trip_plans_images) {
        for (const file of files.trip_plans_images) {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${file.originalname}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          trip_plans_images.push(fileName);
          console.log(`Successfully uploaded trip plan image: ${fileName}`);
        }
      }
      
      // Upload room photos
      if (files?.room_photos) {
        console.log(`Found ${files.room_photos.length} room_photos files to upload`);
        for (const file of files.room_photos) {
          console.log(`Uploading room photo: ${file.originalname} (${file.size} bytes)`);
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${file.originalname}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          
          room_photos.push(fileName);
          console.log(`Successfully uploaded room photo: ${fileName}`);
        }
      } else {
        console.log('No room_photos files found in request');
      }
      
      console.log('Files uploaded:', { 
        package_files, 
        trip_plans_images, 
        room_photos 
      });

      // Extract nested data from DTO
      const { 
        package_room_types, 
        package_availabilities, 
        extra_services, 
        initialize_calendar,
        calendar_start_date,
        calendar_end_date,
        close_dates,
        close_date_ranges,
        ...packageData 
      } = createVendorPackageDto;
      
      // Extract room_photos separately to avoid including it in package data
      let roomPhotosFromDto = (createVendorPackageDto as any).room_photos;
      
      // If room_photos is a string, try to parse it as JSON
      if (typeof roomPhotosFromDto === 'string') {
        try {
          roomPhotosFromDto = JSON.parse(roomPhotosFromDto);
        } catch (error) {
          console.log('Failed to parse room_photos string:', error);
          roomPhotosFromDto = [];
        }
      }
      
      // Filter out room_photos, country_id, countryId, and country from packageData to prevent them from being included in the main package
      const { room_photos: _, country_id: __, countryId: ___, country: ____, ...cleanPackageData } = packageData as any
      if (cleanPackageData.type) {
        cleanPackageData.type = cleanPackageData.type.toLowerCase();
      }
      
      console.log('Extracted DTO data:', {
        hasPackageRoomTypes: !!package_room_types,
        packageRoomTypesLength: package_room_types?.length || 0,
        roomPhotosLength: room_photos.length,
        packageData: Object.keys(cleanPackageData)
      });

      // Build the data object for Prisma
      const data: any = {
        ...cleanPackageData,
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

      // Explicitly handle country field - set as string to avoid relationship issues
      if (createVendorPackageDto.country) {
        data.country = createVendorPackageDto.country;
        console.log('Setting country as string:', createVendorPackageDto.country);
      } else if ((createVendorPackageDto as any).country_id) {
        // If country_id is provided, look up the country name and set as string
        try {
          const country = await this.prisma.country.findUnique({
            where: { id: (createVendorPackageDto as any).country_id },
            select: { name: true }
          });
          
          if (country) {
            data.country = country.name;
            console.log('Found country name from ID:', country.name);
          } else {
            console.log('Country ID not found in database. Skipping country field.');
          }
        } catch (error) {
          console.error('Error looking up country by ID:', error);
          console.log('Skipping country field due to error.');
        }
      }

      // Add package room types if provided
      if (package_room_types && package_room_types.length > 0) {
        data.package_room_types = {
          create: package_room_types.map((roomType: any, index: number) => {
            // Handle room_photos assignment
            let roomPhotos = roomType.room_photos || [];
            
            // If room_photos files are uploaded, assign them to room types
            if (room_photos.length > 0) {
              // Option 1: Assign all uploaded photos to the first room type
              if (index === 0) {
                roomPhotos = room_photos;
                console.log(`Assigning ${room_photos.length} uploaded room photos to first room type: ${roomType.name}`);
              }
              // Option 2: If you want to distribute photos across multiple room types, you can modify this logic
              // For example: assign first 5 photos to first room type, next 5 to second, etc.
            }
            
            console.log(`Room type ${index + 1} (${roomType.name}) will have ${roomPhotos.length} photos:`, roomPhotos);
            
            return {
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
              room_photos: roomPhotos
            };
          })
        };
      } else if (room_photos.length > 0 || roomPhotosFromDto) {
        // If no room types provided but room_photos are uploaded or provided in DTO, create a default room type
        console.log('No room types provided, but room photos available. Creating default room type.');
        
        let photosToUse;
        if (room_photos.length > 0) {
          photosToUse = room_photos;
        } else if (roomPhotosFromDto) {
          // If roomPhotosFromDto is an array of objects with file paths, extract the paths
          if (Array.isArray(roomPhotosFromDto)) {
            photosToUse = roomPhotosFromDto.map((photo: any) => {
              if (typeof photo === 'string') {
                return photo;
              } else if (photo && typeof photo === 'object' && photo.path) {
                return photo.path;
              }
              return photo;
            });
          } else {
            photosToUse = roomPhotosFromDto;
          }
        }
        
        data.package_room_types = {
          create: [{
            name: 'Default Room',
            description: 'Default room type with uploaded photos',
            price: cleanPackageData.price || 0,
            currency: 'USD',
            is_default: true,
            is_available: true,
            room_photos: photosToUse
          }]
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

      // Add extra services if provided
      if (extra_services && extra_services.length > 0) {
        data.package_extra_services = {
          create: extra_services.map((service: any) => ({
            extra_service: {
              create: {
                name: service.name,
                price: service.price,
                description: service.description
              }
            }
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

      console.log('Final data object for Prisma:', {
        hasPackageRoomTypes: !!data.package_room_types,
        packageRoomTypesData: data.package_room_types,
        roomPhotosInData: data.package_room_types?.create?.[0]?.room_photos || [],
        countryField: data.country,
        dataKeys: Object.keys(data)
      });

      // Create package with nested data
      const result = await this.prisma.package.create({
        data,
        include: {
          package_files: true,
          package_room_types: true,
          package_availabilities: true,
          package_extra_services: true,
          user: true,
        },
      });

      // Store calendar configuration
      await this.storeCalendarConfiguration(
        result.id,
        createVendorPackageDto.calendar_start_date,
        createVendorPackageDto.calendar_end_date,
        createVendorPackageDto.close_dates,
        createVendorPackageDto.close_date_ranges
      );

      // Initialize PropertyCalendar with close dates if requested
      if (createVendorPackageDto.initialize_calendar !== false) {
        await this.initializePropertyCalendarWithCloseDates(
          result.id, 
          user_id, 
          createVendorPackageDto.calendar_start_date, 
          createVendorPackageDto.calendar_end_date,
          createVendorPackageDto.close_dates,
          createVendorPackageDto.close_date_ranges
        );
        
        // Verify calendar creation by fetching some records
        const calendarRecords = await this.prisma.propertyCalendar.findMany({
          where: { package_id: result.id },
          take: 5,
          orderBy: { date: 'asc' }
        });
        console.log('=== Calendar Verification ===');
        console.log('Calendar records created:', calendarRecords.length);
        console.log('Sample calendar records:', calendarRecords);
      }

      // Get calendar configuration
      const calendarConfig = await this.getCalendarConfiguration(result.id);

      // Post-process to attach public URLs using existing image function
      const processedResult = {
        ...result,
        package_files: (result.package_files || []).map((file) => ({
          ...file,
          file_url: this.generateFileUrl(file.file, 'package'),
        })),
        package_room_types: (result.package_room_types || []).map((roomType) => {
          console.log('Processing room type:', roomType.name);
          console.log('Original room_photos:', roomType.room_photos);
          console.log('Environment check:', {
            APP_URL: process.env.APP_URL,
            publicUrl: appConfig().storageUrl.rootUrlPublic,
            packagePath: appConfig().storageUrl.package
          });
          
          let processedRoomPhotos = roomType.room_photos;
          if (Array.isArray(roomType.room_photos)) {
            processedRoomPhotos = roomType.room_photos.map((photo: any) => {
              console.log('Processing photo:', photo);
              if (typeof photo === 'string') {
                const photoUrl = this.generateFileUrl(photo, 'package');
                console.log('Generated URL for photo:', photoUrl);
                return photoUrl;
              }
              return photo;
            });
          }
          
          console.log('Processed room_photos:', processedRoomPhotos);
          return { ...roomType, room_photos: processedRoomPhotos };
        }),
        user: result.user
          ? {
              ...result.user,
              avatar_url: result.user.avatar
                ? this.generateFileUrl(result.user.avatar, 'avatar')
                : null,
            }
          : null,
        // Add calendar configuration
        calendar_configuration: calendarConfig,
      };

      // Generate full URLs for room_photos in the return value
      const roomPhotosWithUrls = room_photos.map(filename => {
        const fullUrl = this.generateFileUrl(filename, 'package');
        console.log(`Generated full URL for room photo: ${filename} -> ${fullUrl}`);
        return fullUrl;
      });

      return {
        success: true,
        data: processedResult,
        roomPhotos: roomPhotosWithUrls,
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
      room_photos?: Express.Multer.File[]; // Add room_photos files
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

      // Upload files using SojebStorage and get filenames
      const package_files: string[] = [];
      const trip_plans_images: string[] = [];
      const room_photos: string[] = [];
      
      // Upload package files
      if (files?.package_files) {
        for (const file of files.package_files) {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${file.originalname}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          package_files.push(fileName);
          console.log(`Successfully uploaded package file: ${fileName}`);
        }
      }
      
      // Upload trip plans images
      if (files?.trip_plans_images) {
        for (const file of files.trip_plans_images) {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${file.originalname}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          trip_plans_images.push(fileName);
          console.log(`Successfully uploaded trip plan image: ${fileName}`);
        }
      }
      
      // Upload room photos
      if (files?.room_photos) {
        console.log(`PUT Update - Found ${files.room_photos.length} room_photos files to upload`);
        for (const file of files.room_photos) {
          console.log(`PUT Update - Uploading room photo: ${file.originalname} (${file.size} bytes)`);
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${file.originalname}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          room_photos.push(fileName);
          console.log(`PUT Update - Successfully uploaded room photo: ${fileName}`);
        }
      } else {
        console.log('PUT Update - No room_photos files found in request');
      }

      console.log('PUT Update - Files uploaded:', { 
        package_files, 
        trip_plans_images, 
        room_photos 
      });

      // Extract nested data from DTO
      const { package_room_types, package_availabilities, ...packageData } = updateVendorPackageDto;
      
      // Normalize the type field to ensure consistent formatting
      if (packageData.type) {
        // Convert to lowercase for consistency
        packageData.type = packageData.type.toLowerCase();
      }
      
      console.log('PUT Update - Extracted DTO data:', {
        hasPackageRoomTypes: !!package_room_types,
        packageRoomTypesLength: package_room_types?.length || 0,
        roomPhotosLength: room_photos.length,
        packageData: Object.keys(packageData)
      });

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
          create: package_room_types.map((roomType: any, index: number) => {
            // Handle room_photos assignment
            let roomPhotos = roomType.room_photos || [];
            
            // If room_photos files are uploaded, assign them to room types
            if (room_photos.length > 0) {
              // Option 1: Assign all uploaded photos to the first room type
              if (index === 0) {
                roomPhotos = room_photos;
                console.log(`PUT Update - Assigning ${room_photos.length} uploaded room photos to first room type: ${roomType.name}`);
              }
              // Option 2: If you want to distribute photos across multiple room types, you can modify this logic
              // For example: assign first 5 photos to first room type, next 5 to second, etc.
            }
            
            console.log(`PUT Update - Room type ${index + 1} (${roomType.name}) will have ${roomPhotos.length} photos:`, roomPhotos);
            
            return {
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
              room_photos: roomPhotos
            };
          })
        };
      } else if (room_photos.length > 0) {
        // If no room types provided but room_photos are uploaded, create a default room type
        console.log('PUT Update - No room types provided, but room photos uploaded. Creating default room type.');
        data.package_room_types = {
          deleteMany: {}, // Delete existing room types
          create: [{
            name: 'Default Room',
            description: 'Default room type with uploaded photos',
            price: packageData.price || 0,
            currency: 'USD',
            is_default: true,
            is_available: true,
            room_photos: room_photos
          }]
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

      // Post-process to attach public URLs using existing image function
      const processedResult = {
        ...result,
        package_files: (result.package_files || []).map((file) => ({
          ...file,
          file_url: this.generateFileUrl(file.file, 'package'),
        })),
        package_room_types: (result.package_room_types || []).map((roomType) => {
          console.log('PUT Update - Processing room type:', roomType.name);
          console.log('PUT Update - Original room_photos:', roomType.room_photos);
          
          let processedRoomPhotos = roomType.room_photos;
          if (Array.isArray(roomType.room_photos)) {
            processedRoomPhotos = roomType.room_photos.map((photo: any) => {
              console.log('PUT Update - Processing photo:', photo);
              if (typeof photo === 'string') {
                const photoUrl = this.generateFileUrl(photo, 'package');
                console.log('PUT Update - Generated URL for photo:', photoUrl);
                return photoUrl;
              }
              return photo;
            });
          }
          
          console.log('PUT Update - Processed room_photos:', processedRoomPhotos);
          return { ...roomType, room_photos: processedRoomPhotos };
        }),
        user: result.user
          ? {
              ...result.user,
              avatar_url: result.user.avatar
                ? this.generateFileUrl(result.user.avatar, 'avatar')
                : null,
            }
          : null,
      };

      return {
        success: true,
        data: processedResult,
        message: 'Package updated successfully with files, room types, and availabilities',
      };
    } catch (error) {
      throw new Error(`Failed to update package: ${error.message}`);
    }
  }
  
  async createReview(
    packageId: string,
    userId: string,
    createReviewDto: CreateReviewDto,
  ) {
    try {
      // Check if package exists
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: packageId },
      });

      if (!packageRecord) {
        throw new Error('Package not found');
      }

      // Check if user has already reviewed this package
      const existingReview = await this.prisma.review.findFirst({
        where: { 
          user_id: userId, 
          package_id: packageId,
          deleted_at: null
        },
      });

      if (existingReview) {
        throw new Error('You have already reviewed this package');
      }

      // Only validate booking_id if it's provided and not empty
      if (createReviewDto.booking_id && createReviewDto.booking_id.trim() !== '') {
        const booking = await this.prisma.booking.findFirst({
          where: { 
            id: createReviewDto.booking_id,
            deleted_at: null
          },
        });

        if (!booking) {
          throw new Error(`Booking with ID '${createReviewDto.booking_id}' not found. For simple package reviews, omit the booking_id field.`);
        }

        // Check if the booking belongs to the user
        if (booking.user_id !== userId) {
          throw new Error('You can only review bookings that belong to you');
        }

        // Check if the booking is for the same package
        const bookingItem = await this.prisma.bookingItem.findFirst({
          where: {
            booking_id: createReviewDto.booking_id,
            package_id: packageId,
            deleted_at: null
          },
        });

        if (!bookingItem) {
          throw new Error('This booking is not associated with the specified package');
        }
      }

      // Create the review (booking_id will be null for simple package reviews)
      const review = await this.prisma.review.create({
        data: {
          user_id: userId,
          package_id: packageId,
          booking_id: createReviewDto.booking_id?.trim() || null,
          rating_value: createReviewDto.rating_value,
          comment: createReviewDto.comment,
          status: 1,
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

             // Add avatar URL if exists
       if (review.user && review.user.avatar) {
         review.user['avatar_url'] = this.generateFileUrl(review.user.avatar, 'avatar');
       }

      return {
        success: true,
        message: 'Review created successfully',
        data: review,
      };
    } catch (error) {
      console.error('Review creation error:', {
        packageId,
        userId,
        bookingId: createReviewDto.booking_id,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  async getPackageReviews(packageId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      // Check if package exists
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: packageId },
      });

      if (!packageRecord) {
        throw new Error('Package not found');
      }

      // Get reviews with pagination
      const reviews = await this.prisma.review.findMany({
        where: {
          package_id: packageId,
          deleted_at: null,
          status: 1,
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // Get total count for pagination
      const totalReviews = await this.prisma.review.count({
        where: {
          package_id: packageId,
          deleted_at: null,
          status: 1,
        },
      });

      // Calculate average rating
      const averageRating = await this.prisma.review.aggregate({
        where: {
          package_id: packageId,
          deleted_at: null,
          status: 1,
        },
        _avg: {
          rating_value: true,
        },
        _count: {
          rating_value: true,
        },
      });

             // Add avatar URLs
       for (const review of reviews) {
         if (review.user && review.user.avatar) {
           review.user['avatar_url'] = this.generateFileUrl(review.user.avatar, 'avatar');
         }
       }

      return {
        success: true,
        data: {
          reviews,
          pagination: {
            page,
            limit,
            total: totalReviews,
            totalPages: Math.ceil(totalReviews / limit),
          },
          summary: {
            averageRating: averageRating._avg.rating_value || 0,
            totalReviews: averageRating._count.rating_value || 0,
          },
        },
      };
    } catch (error) {
      throw new Error(`Failed to get package reviews: ${error.message}`);
    }
  }

  async updateReview(
    packageId: string,
    reviewId: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    try {
      // Check if review exists and belongs to user
      const existingReview = await this.prisma.review.findFirst({
        where: {
          id: reviewId,
          package_id: packageId,
          user_id: userId,
          deleted_at: null,
        },
      });

      if (!existingReview) {
        throw new Error('Review not found or access denied');
      }

      // Update the review
      const updatedReview = await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          rating_value: updateReviewDto.rating_value,
          comment: updateReviewDto.comment,
          updated_at: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

             // Add avatar URL if exists
       if (updatedReview.user && updatedReview.user.avatar) {
         updatedReview.user['avatar_url'] = this.generateFileUrl(updatedReview.user.avatar, 'avatar');
       }

      return {
        success: true,
        message: 'Review updated successfully',
        data: updatedReview,
      };
    } catch (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  async deleteReview(packageId: string, reviewId: string, userId: string) {
    try {
      // Check if review exists and belongs to user
      const existingReview = await this.prisma.review.findFirst({
        where: {
          id: reviewId,
          package_id: packageId,
          user_id: userId,
          deleted_at: null,
        },
      });

      if (!existingReview) {
        throw new Error('Review not found or access denied');
      }

      // Soft delete the review
      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          deleted_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Review deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  async getPackageRatingSummary(packageId: string) {
    try {
      // Check if package exists
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: packageId },
      });

      if (!packageRecord) {
        throw new Error('Package not found');
      }

      // Get rating statistics
      const ratingStats = await this.prisma.review.groupBy({
        by: ['rating_value'],
        where: {
          package_id: packageId,
          deleted_at: null,
          status: 1,
        },
        _count: {
          rating_value: true,
        },
      });

      // Calculate average rating
      const averageRating = await this.prisma.review.aggregate({
        where: {
          package_id: packageId,
          deleted_at: null,
          status: 1,
        },
        _avg: {
          rating_value: true,
        },
        _count: {
          rating_value: true,
        },
      });

      // Create rating distribution
      const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      ratingStats.forEach((stat) => {
        ratingDistribution[stat.rating_value] = stat._count.rating_value;
      });

      return {
        success: true,
        data: {
          averageRating: averageRating._avg.rating_value || 0,
          totalReviews: averageRating._count.rating_value || 0,
          ratingDistribution,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get package rating summary: ${error.message}`);
    }
  }

  // Enhanced create with PropertyCalendar initialization
  async createWithCalendar(
    createVendorPackageDto: CreateVendorPackageDto, 
    userId: string, 
    files?: any
  ) {
    try {
      // First create the package using existing logic
      const packageResult = await this.createWithFiles(createVendorPackageDto, userId, files);
      
      if (!packageResult.success) {
        return packageResult;
      }

      const packageId = packageResult.data.id;

      // Initialize PropertyCalendar with default availability for next 12 months
      await this.initializePropertyCalendarDefault(packageId, userId);

      return {
        ...packageResult,
        message: 'Package created successfully with PropertyCalendar initialized'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Initialize PropertyCalendar with default settings
  private async initializePropertyCalendarDefault(packageId: string, userId: string) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12); // 12 months ahead

    const dates = this.generateDateRange(startDate, endDate);
    
    const calendarData = dates.map(date => ({
      package_id: packageId,
      date: date,
      status: 'available',
      reason: null,
      room_type_id: null
    }));

    // Batch insert PropertyCalendar records
    await this.prisma.propertyCalendar.createMany({
      data: calendarData
    });
  }

  // Initialize PropertyCalendar with custom date range
  async initializePropertyCalendar(
    packageId: string,
    userId: string,
    calendarInitDto: CalendarInitDto
  ) {
    try {
      // Verify package ownership
      const packageData = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: userId,
          deleted_at: null
        }
      });

      if (!packageData) {
        throw new Error('Package not found or access denied');
      }

      // Validate date range
      if (calendarInitDto.end_date <= calendarInitDto.start_date) {
        throw new Error('End date must be after start date');
      }

      const dates = this.generateDateRange(calendarInitDto.start_date, calendarInitDto.end_date);
      
      const calendarData = dates.map(date => ({
        package_id: packageId,
        date: date,
        status: 'available',
        reason: null,
        room_type_id: calendarInitDto.room_type_id || null
      }));

      // Batch insert PropertyCalendar records
      await this.prisma.propertyCalendar.createMany({
        data: calendarData
      });

      return {
        success: true,
        data: {
          packageId,
          dateRange: {
            start: calendarInitDto.start_date,
            end: calendarInitDto.end_date
          },
          totalDates: dates.length
        },
        message: `Calendar initialized for ${dates.length} dates`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get PropertyCalendar data for a package
  async getPropertyCalendarData(
    packageId: string, 
    userId: string, 
    month: string, 
    roomTypeId?: string
  ) {
    try {
      // Verify package ownership
      const packageData = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: userId,
          deleted_at: null
        }
      });

      if (!packageData) {
        throw new Error('Package not found or access denied');
      }

      return await this.getCalendarDataForPackage(packageId, month, roomTypeId);
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Helper method to get calendar data for a package
  private async getCalendarDataForPackage(
    packageId: string,
    month: string,
    roomTypeId?: string
  ) {
    // Parse month (YYYY-MM format)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month

    // Build where condition
    const where: any = {
      package_id: packageId,
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    if (roomTypeId) {
      where.room_type_id = roomTypeId;
    }

    // Get PropertyCalendar data for the month
    const calendarData = await this.prisma.propertyCalendar.findMany({
      where,
      orderBy: {
        date: 'asc'
      },
      include: {
        room_type: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    });

    // Get room types if specified
    const roomTypes = roomTypeId ? 
      await this.prisma.packageRoomType.findMany({
        where: {
          package_id: packageId,
          id: roomTypeId
        }
      }) :
      await this.prisma.packageRoomType.findMany({
        where: {
          package_id: packageId
        }
      });

    // Format calendar data
    return {
      success: true,
      data: {
        month: month,
        year: year,
        monthNumber: monthNum,
        totalDays: endDate.getDate(),
        startDate: startDate,
        endDate: endDate,
        calendar: calendarData.map(entry => ({
          date: entry.date,
          status: entry.status,
          reason: entry.reason,
          room_type: entry.room_type,
          room_type_id: entry.room_type_id
        })),
        roomTypes: roomTypes
      }
    };
  }

  // Update single date in PropertyCalendar
  async updatePropertyCalendarDate(
    packageId: string,
    userId: string,
    updateDto: SingleDateUpdateDto
  ) {
    try {
      // Verify package ownership
      const packageData = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: userId,
          deleted_at: null
        }
      });

      if (!packageData) {
        throw new Error('Package not found or access denied');
      }

      // Check if PropertyCalendar record exists
      let calendarEntry = await this.prisma.propertyCalendar.findFirst({
        where: {
          package_id: packageId,
          date: updateDto.date,
          room_type_id: updateDto.room_type_id || null
        }
      });

      if (calendarEntry) {
        // Update existing record
        calendarEntry = await this.prisma.propertyCalendar.update({
          where: { id: calendarEntry.id },
          data: {
            status: updateDto.status,
            reason: updateDto.reason
          }
        });
      } else {
        // Create new record
        calendarEntry = await this.prisma.propertyCalendar.create({
          data: {
            package_id: packageId,
            date: updateDto.date,
            status: updateDto.status,
            reason: updateDto.reason,
            room_type_id: updateDto.room_type_id || null
          }
        });
      }

      return {
        success: true,
        data: calendarEntry,
        message: 'Calendar date updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Update PropertyCalendar for date range (bulk operation)
  async updatePropertyCalendarBulk(
    packageId: string,
    userId: string,
    bulkUpdateDto: BulkDateRangeUpdateDto
  ) {
    try {
      // Verify package ownership
      const packageData = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: userId,
          deleted_at: null
        }
      });

      if (!packageData) {
        throw new Error('Package not found or access denied');
      }

      // Validate date range
      if (bulkUpdateDto.end_date <= bulkUpdateDto.start_date) {
        throw new Error('End date must be after start date');
      }

      // Generate date range
      const dates = this.generateDateRange(
        bulkUpdateDto.start_date,
        bulkUpdateDto.end_date
      );

      // Prepare data for bulk operations
      const calendarData = dates.map(date => ({
        package_id: packageId,
        date: date,
        status: bulkUpdateDto.status,
        reason: bulkUpdateDto.reason,
        room_type_id: bulkUpdateDto.room_type_id || null
      }));

      // Use upsert to handle both insert and update
      const results = await Promise.all(
        calendarData.map(async (data) => {
          const existingEntry = await this.prisma.propertyCalendar.findFirst({
            where: {
              package_id: data.package_id,
              date: data.date,
              room_type_id: data.room_type_id
            }
          });

          if (existingEntry) {
            return this.prisma.propertyCalendar.update({
              where: { id: existingEntry.id },
              data: {
                status: data.status,
                reason: data.reason
              }
            });
          } else {
            return this.prisma.propertyCalendar.create({
              data
            });
          }
        })
      );

      return {
        success: true,
        data: {
          updatedDates: results.length,
          dateRange: {
            start: bulkUpdateDto.start_date,
            end: bulkUpdateDto.end_date
          },
          status: bulkUpdateDto.status
        },
        message: `Successfully updated ${results.length} calendar dates`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get PropertyCalendar summary
  async getPropertyCalendarSummary(
    packageId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    roomTypeId?: string
  ) {
    try {
      // Verify package ownership
      const packageData = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: userId,
          deleted_at: null
        }
      });

      if (!packageData) {
        throw new Error('Package not found or access denied');
      }

      // Build where condition
      const where: any = {
        package_id: packageId,
        date: {
          gte: startDate,
          lte: endDate
        }
      };

      if (roomTypeId) {
        where.room_type_id = roomTypeId;
      }

      // Get PropertyCalendar data for the date range
      const calendarData = await this.prisma.propertyCalendar.findMany({
        where,
        orderBy: {
          date: 'asc'
        }
      });

      // Calculate summary statistics
      const totalDays = calendarData.length;
      const availableDays = calendarData.filter(entry => entry.status === 'available').length;
      const bookedDays = calendarData.filter(entry => entry.status === 'booked').length;
      const closedDays = calendarData.filter(entry => entry.status === 'closed').length;
      const maintenanceDays = calendarData.filter(entry => entry.status === 'maintenance').length;

      return {
        success: true,
        data: {
          dateRange: {
            start: startDate,
            end: endDate
          },
          summary: {
            totalDays,
            availableDays,
            bookedDays,
            closedDays,
            maintenanceDays,
            availabilityPercentage: (availableDays / totalDays) * 100
          },
          calendar: calendarData.map(entry => ({
            date: entry.date,
            status: entry.status,
            reason: entry.reason,
            room_type_id: entry.room_type_id
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Helper method to generate date range
  private generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  // Method to get PropertyCalendar data for a package
  async getPropertyCalendarForPackage(packageId: string) {
    try {
      const calendarData = await this.prisma.propertyCalendar.findMany({
        where: { package_id: packageId },
        orderBy: { date: 'asc' },
        include: {
          room_type: {
            select: {
              id: true,
              name: true,
              price: true
            }
          }
        }
      });

      return {
        success: true,
        data: {
          packageId,
          totalDates: calendarData.length,
          calendar: calendarData.map(entry => ({
            id: entry.id,
            date: entry.date,
            status: entry.status,
            reason: entry.reason,
            room_type: entry.room_type,
            room_type_id: entry.room_type_id
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Store calendar configuration in PropertyCalendar table
  private async storeCalendarConfiguration(
    packageId: string,
    startDate?: Date,
    endDate?: Date,
    closeDates?: Date[],
    closeDateRanges?: Array<{start_date: Date; end_date: Date; reason?: string}>
  ) {
    try {
      // Create a special PropertyCalendar record to store configuration
      const configRecord = await this.prisma.propertyCalendar.create({
        data: {
          package_id: packageId,
          date: new Date('1900-01-01'), // Special date to identify config record
          status: 'config',
          reason: JSON.stringify({
            calendar_start_date: startDate,
            calendar_end_date: endDate,
            close_dates: closeDates,
            close_date_ranges: closeDateRanges
          }),
          room_type_id: null
        }
      });
      
      console.log('Calendar configuration stored:', configRecord);
      return configRecord;
    } catch (error) {
      console.error('Failed to store calendar configuration:', error);
    }
  }

  // Retrieve calendar configuration from PropertyCalendar table
  private async getCalendarConfiguration(packageId: string) {
    try {
      const configRecord = await this.prisma.propertyCalendar.findFirst({
        where: {
          package_id: packageId,
          date: new Date('1900-01-01'),
          status: 'config'
        }
      });

      if (configRecord && configRecord.reason) {
        return JSON.parse(configRecord.reason);
      }
      return null;
    } catch (error) {
      console.error('Failed to get calendar configuration:', error);
      return null;
    }
  }

  private async initializePropertyCalendarWithCloseDates(
    packageId: string, 
    userId: string, 
    startDate?: Date, 
    endDate?: Date,
    closeDates?: Date[],
    closeDateRanges?: Array<{start_date: Date; end_date: Date; reason?: string}>
  ) {
    try {
      console.log('=== Calendar Initialization Debug ===');
      console.log('Package ID:', packageId);
      console.log('Start Date:', startDate);
      console.log('End Date:', endDate);
      console.log('Close Dates:', closeDates);
      console.log('Close Date Ranges:', closeDateRanges);

      // Use provided dates or default to next 12 months
      const calendarStart = startDate || new Date();
      const calendarEnd = endDate || (() => {
        const end = new Date();
        end.setMonth(end.getMonth() + 12);
        return end;
      })();

      console.log('Calendar Start:', calendarStart);
      console.log('Calendar End:', calendarEnd);

      const dates = this.generateDateRange(calendarStart, calendarEnd);
      console.log('Generated dates count:', dates.length);
      
      // Create calendar data with close dates
      const calendarData = dates.map(date => {
        let status = 'available';
        let reason = null;

        // Check if date is in close_dates
        if (closeDates && closeDates.length > 0) {
          const isCloseDate = closeDates.some(closeDate => {
            const closeDateStr = new Date(closeDate).toDateString();
            const currentDateStr = date.toDateString();
            return closeDateStr === currentDateStr;
          });
          
          if (isCloseDate) {
            status = 'closed';
            reason = 'Closed date';
          }
        }

        // Check if date is in close_date_ranges
        if (closeDateRanges && closeDateRanges.length > 0) {
          for (const range of closeDateRanges) {
            const rangeStart = new Date(range.start_date);
            const rangeEnd = new Date(range.end_date);
            
            if (date >= rangeStart && date <= rangeEnd) {
              status = 'closed';
              reason = range.reason || 'Closed for maintenance';
              break;
            }
          }
        }

        return {
          package_id: packageId,
          date: date,
          status: status,
          reason: reason,
          room_type_id: null
        };
      });

      console.log('Calendar data prepared:', calendarData.length, 'records');
      console.log('Sample calendar data:', calendarData.slice(0, 3));

      // Batch insert PropertyCalendar records
      const result = await this.prisma.propertyCalendar.createMany({
        data: calendarData
      });

      console.log('PropertyCalendar createMany result:', result);
      console.log(`Calendar initialized for package ${packageId} with ${dates.length} dates`);
      
      if (closeDates && closeDates.length > 0) {
        console.log(`Closed ${closeDates.length} specific dates`);
      }
      if (closeDateRanges && closeDateRanges.length > 0) {
        console.log(`Closed ${closeDateRanges.length} date ranges`);
      }
    } catch (error) {
      console.error('Failed to initialize calendar:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      // Don't throw error to avoid breaking package creation
    }
  }
}
