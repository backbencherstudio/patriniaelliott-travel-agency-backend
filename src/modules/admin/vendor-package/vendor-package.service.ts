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
import { DiskOption } from '@/src/common/lib/Disk/Option';


@Injectable()
export class VendorPackageService {
  private _config: DiskOption;
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
  private computeEffectivePrice(date: Date, rules: {
    base_price: number;
    weekend_price: number;
    flat_discount: number;
    weekend_days: number[];
  }): number {
    const day = date.getDay(); 
    const isWeekend = rules.weekend_days.includes(day);
    const rawPrice = isWeekend ? rules.weekend_price : rules.base_price;
    const finalPrice = Math.max(0, rawPrice - rules.flat_discount);
    return finalPrice;
  }
  private async initializePropertyCalendarWithPricing(
    packageId: string, 
    userId: string,
    pricingRules?: any,
    calendarInitMonth?: string
  ) {
    try {
      let startDate: Date;
      let endDate: Date;
  
      if (calendarInitMonth) {
        const [year, monthNum] = calendarInitMonth.split('-').map(Number);
        startDate = new Date(year, monthNum - 1, 1);
        endDate = new Date(year, monthNum, 0); 
      } else {
        startDate = new Date();
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12);
      }
  
      const dates = this.generateDateRange(startDate, endDate);
      
      const calendarData = dates.map(date => ({
        package_id: packageId,
        date: date,
        status: 'available' as const,
        reason: null,
        room_type_id: null,
        price: pricingRules ? this.computeEffectivePrice(date, {
          base_price: Number(pricingRules.base_price),
          weekend_price: Number(pricingRules.weekend_price),
          flat_discount: Number(pricingRules.flat_discount),
          weekend_days: pricingRules.weekend_days,
        }) : null,
      }));
  
      await this.prisma.propertyCalendar.createMany({
        data: calendarData
      });
    } catch (error) {
      console.error('❌ Failed to initialize calendar with pricing:', error);
    }
  }
  private generateFileUrl(filePath: string, type: 'package' | 'avatar' = 'package'): string {
    const storagePath = type === 'package' ? appConfig().storageUrl.package : appConfig().storageUrl.avatar;
    const fullPath = storagePath + filePath;
    const url = SojebStorage.url(fullPath);
    return url;
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
      type?: string | string[]; 
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
    
    const where: any = {
      deleted_at: null
    };

    where.user = { is: { type: 'vendor' } };
    where.status = 1;
    where.approved_at = { not: null };

    if (user_id) {
      where.user_id = user_id;
    }

    if (searchParams?.searchQuery) {
      where.OR = [
        { name: { contains: searchParams.searchQuery, mode: 'insensitive' } },
        { description: { contains: searchParams.searchQuery, mode: 'insensitive' } },
      ];
    }

    if (searchParams?.status !== undefined) {
      where.status = Number(searchParams.status);
    }

    if (searchParams?.categoryId) {
      where.category_id = searchParams.categoryId;
    }

    if (searchParams?.destinationId) {
      where.package_destinations = {
        some: {
          destination_id: searchParams.destinationId
        }
      };
    }
    if (searchParams?.type) {
      where.type = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
    }

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

    if (searchParams?.languages && searchParams.languages.length > 0) {
      where.package_languages = {
        some: {
          language_id: {
            in: searchParams.languages
          }
        }
      };
    }

    if (searchParams?.ratings && searchParams.ratings.length > 0) {
      where.reviews = {
        some: {
          rating_value: {
            in: searchParams.ratings
          }
        }
      };
    }

    if (searchParams?.budgetStart !== undefined || searchParams?.budgetEnd !== undefined) {
      where.price = {};
      if (searchParams.budgetStart !== undefined) {
        where.price.gte = searchParams.budgetStart;
      }
      if (searchParams.budgetEnd !== undefined) {
        where.price.lte = searchParams.budgetEnd;
      }
    }

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
        package_trip_plans: {
          where: { deleted_at: null },
          orderBy: { sort_order: 'asc' },
          include: {
            package_trip_plan_images: {
              where: { deleted_at: null },
              orderBy: { sort_order: 'asc' }
            }
          }
        },
        package_policies: {
          where: { deleted_at: null },
          select: { package_policies: true }
        },
        },
      }),
      this.prisma.package.count({ where }),
    ]);
  
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
      
      const bucket = Math.round(row.rating_value as number) as 1|2|3|4|5;
      if (bucket >= 1 && bucket <= 5) {
        current[bucket] = row._count?.rating_value ?? 0;
      }
      packageIdToDistribution.set(row.package_id, current);
    }

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
  
    const processedData = packages.map(pkg => {
      const normalizedPolicies = Array.isArray((pkg as any).package_policies)
        ? ((pkg as any).package_policies[0]?.package_policies ?? [])
        : [];
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

      const processedTripPlans = pkg.package_trip_plans.map(tripPlan => ({
        ...tripPlan,
        package_trip_plan_images: tripPlan.package_trip_plan_images.map(image => {
          const imageUrl = this.generateFileUrl(image.image, 'package');
          return {
            ...image,
            image_url: imageUrl
          };
        })
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

    const allRoomPhotos = processedRoomTypes.flatMap(roomType => roomType.room_photos || []);

      return {
        ...pkg,
        package_policies: {
          data: normalizedPolicies
        },
        package_files: processedPackageFiles,
        package_room_types: processedRoomTypes,
        package_extra_services: processedExtraServices,
        package_trip_plans: processedTripPlans,
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
  
    const data = await this.prisma.package.findUnique({
      where: {
        id: user_id  
      },
      include: {
        package_files: {
          where: {
            deleted_at: null
          },
          orderBy: {
            sort_order: 'asc'
          }
        },
        package_room_types: {
          where: {
            deleted_at: null
          },
          orderBy: {
            created_at: 'asc'
          }
        },
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
        package_trip_plans: {
          where: {
            deleted_at: null
          },
          orderBy: {
            sort_order: 'asc'
          },
          include: {
            package_trip_plan_images: {
              where: {
                deleted_at: null
              },
              orderBy: {
                sort_order: 'asc'
              }
            }
          }
        },
        package_policies: {
          where: { deleted_at: null },
          select: {
            id: true,
            description: true,
            package_policies: true,
            created_at: true,
            updated_at: true
          }
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
      package_trip_plans: data.package_trip_plans.map(tripPlan => {
        return {
          ...tripPlan,
          package_trip_plan_images: tripPlan.package_trip_plan_images.map(image => {
            const imageUrl = this.generateFileUrl(image.image, 'package');
            return {
              ...image,
              image_url: imageUrl
            };
          })
        };
      }),
      package_policies: {
        data: data.package_policies || []
      },
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

    const calendarConfig = await this.getCalendarConfiguration(processedData.id);
    if (calendarConfig) {
      (processedData as any).calendar_configuration = calendarConfig;
    }
    return {
      success: true,
      data: {
        ...processedData,
        roomFiles: allRoomPhotos,
      },
    };
  }

  async create(createVendorPackageDto: CreateVendorPackageDto, userId: string) {
    const userData = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      throw new Error('User not found');
    }

    const vendorVerification = await this.prisma.vendorVerification.findUnique({
      where: { user_id: userId },
    });

    const isVendorType = (userData.type || '').toLowerCase() === 'vendor';
    const isVendorVerified = !!vendorVerification && vendorVerification.status === 'approved';

    const data: any = {
      ...createVendorPackageDto,
      user: { connect: { id: userId } },
      approved_at: null,
    };

    try {
      if (typeof data.bedrooms === 'string') {
        data.bedrooms = JSON.parse(data.bedrooms);
      }
    } catch (_) {}

    const vendorPackage = await this.prisma.package.create({ data });

    try {
      const basePrice = Number((createVendorPackageDto as any)?.price ?? 0);
      const discountPercentRaw = (createVendorPackageDto as any)?.discount ?? 0;
      const discountPercent = Math.max(0, Math.min(100, Number(discountPercentRaw) || 0));
      const fee = Number((createVendorPackageDto as any)?.service_fee ?? 0) || 0;
      const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
      const computed_price = discounted + (isNaN(fee) ? 0 : fee);
      await this.prisma.package.update({
        where: { id: vendorPackage.id },
        data: { computed_price },
      });
    } catch (e) {
      console.error('Failed to compute/persist computed_price (vendor create):', e?.message || e);
    }

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
      
      if (updateVendorPackageDto.bedrooms && typeof updateVendorPackageDto.bedrooms === 'string') {
        try {
          updateVendorPackageDto.bedrooms = JSON.parse(updateVendorPackageDto.bedrooms);
        } catch (error) {
          console.error('Failed to parse bedrooms JSON in update:', error);
        }
      }
      
      const { 
        package_policies, 
        initialize_calendar, 
        close_dates, 
        calendar_end_date,
        close_date_ranges,
        destinations,
        trip_plans,
        ...packageUpdateData 
      } = updateVendorPackageDto;
      
      const updatedPackage = await this.prisma.package.update({
        where: {
          id: packageId
        },
        data: packageUpdateData
      });

      let parsedPackagePolicies = package_policies;
      if (typeof package_policies === 'string') {
        try {
          parsedPackagePolicies = JSON.parse(package_policies);
        } catch (error) {
          console.error('Failed to parse package_policies JSON in update:', error);
          parsedPackagePolicies = undefined;
        }
      }

      if (parsedPackagePolicies && Array.isArray(parsedPackagePolicies)) {
        try {
          
          await this.prisma.packagePolicy.deleteMany({
            where: {
              packages: {
                some: {
                  id: packageId
                }
              }
            }
          });
          
          const items = parsedPackagePolicies.filter(
            (policy) => policy.title && policy.description && policy.description.trim() !== ''
          );
          
          if (items.length > 0) {
            const createdPolicy = await this.prisma.packagePolicy.create({
              data: {
                description: (updateVendorPackageDto as any)?.policy_description ?? null,
                package_policies: items as any,
              },
            });
            
            await this.prisma.package.update({
              where: { id: packageId },
              data: {
                package_policies: {
                  connect: { id: createdPolicy.id },
                },
              },
            });
          }
        } catch (e) {
          console.error('Failed to update package policies:', e?.message || e);
        }
      }
      try {
        const basePrice = Number((updateVendorPackageDto?.price != null ? updateVendorPackageDto.price : (packageData as any).price) ?? 0);
        const discountRaw = (updateVendorPackageDto?.discount != null ? updateVendorPackageDto.discount : (packageData as any).discount) ?? 0;
        const discountPercent = Math.max(0, Math.min(100, Number(discountRaw) || 0));
        const fee = Number((updateVendorPackageDto?.service_fee != null ? updateVendorPackageDto.service_fee : (packageData as any).service_fee) ?? 0) || 0;
        const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
        const computed_price = discounted + (isNaN(fee) ? 0 : fee);
        await this.prisma.package.update({ where: { id: updatedPackage.id }, data: { computed_price } });
      } catch (e) {
        console.error('Failed to compute/persist computed_price (vendor update):', e?.message || e);
      }
  
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

  async createWithFiles(
    createVendorPackageDto: CreateVendorPackageDto, 
    user_id: string,
    files?: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
      package_trip_plan_images?: Express.Multer.File[]; 
      day_1_images?: Express.Multer.File[];
      day_2_images?: Express.Multer.File[];
      day_3_images?: Express.Multer.File[];
      day_4_images?: Express.Multer.File[];
      day_5_images?: Express.Multer.File[];
      day_6_images?: Express.Multer.File[];
      day_7_images?: Express.Multer.File[];
      day_8_images?: Express.Multer.File[];
      day_9_images?: Express.Multer.File[];
      day_10_images?: Express.Multer.File[];
      trip_plans_0_images?: Express.Multer.File[];
      trip_plans_1_images?: Express.Multer.File[];
      trip_plans_2_images?: Express.Multer.File[];
      trip_plans_3_images?: Express.Multer.File[];
      trip_plans_4_images?: Express.Multer.File[];
      trip_plans_5_images?: Express.Multer.File[];
      trip_plans_6_images?: Express.Multer.File[];
      trip_plans_7_images?: Express.Multer.File[];
      trip_plans_8_images?: Express.Multer.File[];
      trip_plans_9_images?: Express.Multer.File[];
      room_photos?: Express.Multer.File[]; 
    }
  ) {
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { id: user_id } });
      if (!existingUser) {
        throw new Error('User not found');
      }
      this.ensureStorageDirectory();
      const package_files: string[] = [];
      const trip_plans_images: string[] = [];
      const room_photos: string[] = [];
      if (files?.package_files) {
        for (const file of files.package_files) {
          const timestamp = Date.now();
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const cleanOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') 
            .replace(/_+/g, '_') 
            .replace(/^_|_$/g, ''); 
          
          const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
          const filePath = appConfig().storageUrl.package + fileName;
          
          const filePath2 = path.join(
            appConfig().storageUrl.rootUrl,
            appConfig().storageUrl.package
          ) + fileName;
          
          await SojebStorage.put(filePath, file.buffer);
          package_files.push(fileName);        
          
        }
      }
      if (files?.trip_plans_images) {
        for (const file of files.trip_plans_images) {
          const timestamp = Date.now();
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const cleanOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') 
            .replace(/_+/g, '_') 
            .replace(/^_|_$/g, '');
          
          const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          trip_plans_images.push(fileName);
        }
      }
      
      if (files?.room_photos) {
        for (const file of files.room_photos) {
          const timestamp = Date.now();
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          
          
          const cleanOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') 
            .replace(/_+/g, '_') 
            .replace(/^_|_$/g, ''); 
          
          const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          
          room_photos.push(fileName);
        }
      } else {
        
      }
      
      const day_wise_images: { [key: number]: string[] } = {};
      for (let day = 1; day <= 10; day++) {
        const dayKey = `day_${day}_images` as keyof typeof files;
        if (files?.[dayKey]) {
          day_wise_images[day] = [];
          for (const file of files[dayKey]!) {
            const timestamp = Date.now();
            const randomName = Array(16)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            const cleanOriginalName = file.originalname
              .replace(/[^a-zA-Z0-9.-]/g, '_') 
              .replace(/_+/g, '_') 
              .replace(/^_|_$/g, ''); 
            
            const fileName = `${timestamp}_${randomName}_day${day}_${cleanOriginalName}`;
            const filePath = appConfig().storageUrl.package + fileName;
            await SojebStorage.put(filePath, file.buffer);
            day_wise_images[day].push(fileName);
            
          }
        }
      }

     
      if (files?.package_trip_plan_images) {
        for (const file of files.package_trip_plan_images) {
          const timestamp = Date.now();
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const cleanOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') 
            .replace(/_+/g, '_') 
            .replace(/^_|_$/g, ''); 
          
          const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          trip_plans_images.push(fileName);
          
        }
      }
      for (let i = 0; i <= 9; i++) {
        const fieldName = `trip_plans_${i}_images` as keyof typeof files;
        const tripPlanImages = files?.[fieldName];
        
        if (tripPlanImages && tripPlanImages.length > 0) {
          
          for (const file of tripPlanImages) {
            const timestamp = Date.now();
            const randomName = Array(16)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            const cleanOriginalName = file.originalname
              .replace(/[^a-zA-Z0-9.-]/g, '_') 
              .replace(/_+/g, '_') 
              .replace(/^_|_$/g, ''); 
            
            const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
            const filePath = appConfig().storageUrl.package + fileName;
            await SojebStorage.put(filePath, file.buffer);
            trip_plans_images.push(fileName); 
            
          }
        }
      }
      
      const { 
        package_room_types, 
        package_availabilities, 
        extra_services, 
        initialize_calendar,
        calendar_start_date,
        calendar_end_date,
        close_dates,
        close_date_ranges,
        destinations,
        trip_plans,
        package_policies: rawPackagePolicies,
        pricing_rules,
        calendar_init_month,
        ...packageData 
      } = createVendorPackageDto;
      
      let package_policies = rawPackagePolicies;
      if (typeof rawPackagePolicies === 'string') {
        try {
          package_policies = JSON.parse(rawPackagePolicies);
        } catch (error) {
          package_policies = undefined;
        }
      } else {
      }
      
      let roomPhotosFromDto = (createVendorPackageDto as any).room_photos;
      if (typeof roomPhotosFromDto === 'string') {
        try {
          roomPhotosFromDto = JSON.parse(roomPhotosFromDto);
        } catch (error) {
          roomPhotosFromDto = [];
        }
      }
      
     const { room_photos: _, country_id: __, countryId: ___, country: ____, total_bedrooms: _____, ...cleanPackageData } = packageData as any
      const trimmedOnce = this.trimObjectKeys(cleanPackageData);
      Object.keys(cleanPackageData).forEach((key) => {
        if (typeof key === 'string' && key !== key.trim()) {
          delete (cleanPackageData as any)[key];
        }
      });
      Object.assign(cleanPackageData, trimmedOnce);
      const forbiddenRootTripFields = ['title', 'meetingPoint', 'tripPlan'];
      for (const key of forbiddenRootTripFields) {
        if (key in cleanPackageData) {
          delete cleanPackageData[key];
        }
      }
      const invalidPackageFields = ['total_bedrooms', 'room_photos', 'country_id', 'countryId'];
      for (const key of invalidPackageFields) {
        if (key in cleanPackageData) {
          delete cleanPackageData[key];
        }
      }
      if (extra_services !== undefined) {
        try {
          const parsedExtra = typeof extra_services === 'string' ? JSON.parse(extra_services) : extra_services;
          (cleanPackageData as any).extra_services = parsedExtra;
        } catch (e) {
          (cleanPackageData as any).extra_services = extra_services as any;
        }
      }
      let rootTripPlanPayload: any = null;
      const rawPackageData = packageData as any;
      if (rawPackageData && (rawPackageData.title || rawPackageData.meetingPoint || rawPackageData.tripPlan)) {
        try {
          const parsedTripPlan = typeof rawPackageData.tripPlan === 'string'
            ? JSON.parse(rawPackageData.tripPlan)
            : rawPackageData.tripPlan;
          rootTripPlanPayload = {
            title: rawPackageData.title || 'Trip Plan 1',
            description: '',
            time: rawPackageData.time ? String(rawPackageData.time) : rawPackageData.meetingPoint ? String(rawPackageData.meetingPoint) : '',
            ticket_free: parsedTripPlan || [],
            sort_order: 0,
          };
        } catch {
          rootTripPlanPayload = {
            title: rawPackageData.title || 'Trip Plan 1',
            description: '',
            time: rawPackageData.time ? String(rawPackageData.time) : rawPackageData.meetingPoint ? String(rawPackageData.meetingPoint) : '',
            ticket_free: [],
            sort_order: 0,
          };
        }
      }
      const cleanStringValue = (value: any): any => {
        if (typeof value === 'string') {
          return value.replace(/^"(.*)"$/, '$1');
        }
        return value;
      };
      
      if (cleanPackageData.type) {
        cleanPackageData.type = cleanStringValue(cleanPackageData.type).toLowerCase();
      }
      if (cleanPackageData.duration_type) {
        cleanPackageData.duration_type = cleanStringValue(cleanPackageData.duration_type);
      }
      if (cleanPackageData.name) {
        cleanPackageData.name = cleanStringValue(cleanPackageData.name);
      }
      if (cleanPackageData.description) {
        cleanPackageData.description = cleanStringValue(cleanPackageData.description);
      }
      if (cleanPackageData.price) {
        cleanPackageData.price = cleanStringValue(cleanPackageData.price);
      }
      const stringFieldsToClean = [
        'address', 'city', 'country', 'postal_code', 'unit_number',
        'cancellation_policy_id', 'booking_method', 'commission_rate',
        'host_earnings'
      ];
      
      stringFieldsToClean.forEach(field => {
        if (cleanPackageData[field]) {
          cleanPackageData[field] = cleanStringValue(cleanPackageData[field]);
        }
      });
      const numericFields: Array<keyof typeof cleanPackageData> = [
        'discount', 'service_fee', 'bathrooms', 'max_guests', 'size_sqm', 'min_capacity', 'max_capacity', 'latitude', 'longitude'
      ] as any;
      numericFields.forEach((field) => {
        if ((cleanPackageData as any)[field] != null && (cleanPackageData as any)[field] !== '') {
          const n = Number((cleanPackageData as any)[field]);
          if (!Number.isNaN(n)) {
            (cleanPackageData as any)[field] = n;
          } else {
            delete (cleanPackageData as any)[field];
          }
        }
      });
      if ((cleanPackageData as any).language != null) {
        const rawLang = (cleanPackageData as any).language;
        try {
          if (typeof rawLang === 'string') {
            (cleanPackageData as any).language = JSON.parse(rawLang);
          }
        } catch {
          if (typeof rawLang === 'string') {
            const trimmed = rawLang.trim();
            const inner = trimmed.replace(/^\{/, '[').replace(/\}$/, ']');
            const parts = inner
              .replace(/^[\[]|[\]]$/g, '')
              .split(',')
              .map((s) => s.replace(/^\s*"|"\s*$/g, '').replace(/^\s*'|'\s*$/g, '').trim())
              .filter((s) => s.length > 0);
            (cleanPackageData as any).language = parts;
          }
        }
      }
      if (cleanPackageData.bedrooms && typeof cleanPackageData.bedrooms === 'string') {
        try {
          cleanPackageData.bedrooms = JSON.parse(cleanPackageData.bedrooms);
        } catch (error) {
          console.error('Failed to parse bedrooms JSON:', error);
        }
      }
      const nested: any = {};
      if (trip_plans) {
        let tripPlansArray = [];
        if (typeof trip_plans === 'string') {
          try {
            tripPlansArray = JSON.parse(trip_plans);
          } catch (error) {
            console.error('Failed to parse trip_plans JSON:', error);
          }
        } else if (Array.isArray(trip_plans)) {
          tripPlansArray = trip_plans;
        }
        if (tripPlansArray.length > 0) {
          let imagesToDistribute: string[] = [];
          if (Object.keys(day_wise_images).length === 0 && trip_plans_images.length > 0) {
            imagesToDistribute = trip_plans_images;
          }

          nested.package_trip_plans = {
            create: tripPlansArray.map((tripPlan: any, index: number) => {
              const dayNumber = index + 1;
              let dayImages = day_wise_images[dayNumber] || [];
              if (dayImages.length === 0 && imagesToDistribute.length > 0) {
                const imagesPerDay = Math.ceil(imagesToDistribute.length / tripPlansArray.length);
                const startIndex = index * imagesPerDay;
                const endIndex = Math.min(startIndex + imagesPerDay, imagesToDistribute.length);
                dayImages = imagesToDistribute.slice(startIndex, endIndex);
              }
              
              return {
                title: tripPlan.title || `Trip Plan ${dayNumber}`,
                description: tripPlan.description || '',
                time: tripPlan.time ? String(tripPlan.time) : tripPlan.meetingPoint ? String(tripPlan.meetingPoint) : '',
                ticket_free: (() => {
                  const tf = tripPlan.ticket_free ?? tripPlan.tripPlan ?? [];
                  return typeof tf === 'string' ? tf : JSON.stringify(tf);
                })(),
                day_wise_data: tripPlan.day_wise_data || null, 
                sort_order: index,
                package_trip_plan_images: {
                  create: dayImages.map(imageFilename => ({
                    image: imageFilename,
                    image_alt: `Day ${dayNumber} trip plan image`,
                    sort_order: 0
                  }))
                }
              };
            })
          };
        }
      }      
      if (rootTripPlanPayload && !('package_trip_plans' in nested)) {
        const normalizedRoot = {
          ...rootTripPlanPayload,
          ticket_free: typeof rootTripPlanPayload.ticket_free === 'string' 
            ? rootTripPlanPayload.ticket_free 
            : JSON.stringify(rootTripPlanPayload.ticket_free ?? []),
          day_wise_data: rootTripPlanPayload.day_wise_data || null
        };
        nested.package_trip_plans = {
          create: [normalizedRoot]
        };
      }
      if ((cleanPackageData as any).extra_services !== undefined) {
        try {
          const raw = (cleanPackageData as any).extra_services;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          (cleanPackageData as any).extra_services = parsed;
        } catch {}
      }
      const data: any = {
        ...cleanPackageData,
        user_id: user_id,
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
      if (nested.package_trip_plans) {
        data.package_trip_plans = nested.package_trip_plans;
      }
      if ('cancellation_policy' in data) {
        delete data.cancellation_policy;
      }
      if ('package_policies' in data) {
        delete data.package_policies;
      }
      if ('policy_description' in data) {
        delete data.policy_description;
      }
      if ('pricing_rules' in data) {
        delete data.pricing_rules;
      }
      if ('calendar_init_month' in data) {
        delete data.calendar_init_month;
      }
      if ('date_prices' in data) {
        delete data.date_prices;
      }
      if ('date_price_ranges' in data) {
        delete data.date_price_ranges;
      }

     try {
        if (typeof data.bedrooms === 'string') {
          data.bedrooms = JSON.parse(data.bedrooms);
        }
      } catch (_) {}

      if (createVendorPackageDto.country) {
        data.country = createVendorPackageDto.country;
      } else if ((createVendorPackageDto as any).country_id) {
        try {
          const country = await this.prisma.country.findUnique({
            where: { id: (createVendorPackageDto as any).country_id },
            select: { name: true }
          });
          
          if (country) {
            data.country = country.name;
          } else {
          }
        } catch (error) {
          console.error('Error looking up country by ID:', error);
          console.log('Skipping country field due to error.');
        }
      }
      if (destinations) {
        let destinationsArray = [];
        if (typeof destinations === 'string') {
          try {
            destinationsArray = JSON.parse(destinations);
          } catch (error) {
            console.error('Failed to parse destinations JSON:', error);
          }
        } else if (Array.isArray(destinations)) {
          destinationsArray = destinations;
        }
        if (destinationsArray.length > 0) {
          const destinationIds = destinationsArray.map((dest: any) => dest.id);
          const existingDestinations = await this.prisma.destination.findMany({
            where: { id: { in: destinationIds } },
            select: { id: true }
          });
          
          const existingIds = existingDestinations.map(dest => dest.id);
          const invalidIds = destinationIds.filter(id => !existingIds.includes(id));
          
          if (invalidIds.length > 0) {
            throw new Error(`The following destination IDs do not exist: ${invalidIds.join(', ')}`);
          }
          
          data.package_destinations = {
            create: destinationsArray.map((dest: any) => ({
              destination_id: dest.id
            }))
          };
        }
      }
      if (package_room_types && package_room_types.length > 0) {
        data.package_room_types = {
          create: package_room_types.map((roomType: any, index: number) => {
            let roomPhotos = roomType.room_photos || [];
            if (room_photos.length > 0) {
              if (index === 0) {
                roomPhotos = room_photos;
              }
            }
            let parsedBedrooms = roomType.bedrooms;
            if (roomType.bedrooms && typeof roomType.bedrooms === 'string') {
              try {
                parsedBedrooms = JSON.parse(roomType.bedrooms);
              } catch (error) {
                console.error('Failed to parse room type bedrooms JSON:', error);
              }
            }
            
            return {
              name: roomType.name,
              description: roomType.description,
              bedrooms: parsedBedrooms,
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
        
        let photosToUse;
        if (room_photos.length > 0) {
          photosToUse = room_photos;
        } else if (roomPhotosFromDto) {
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
      if (package_availabilities && package_availabilities.length > 0) {
        if (cleanPackageData.type === 'tour') {
          const createdDate = new Date();
          data.package_availabilities = {
            create: [{
              date: createdDate,
              status: 'available',
              rates: null,
              restrictions: null,
            }]
          };
        } else if (cleanPackageData.type === 'apartment' || cleanPackageData.type === 'hotel') {
        } else {
          data.package_availabilities = {
            create: package_availabilities.map((availability: any) => ({
              date: new Date(availability.date),
              status: availability.status,
              rates: availability.rates,
              restrictions: availability.restrictions
            }))
          };
        }
      } else {
        if (cleanPackageData.type === 'tour') {
          const createdDate = new Date();
          data.package_availabilities = {
            create: [{
              date: createdDate,
              status: 'available',
              rates: null,
              restrictions: null,
            }]
          };
        }
      }
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
      const userData = await this.prisma.user.findUnique({ where: { id: user_id } });
      const vendorVerification = await this.prisma.vendorVerification.findUnique({
        where: { user_id },
      });
      const isVendorType = (userData?.type || '').toLowerCase() === 'vendor';
      const isVendorVerified = !!vendorVerification && vendorVerification.status === 'approved';
      data.approved_at = null;
      try {
        const basePrice = Number((cleanPackageData as any)?.price ?? 0);
        const discountPercent = Math.max(0, Math.min(100, Number((cleanPackageData as any)?.discount ?? 0) || 0));
        const fee = Number((cleanPackageData as any)?.service_fee ?? 0) || 0;
        const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
        const computed_price = discounted + (isNaN(fee) ? 0 : fee);
        (data as any).computed_price = computed_price;
      } catch (e) {
        console.error('Failed to precompute computed_price (vendor createWithFiles):', e?.message || e);
      }
      let result = await this.prisma.package.create({
        data,
        include: {
          package_files: true,
          package_room_types: true,
          package_availabilities: true,
          package_extra_services: true,
          package_trip_plans: {
            include: {
              package_trip_plan_images: true
            }
          },
          user: true,
        },
      });
      try {
        const cancellationPolicyRaw = (createVendorPackageDto as any)?.cancellation_policy;
        const policyDescription = (createVendorPackageDto as any)?.policy_description;
        if (cancellationPolicyRaw && typeof cancellationPolicyRaw === 'string') {
          const createdCP = await this.prisma.packageCancellationPolicy.create({
            data: {
              user_id: user_id,
              policy: cancellationPolicyRaw,
              description: policyDescription ?? null,
            },
          });
          await this.prisma.package.update({
            where: { id: result.id },
            data: { cancellation_policy_id: createdCP.id },
          });
        }
      } catch (e) {
        console.error('Failed to create/link PackageCancellationPolicy:', e?.message || e);
      }
      try {
        
        let items = [];
        
        if (package_policies && Array.isArray(package_policies)) {
          
          items = package_policies.filter(
            (policy) => policy.title && policy.description && policy.description.trim() !== ''
          );
        } else {
          items = [
            { title: 'transportation', description: (createVendorPackageDto as any)?.transportation },
            { title: 'meals', description: (createVendorPackageDto as any)?.meals },
            { title: 'guide_tours', description: (createVendorPackageDto as any)?.guide },
            { title: 'add_ons', description: (createVendorPackageDto as any)?.addOns },
            { title: 'cancellation_policy', description: (createVendorPackageDto as any)?.cancellation_policy },
          ].filter((i) => typeof i.description === 'string' && i.description.trim() !== '');
        }

        const policyDescription = (createVendorPackageDto as any)?.policy_description;
        if (items.length > 0 || (typeof policyDescription === 'string' && policyDescription.trim() !== '')) {
          const createdPolicy = await this.prisma.packagePolicy.create({
            data: {
              description: policyDescription ?? null,
              package_policies: items as any,
            },
          });
          
          await this.prisma.package.update({
            where: { id: result.id },
            data: {
              package_policies: {
                connect: { id: createdPolicy.id },
              },
            },
          });
        } else {
        }
      } catch (e) {
        console.error('Failed to create/link PackagePolicy:', e?.message || e);
      }
      if (pricing_rules) {
        try {
          this.validatePricingRulesBusinessLogic(pricing_rules);
          
          const savedPricingRule = await this.prisma.packagePricingRule.create({
            data: {
              package_id: result.id,
              base_price: pricing_rules.base_price,
              weekend_price: pricing_rules.weekend_price,
              flat_discount: pricing_rules.flat_discount,
              weekly_discount_pct: pricing_rules.weekly_discount_pct,
              weekend_days: pricing_rules.weekend_days,
              min_stay_nights: pricing_rules.min_stay_nights,
              max_stay_nights: pricing_rules.max_stay_nights,
              advance_notice_hours: pricing_rules.advance_notice_hours,
            },
          });
        } catch (error) {
          console.error('❌ Failed to save pricing rules:', error);
        }
      } else {
        console.log('🔍 Debug - No pricing rules provided');
      }

      result = await this.prisma.package.findUnique({
        where: { id: result.id },
        include: {
          package_files: true,
          package_room_types: true,
          package_availabilities: true,
          package_extra_services: true,
          package_trip_plans: {
            include: { package_trip_plan_images: true },
          },
          package_policies: true,
          package_pricing_rules: true,
          user: true,
        },
      }) as any;

      const calendarConfigRecord = await this.storeCalendarConfiguration(
        result.id,
        createVendorPackageDto.calendar_start_date,
        createVendorPackageDto.calendar_end_date,
        createVendorPackageDto.close_dates,
        createVendorPackageDto.close_date_ranges
      );

      if (createVendorPackageDto.initialize_calendar !== false) {
        await this.initializePropertyCalendarWithCloseDates(
          result.id, 
          user_id, 
          createVendorPackageDto.calendar_start_date, 
          createVendorPackageDto.calendar_end_date,
          createVendorPackageDto.close_dates,
          createVendorPackageDto.close_date_ranges
        );
        const calendarRecords = await this.prisma.propertyCalendar.findMany({
          where: { package_id: result.id },
          take: 5,
          orderBy: { date: 'asc' }
        });
      }
      if (Array.isArray((createVendorPackageDto as any).date_prices) &&
          createVendorPackageDto.calendar_start_date &&
          createVendorPackageDto.calendar_end_date) {
        const rangeStart = new Date(createVendorPackageDto.calendar_start_date);
        const rangeEnd = new Date(createVendorPackageDto.calendar_end_date);
        const entries = (createVendorPackageDto as any).date_prices as Array<{ date: Date | string; price: number; status?: string; room_type_id?: string }>;

        for (const item of entries) {
          const d = new Date(item.date as any);
          if (isNaN(d.getTime())) continue;
          if (d < rangeStart || d > rangeEnd) continue;

          const existingEntry = await this.prisma.propertyCalendar.findFirst({
            where: {
              package_id: result.id,
              date: d,
              room_type_id: item.room_type_id ?? null
            }
          });

          if (existingEntry) {
            await this.prisma.propertyCalendar.update({
              where: { id: existingEntry.id },
              data: {
                price: item.price as any,
                ...(item.status ? { status: item.status } : {})
              }
            });
          } else {
            await this.prisma.propertyCalendar.create({
              data: {
                package_id: result.id,
                date: d,
                status: item.status || 'available',
                reason: null,
                room_type_id: item.room_type_id ?? null,
                price: item.price as any
              }
            });
          }
        }
      }
      const calendarConfig = await this.getCalendarConfiguration(result.id);
      const processedResult = {
        ...result,
        package_policies: {
          data: Array.isArray((result as any).package_policies)
            ? ((result as any).package_policies[0]?.package_policies ?? [])
            : []
        },
        package_files: (result.package_files || []).map((file) => ({
          ...file,
          file_url: this.generateFileUrl(file.file, 'package'),
        })),
        package_room_types: (result.package_room_types || []).map((roomType) => {
          
          let processedRoomPhotos = roomType.room_photos;
          if (Array.isArray(roomType.room_photos)) {
            processedRoomPhotos = roomType.room_photos.map((photo: any) => {
              if (typeof photo === 'string') {
                const photoUrl = this.generateFileUrl(photo, 'package');
                return photoUrl;
              }
              return photo;
            });
          }
          
          return { ...roomType, room_photos: processedRoomPhotos };
        }),
        package_trip_plans: (result.package_trip_plans || []).map(tripPlan => ({
          ...tripPlan,
          package_trip_plan_images: tripPlan.package_trip_plan_images.map(image => {
            const imageUrl = this.generateFileUrl(image.image, 'package');
            return {
              ...image,
              image_url: imageUrl
            };
          })
        })),
        user: result.user
          ? {
              ...result.user,
              avatar_url: result.user.avatar
                ? this.generateFileUrl(result.user.avatar, 'avatar')
                : null,
            }
          : null,
        calendar_configuration: calendarConfig,
         pricing_rules: (result as any).package_pricing_rules && (result as any).package_pricing_rules.length > 0 
          ? (result as any).package_pricing_rules[0] 
          : null,
        calendar_init_month: calendar_init_month || null,
      };

      const roomPhotosWithUrls = room_photos.map(filename => {
        const fullUrl = this.generateFileUrl(filename, 'package');
        return fullUrl;
      });

      if (cleanPackageData.type === 'apartment' || cleanPackageData.type === 'hotel') {
        const calendarStart = createVendorPackageDto.calendar_start_date || new Date();
        const calendarEnd = createVendorPackageDto.calendar_end_date || (() => {
          const end = new Date();
          end.setMonth(end.getMonth() + 12);
          return end;
        })();
        const dates = this.generateDateRange(calendarStart, calendarEnd);
        const availabilityData = [];

        for (const date of dates) {
          for (const roomType of result.package_room_types || []) {
            availabilityData.push({
              package_id: result.id,
              date: date,
              status: 'available',
              rates: null,
              restrictions: null
            });
          }
        }
        if (availabilityData.length > 0) {
          try {
            await this.prisma.packageAvailability.createMany({
              data: availabilityData
            });
          } catch (error) {
            console.error('❌ Failed to create availability records:', error);
          }
        } else {
          console.log('⚠️ No availability data to create');
        }
      }
      if (pricing_rules) {
        await this.initializePropertyCalendarWithPricing(
          result.id, 
          user_id, 
          pricing_rules,
          calendar_init_month
        );
      } else {
        await this.initializePropertyCalendarDefault(result.id, user_id);
      }

      let calendarRange: any = null;
      if (calendarConfigRecord && createVendorPackageDto.calendar_start_date && createVendorPackageDto.calendar_end_date) {
        const rangeStart = new Date(createVendorPackageDto.calendar_start_date);
        const rangeEnd = new Date(createVendorPackageDto.calendar_end_date);
        const calendarDates = await this.prisma.propertyCalendar.findMany({
          where: {
            package_id: result.id,
            date: { gte: rangeStart, lte: rangeEnd }
          },
          orderBy: { date: 'asc' },
          select: { id: true, date: true, price: true, status: true, room_type_id: true }
        });
        calendarRange = {
          id: calendarConfigRecord.id,
          start_date: rangeStart,
          end_date: rangeEnd,
          dates: calendarDates
        };
      }

      return {
        success: true,
        data: {
          ...processedResult,
          calendar_range: calendarRange
        },
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

  async updateWithFiles(
    packageId: string,
    user_id: string,
    updateVendorPackageDto: CreateVendorPackageDto,
    files?: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
      package_trip_plan_images?: Express.Multer.File[]; 
      trip_plans_0_images?: Express.Multer.File[];
      trip_plans_1_images?: Express.Multer.File[];
      trip_plans_2_images?: Express.Multer.File[];
      trip_plans_3_images?: Express.Multer.File[];
      trip_plans_4_images?: Express.Multer.File[];
      trip_plans_5_images?: Express.Multer.File[];
      trip_plans_6_images?: Express.Multer.File[];
      trip_plans_7_images?: Express.Multer.File[];
      trip_plans_8_images?: Express.Multer.File[];
      trip_plans_9_images?: Express.Multer.File[];
      room_photos?: Express.Multer.File[]; 
    }
  ) {
    try {
      this.ensureStorageDirectory();
      
      const existingPackage = await this.prisma.package.findFirst({
        where: {
          id: packageId,
          user_id: user_id,
        },
      });

      if (!existingPackage) {
        throw new Error('Package not found or access denied');
      }

      const package_files: string[] = [];
      const trip_plans_images: string[] = [];
      const room_photos: string[] = [];
      
      if (files?.package_files) {
        for (const file of files.package_files) {
          const timestamp = Date.now();
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          
          const cleanOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') 
            .replace(/_+/g, '_') 
            .replace(/^_|_$/g, ''); 
          
          const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          package_files.push(fileName);
          
        }
      }
      
      if (files?.trip_plans_images) {
        for (const file of files.trip_plans_images) {
          const timestamp = Date.now();
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          
          const cleanOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') 
            .replace(/_+/g, '_') 
            .replace(/^_|_$/g, ''); 
          
          const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          trip_plans_images.push(fileName);
          
        }
      }
      if (files?.package_trip_plan_images) {
        for (const file of files.package_trip_plan_images) {
          const timestamp = Date.now();
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          
          const cleanOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') 
            .replace(/_+/g, '_') 
            .replace(/^_|_$/g, ''); 
          
          const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          trip_plans_images.push(fileName); 
          
        }
      }

      for (let i = 0; i <= 9; i++) {
        const fieldName = `trip_plans_${i}_images` as keyof typeof files;
        const tripPlanImages = files?.[fieldName];
        
        if (tripPlanImages && tripPlanImages.length > 0) {
          
          for (const file of tripPlanImages) {
            const timestamp = Date.now();
            const randomName = Array(16)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            
            const cleanOriginalName = file.originalname
              .replace(/[^a-zA-Z0-9.-]/g, '_') 
              .replace(/_+/g, '_') 
              .replace(/^_|_$/g, ''); 
            
            const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
            const filePath = appConfig().storageUrl.package + fileName;
            await SojebStorage.put(filePath, file.buffer);
            trip_plans_images.push(fileName);
            
          }
        }
      }
      
      if (files?.room_photos) {
        for (const file of files.room_photos) {
          const timestamp = Date.now();
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          
          const cleanOriginalName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_') 
            .replace(/_+/g, '_') 
            .replace(/^_|_$/g, ''); 
          
          const fileName = `${timestamp}_${randomName}_${cleanOriginalName}`;
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          room_photos.push(fileName);
        }
      } else {
      }
      const { package_room_types, package_availabilities, ...packageData } = updateVendorPackageDto;

      const normalizedPackageData = this.trimObjectKeys(packageData as any);
      const cleanStringValue = (value: any): any => {
        if (typeof value === 'string') {
          return value.replace(/^"(.*)"$/, '$1');
        }
        return value;
      };
      
      if (normalizedPackageData.type) {
        normalizedPackageData.type = cleanStringValue(normalizedPackageData.type).toLowerCase();
      }
      if (normalizedPackageData.duration_type) {
        normalizedPackageData.duration_type = cleanStringValue(normalizedPackageData.duration_type);
      }
      if (normalizedPackageData.name) {
        normalizedPackageData.name = cleanStringValue(normalizedPackageData.name);
      }
      if (normalizedPackageData.description) {
        normalizedPackageData.description = cleanStringValue(normalizedPackageData.description);
      }
      if (normalizedPackageData.price) {
        normalizedPackageData.price = cleanStringValue(normalizedPackageData.price);
      }
      
      const stringFieldsToClean = [
        'address', 'city', 'country', 'postal_code', 'unit_number',
        'cancellation_policy_id', 'booking_method', 'commission_rate',
        'host_earnings'
      ];
      
      stringFieldsToClean.forEach(field => {
        if (normalizedPackageData[field]) {
          normalizedPackageData[field] = cleanStringValue(normalizedPackageData[field]);
        }
      });
      
      if (normalizedPackageData.bedrooms && typeof normalizedPackageData.bedrooms === 'string') {
        try {
          normalizedPackageData.bedrooms = JSON.parse(normalizedPackageData.bedrooms);
        } catch (error) {
          console.error('Failed to parse bedrooms JSON in updateWithFiles:', error);
        }
      }
      const data: any = {
        ...normalizedPackageData,
        package_files: {
          deleteMany: {}, 
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

      if (package_room_types && package_room_types.length > 0) {
        data.package_room_types = {
          deleteMany: {}, 
          create: package_room_types.map((roomType: any, index: number) => {
            let roomPhotos = roomType.room_photos || [];
            
            if (room_photos.length > 0) {
              if (index === 0) {
                roomPhotos = room_photos;
              }
            }
            
            let parsedBedrooms = roomType.bedrooms;
            if (roomType.bedrooms && typeof roomType.bedrooms === 'string') {
              try {
                parsedBedrooms = JSON.parse(roomType.bedrooms);
              } catch (error) {
                console.error('Failed to parse room type bedrooms JSON in update:', error);
              }
            }
            
            return {
              name: roomType.name,
              description: roomType.description,
              bedrooms: parsedBedrooms,
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
        data.package_room_types = {
          deleteMany: {}, 
          create: [{
            name: 'Default Room',
            description: 'Default room type with uploaded photos',
            price: normalizedPackageData.price || 0,
            currency: 'USD',
            is_default: true,
            is_available: true,
            room_photos: room_photos
          }]
        };
      }

      if (package_availabilities && package_availabilities.length > 0) {
        data.package_availabilities = {
          deleteMany: {}, 
          create: package_availabilities.map((availability: any) => ({
            date: new Date(availability.date),
            status: availability.status,
            rates: availability.rates,
            restrictions: availability.restrictions
          }))
        };
      }

      const result = await this.prisma.package.update({
        where: { id: packageId },
        data,
        include: {
          package_files: true,
          package_room_types: true,
          package_availabilities: true,
          package_policies: {
            where: { deleted_at: null },
            select: {
              id: true,
              description: true,
              package_policies: true,
              created_at: true,
              updated_at: true
            }
          },
          user: true
        }
      });

      try {
        const basePrice = Number((normalizedPackageData as any)?.price ?? (result as any).price ?? 0);
        const discountPercent = Math.max(0, Math.min(100, Number((normalizedPackageData as any)?.discount ?? (result as any).discount ?? 0) || 0));
        const fee = Number((normalizedPackageData as any)?.service_fee ?? (result as any).service_fee ?? 0) || 0;
        const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
        const computed_price = discounted + (isNaN(fee) ? 0 : fee);
        await this.prisma.package.update({ where: { id: result.id }, data: { computed_price } });
      } catch (e) {
        console.error('Failed to compute/persist computed_price (vendor updateWithFiles):', e?.message || e);
      }

      let parsedPackagePolicies = normalizedPackageData.package_policies;
      if (typeof normalizedPackageData.package_policies === 'string') {
        try {
          parsedPackagePolicies = JSON.parse(normalizedPackageData.package_policies);
        } catch (error) {
          console.error('Failed to parse package_policies JSON in updateWithFiles:', error);
          parsedPackagePolicies = undefined;
        }
      }

      if (parsedPackagePolicies && Array.isArray(parsedPackagePolicies)) {
        try {
          await this.prisma.packagePolicy.deleteMany({
            where: {
              packages: {
                some: {
                  id: result.id
                }
              }
            }
          });
          
          const items = parsedPackagePolicies.filter(
            (policy) => policy.title && policy.description && policy.description.trim() !== ''
          );
          
          if (items.length > 0) {
            const createdPolicy = await this.prisma.packagePolicy.create({
              data: {
                description: (normalizedPackageData as any)?.policy_description ?? null,
                package_policies: items as any,
              },
            });
            
            await this.prisma.package.update({
              where: { id: result.id },
              data: {
                package_policies: {
                  connect: { id: createdPolicy.id },
                },
              },
            });
          }
        } catch (e) {
          console.error('Failed to update package policies in updateWithFiles:', e?.message || e);
        }
      }

      const processedResult = {
        ...result,
        package_policies: {
          data: Array.isArray((result as any).package_policies)
            ? ((result as any).package_policies[0]?.package_policies ?? [])
            : []
        },
        package_files: (result.package_files || []).map((file) => ({
          ...file,
          file_url: this.generateFileUrl(file.file, 'package'),
        })),
        package_room_types: (result.package_room_types || []).map((roomType) => {
          
          let processedRoomPhotos = roomType.room_photos;
          if (Array.isArray(roomType.room_photos)) {
            processedRoomPhotos = roomType.room_photos.map((photo: any) => {
              if (typeof photo === 'string') {
                const photoUrl = this.generateFileUrl(photo, 'package');
                return photoUrl;
              }
              return photo;
            });
          }
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
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: packageId },
      });

      if (!packageRecord) {
        throw new Error('Package not found');
      }

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
        if (booking.user_id !== userId) {
          throw new Error('You can only review bookings that belong to you');
        }

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
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: packageId },
      });

      if (!packageRecord) {
        throw new Error('Package not found');
      }
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

      const totalReviews = await this.prisma.review.count({
        where: {
          package_id: packageId,
          deleted_at: null,
          status: 1,
        },
      });

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

      const distributionAgg = await this.prisma.review.groupBy({
        by: ['rating_value'],
        where: {
          package_id: packageId,
          deleted_at: null,
          status: 1,
        },
        _count: { rating_value: true },
      });

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const stat of distributionAgg as any[]) {
        const bucket = Math.round(stat.rating_value as number);
        if (bucket >= 1 && bucket <= 5) {
          ratingDistribution[bucket] = stat._count?.rating_value ?? 0;
        }
      }

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
            ratingDistribution,
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
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: packageId },
      });

      if (!packageRecord) {
        throw new Error('Package not found');
      }

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
  async createWithCalendar(
    createVendorPackageDto: CreateVendorPackageDto, 
    userId: string, 
    files?: any
  ) {
    try {
      const packageResult = await this.createWithFiles(createVendorPackageDto, userId, files);
      
      if (!packageResult.success) {
        return packageResult;
      }

      const packageId = packageResult.data.id;

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

  private async initializePropertyCalendarDefault(packageId: string, userId: string) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12);

    const dates = this.generateDateRange(startDate, endDate);
    
    const calendarData = dates.map(date => ({
      package_id: packageId,
      date: date,
      status: 'available',
      reason: null,
      room_type_id: null
    }));

    await this.prisma.propertyCalendar.createMany({
      data: calendarData
    });
  }

  async initializePropertyCalendar(
    packageId: string,
    userId: string,
    calendarInitDto: CalendarInitDto
  ) {
    try {
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

  async getPropertyCalendarData(
    packageId: string, 
    userId: string, 
    month: string, 
    roomTypeId?: string
  ) {
    try {
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

  private async getCalendarDataForPackage(
    packageId: string,
    month: string,
    roomTypeId?: string
  ) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); 

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
          room_type_id: entry.room_type_id,
          price: entry.price
        })),
        roomTypes: roomTypes
      }
    };
  }

  async updatePropertyCalendarDate(
    packageId: string,
    userId: string,
    updateDto: SingleDateUpdateDto
  ) {
    try {
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

      let calendarEntry = await this.prisma.propertyCalendar.findFirst({
        where: {
          package_id: packageId,
          date: updateDto.date,
          room_type_id: updateDto.room_type_id || null
        }
      });

      if (calendarEntry) {
        calendarEntry = await this.prisma.propertyCalendar.update({
          where: { id: calendarEntry.id },
          data: {
            status: updateDto.status,
            reason: updateDto.reason,
            ...(updateDto.price !== undefined ? { price: updateDto.price } : {})
          }
        });
      } else {
        calendarEntry = await this.prisma.propertyCalendar.create({
          data: {
            package_id: packageId,
            date: updateDto.date,
            status: updateDto.status,
            reason: updateDto.reason,
            room_type_id: updateDto.room_type_id || null,
            ...(updateDto.price !== undefined ? { price: updateDto.price } : {})
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

  async updatePropertyCalendarBulk(
    packageId: string,
    userId: string,
    bulkUpdateDto: BulkDateRangeUpdateDto
  ) {
    try {
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

      if (bulkUpdateDto.end_date <= bulkUpdateDto.start_date) {
        throw new Error('End date must be after start date');
      }

      const dates = this.generateDateRange(
        bulkUpdateDto.start_date,
        bulkUpdateDto.end_date
      );

      const calendarData = dates.map(date => ({
        package_id: packageId,
        date: date,
        status: bulkUpdateDto.status,
        reason: bulkUpdateDto.reason,
        room_type_id: bulkUpdateDto.room_type_id || null,
        ...(bulkUpdateDto.price !== undefined ? { price: bulkUpdateDto.price } : {})
      }));

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
                reason: data.reason,
                ...(data.price !== undefined ? { price: data.price } : {})
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

  async getPropertyCalendarSummary(
    packageId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    roomTypeId?: string
  ) {
    try {
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

      const calendarData = await this.prisma.propertyCalendar.findMany({
        where,
        orderBy: {
          date: 'asc'
        }
      });

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
            room_type_id: entry.room_type_id,
            price: entry.price
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

  private generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

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

  private async storeCalendarConfiguration(
    packageId: string,
    startDate?: Date,
    endDate?: Date,
    closeDates?: Date[],
    closeDateRanges?: Array<{start_date: Date; end_date: Date; reason?: string}>
  ) {
    try {
      const configRecord = await this.prisma.propertyCalendar.create({
        data: {
          package_id: packageId,
          date: new Date('1900-01-01'), 
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
      return configRecord;
    } catch (error) {
      console.error('Failed to store calendar configuration:', error);
    }
  }

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
      const packageData = await this.prisma.package.findUnique({
        where: { id: packageId },
        select: { type: true }
      });

      const calendarStart = startDate || new Date();
      const calendarEnd = endDate || (() => {
        const end = new Date();
        end.setMonth(end.getMonth() + 12);
        return end;
      })();

      const dates = this.generateDateRange(calendarStart, calendarEnd);
      
      if (packageData?.type === 'tour') {
        const createdDate = new Date();
        const calendarData = [{
          package_id: packageId,
          date: createdDate,
          status: 'available',
          reason: null,
          room_type_id: null
        }];

        await this.prisma.propertyCalendar.createMany({
          data: calendarData
        });
        return;
      }

      if (packageData?.type === 'apartment' || packageData?.type === 'hotel') {
        const roomTypes = await this.prisma.packageRoomType.findMany({
          where: { 
            package_id: packageId,
            deleted_at: null 
          },
          select: { id: true }
        });

        const calendarData = [];

        for (const date of dates) {
          let status = 'available';
          let reason = null;

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

          if (roomTypes.length > 0) {
            for (const roomType of roomTypes) {
              calendarData.push({
                package_id: packageId,
                date: date,
                status: status,
                reason: reason,
                room_type_id: roomType.id
              });
            }
          } else {
            calendarData.push({
              package_id: packageId,
              date: date,
              status: status,
              reason: reason,
            });
          }
        }

        if (calendarData.length > 0) {
          await this.prisma.propertyCalendar.createMany({
            data: calendarData
          });
        }
      } else {
        const calendarData = dates.map(date => {
          let status = 'available';
          let reason = null;

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

        await this.prisma.propertyCalendar.createMany({
          data: calendarData
        });
      }
    } catch (error) {
      console.error('Failed to initialize calendar:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
    }
  }

  private trimObjectKeys<T extends Record<string, any>>(obj: T): T {
    const cleaned: any = {};
    Object.keys(obj || {}).forEach((key) => {
      const trimmedKey = typeof key === 'string' ? key.trim() : key;
      cleaned[trimmedKey] = obj[key];
    });
    return cleaned as T;
  }

  /**
   * Validate pricing rules business logic constraints
   */
  private validatePricingRulesBusinessLogic(pricingRules: any) {
    const {
      base_price,
      weekend_price,
      flat_discount,
      min_stay_nights,
      max_stay_nights,
      weekend_days
    } = pricingRules;

    if (min_stay_nights > max_stay_nights) {
      throw new Error('Minimum stay nights cannot be greater than maximum stay nights');
    }

    if (flat_discount > Math.min(base_price, weekend_price)) {
      throw new Error('Flat discount cannot be greater than the minimum of base price or weekend price');
    }

    if (Array.isArray(weekend_days)) {
      for (const day of weekend_days) {
        if (!Number.isInteger(day) || day < 0 || day > 6) {
          throw new Error('Weekend days must be integers between 0-6 (0=Sunday, 6=Saturday)');
        }
      }
    }

    const effectiveBasePrice = base_price - flat_discount;
    const effectiveWeekendPrice = weekend_price - flat_discount;
    
    if (effectiveBasePrice <= 0 || effectiveWeekendPrice <= 0) {
      throw new Error('Effective prices (after flat discount) must be greater than $0');
    }

    const priceDifference = Math.abs(base_price - weekend_price);
    if (priceDifference > 100) {
      throw new Error('Price difference between base and weekend prices cannot exceed $100');
    }

    if (min_stay_nights > 30) {
      throw new Error('Minimum stay cannot exceed 30 nights');
    }

    if (pricingRules.advance_notice_hours > 168) { 
      throw new Error('Advance notice cannot exceed 168 hours (1 week)');
    }
  }

  async updatePricingRules(
    packageId: string,
    userId: string,
    updateDto: {
      pricing_rules: any;
      recompute_calendar?: boolean;
      recompute_start_date?: Date;
      recompute_end_date?: Date;
    }
  ) {
    try {
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

      this.validatePricingRulesBusinessLogic(updateDto.pricing_rules);
      const pricingRules = await this.prisma.packagePricingRule.upsert({
        where: { package_id: packageId },
        update: {
          base_price: updateDto.pricing_rules.base_price,
          weekend_price: updateDto.pricing_rules.weekend_price,
          flat_discount: updateDto.pricing_rules.flat_discount,
          weekly_discount_pct: updateDto.pricing_rules.weekly_discount_pct,
          weekend_days: updateDto.pricing_rules.weekend_days,
          min_stay_nights: updateDto.pricing_rules.min_stay_nights,
          max_stay_nights: updateDto.pricing_rules.max_stay_nights,
          advance_notice_hours: updateDto.pricing_rules.advance_notice_hours,
        },
        create: {
          package_id: packageId,
          base_price: updateDto.pricing_rules.base_price,
          weekend_price: updateDto.pricing_rules.weekend_price,
          flat_discount: updateDto.pricing_rules.flat_discount,
          weekly_discount_pct: updateDto.pricing_rules.weekly_discount_pct,
          weekend_days: updateDto.pricing_rules.weekend_days,
          min_stay_nights: updateDto.pricing_rules.min_stay_nights,
          max_stay_nights: updateDto.pricing_rules.max_stay_nights,
          advance_notice_hours: updateDto.pricing_rules.advance_notice_hours,
        }
      });

      let recomputeResult = null;
      if (updateDto.recompute_calendar !== false) {
        const startDate = updateDto.recompute_start_date || new Date();
        const endDate = updateDto.recompute_end_date || (() => {
          const end = new Date();
          end.setMonth(end.getMonth() + 12);
          return end;
        })();

        recomputeResult = await this.recomputeCalendarPrices(
          packageId,
          userId,
          {
            start_date: startDate,
            end_date: endDate,
            preserve_overrides: true
          }
        );
      }

      return {
        success: true,
        data: {
          pricingRules,
          recomputeResult: recomputeResult?.data || null
        },
        message: 'Pricing rules updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async recomputeCalendarPrices(
    packageId: string,
    userId: string,
    recomputeDto: {
      start_date?: Date;
      end_date?: Date;
      room_type_id?: string;
      preserve_overrides?: boolean;
    }
  ) {
    try {
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

      const pricingRules = await this.prisma.packagePricingRule.findUnique({
        where: { package_id: packageId }
      });

      if (!pricingRules) {
        throw new Error('No pricing rules found for this package');
      }

      const startDate = recomputeDto.start_date || new Date();
      const endDate = recomputeDto.end_date || (() => {
        const end = new Date();
        end.setMonth(end.getMonth() + 12);
        return end;
      })();

      const dates = this.generateDateRange(startDate, endDate);
      
      let updatedCount = 0;
      let preservedCount = 0;
      for (const date of dates) {
        const existingEntry = await this.prisma.propertyCalendar.findFirst({
          where: {
            package_id: packageId,
            date: date,
            room_type_id: recomputeDto.room_type_id || null
          }
        });
        if (recomputeDto.preserve_overrides !== false && existingEntry?.price !== null) {
          preservedCount++;
          continue;
        }
        const newPrice = this.computeEffectivePrice(date, {
          base_price: Number(pricingRules.base_price),
          weekend_price: Number(pricingRules.weekend_price),
          flat_discount: Number(pricingRules.flat_discount),
          weekend_days: pricingRules.weekend_days as number[]
        });
        if (existingEntry) {
          await this.prisma.propertyCalendar.update({
            where: { id: existingEntry.id },
            data: { price: newPrice }
          });
        } else {
          await this.prisma.propertyCalendar.create({
            data: {
              package_id: packageId,
              date: date,
              status: 'available',
              reason: null,
              room_type_id: recomputeDto.room_type_id || null,
              price: newPrice
            }
          });
        }

        updatedCount++;
      }

      return {
        success: true,
        data: {
          packageId,
          dateRange: {
            start: startDate,
            end: endDate
          },
          totalDates: dates.length,
          updatedCount,
          preservedCount,
          roomTypeId: recomputeDto.room_type_id || null
        },
        message: `Calendar recomputed: ${updatedCount} dates updated, ${preservedCount} overrides preserved`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  
  async getPricingRules(packageId: string, userId: string) {
    try {
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

      const pricingRules = await this.prisma.packagePricingRule.findUnique({
        where: { package_id: packageId }
      });

      return {
        success: true,
        data: pricingRules,
        message: pricingRules ? 'Pricing rules found' : 'No pricing rules found'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Create room-type wise availability for apartment/hotel packages
   */
  private async createRoomTypeWiseAvailability(
    packageId: string,
    packageAvailabilities: any[],
    roomTypes: any[]
  ) {
    try {
      const availabilityData = [];
      for (const availability of packageAvailabilities) {
        const availabilityDate = new Date(availability.date);
        
        if (roomTypes.length > 0) {
          for (const roomType of roomTypes) {
            availabilityData.push({
              package_id: packageId,
              date: availabilityDate,
              status: availability.status || 'available',
              rates: availability.rates || null,
              restrictions: availability.restrictions || null,
              room_type_id: roomType.id
            });
          }
        } else {
          availabilityData.push({
            package_id: packageId,
            date: availabilityDate,
            status: availability.status || 'available',
            rates: availability.rates || null,
            restrictions: availability.restrictions || null,
            room_type_id: null
          });
        }
      }
      if (availabilityData.length > 0) {
        await this.prisma.packageAvailability.createMany({
          data: availabilityData
        });
      }

      console.log(`✅ Created ${availabilityData.length} availability records for package ${packageId}`);
    } catch (error) {
      console.error('❌ Failed to create room-type wise availability:', error);
    }
  }
  async getPackageAvailabilitySummary(packageId: string) {
    try {
      const packageData = await this.prisma.package.findUnique({
        where: { id: packageId },
        select: { 
          id: true, 
          name: true, 
          type: true,
          created_at: true 
        }
      });

      if (!packageData) {
        throw new Error('Package not found');
      }
      const availabilityRecords = await this.prisma.packageAvailability.findMany({
        where: { package_id: packageId },
        orderBy: [
          { date: 'asc' }
        ]
      });
      const roomTypes = await this.prisma.packageRoomType.findMany({
        where: { 
          package_id: packageId,
          deleted_at: null 
        },
        select: { id: true, name: true }
      });
      const calendarConfig = await this.getCalendarConfiguration(packageId);
      const availabilityByDate = availabilityRecords.reduce((acc, record) => {
        const dateKey = record.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push({
          id: record.id,
          status: record.status,
          rates: record.rates,
          restrictions: record.restrictions
        });
        return acc;
      }, {});

      return {
        success: true,
        data: {
          package: packageData,
          roomTypes: roomTypes,
          calendarConfiguration: calendarConfig,
          availabilitySummary: {
            totalRecords: availabilityRecords.length,
            dateRange: {
              start: availabilityRecords[0]?.date,
              end: availabilityRecords[availabilityRecords.length - 1]?.date
            },
            availabilityByDate: availabilityByDate,
            roomTypeCount: roomTypes.length,
            datesCount: Object.keys(availabilityByDate).length
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
