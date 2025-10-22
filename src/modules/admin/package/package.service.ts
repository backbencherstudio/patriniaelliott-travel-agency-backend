import { Injectable } from '@nestjs/common';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';
import { DateHelper } from '../../../common/helper/date.helper';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { NotificationRepository } from '../../../common/repository/notification/notification.repository';
import { NotificationGateway } from '../../application/notification/notification.gateway';

@Injectable()
export class PackageService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(
    user_id: string,
    createPackageDto: CreatePackageDto,
    files: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
      trip_plans_by_index?: Record<number, Express.Multer.File[]>;
    },
  ) {
    try {
      const data: any = {};
      if (createPackageDto.name) {
        data.name = createPackageDto.name;
      }
      if (createPackageDto.description) {
        data.description = createPackageDto.description;
      }
      if (createPackageDto.price) {
        data.price = createPackageDto.price;
      }
      if (createPackageDto.duration) {
        data.duration = Number(createPackageDto.duration);
      }
      if (createPackageDto.duration_type) {
        data.duration_type = createPackageDto.duration_type;
      }
      if (createPackageDto.type) {
        data.type = createPackageDto.type;
      }
      if (createPackageDto.min_capacity) {
        data.min_capacity = Number(createPackageDto.min_capacity);
      }
      if (createPackageDto.max_capacity) {
        data.max_capacity = Number(createPackageDto.max_capacity);
      }
      // service_fee Decimal? on Package
      if ((createPackageDto as any).service_fee != null) {
        const fee = Number((createPackageDto as any).service_fee);
        if (!Number.isNaN(fee)) {
          data.service_fee = fee;
        }
      }
      // numeric discounts on Package (schema: Package.discount Int?)
      if ((createPackageDto as any).discount != null) {
        const discountNum = Number((createPackageDto as any).discount);
        if (!Number.isNaN(discountNum)) {
          // Clamp discount to 0..100 as it represents percentage
          const clamped = Math.max(0, Math.min(100, Math.trunc(discountNum)));
          data.discount = clamped;
        }
      }
      if (createPackageDto.cancellation_policy) {
        data.cancellation_policy = JSON.parse(createPackageDto.cancellation_policy);
      }
      if (createPackageDto.bedrooms) {
        data.bedrooms = JSON.parse(createPackageDto.bedrooms);
      }
      if (createPackageDto.address) {
        data.address = createPackageDto.address;
      }
      if (createPackageDto.amenities) {
        data.amenities = JSON.parse(createPackageDto.amenities);
      }
      if (createPackageDto.bathrooms) {
        data.bathrooms = Number(createPackageDto.bathrooms);
      }
      if (createPackageDto.city) {
        data.city = createPackageDto.city;
      }
      if (createPackageDto.country) {
        data.country = createPackageDto.country;
      }
      if (createPackageDto.latitude) {
        data.latitude = Number(createPackageDto.latitude);
      }
      if (createPackageDto.longitude) {
        data.longitude = Number(createPackageDto.longitude);
      }
      if (createPackageDto.postal_code) {
        data.postal_code = createPackageDto.postal_code;
      }
      if (createPackageDto.unit_number) {
        data.unit_number = createPackageDto.unit_number;
      }
      if (createPackageDto.size_sqm) {
        data.size_sqm = Number(createPackageDto.size_sqm);
      }
      if (createPackageDto.max_guests) {
        data.max_guests = Number(createPackageDto.max_guests);
      }
      if (createPackageDto.tour_type) {
        data.tour_type = createPackageDto.tour_type;
      }
      if (createPackageDto.meting_points) {
        data.meting_points = createPackageDto.meting_points;
      }
      // extra_services JSON saved directly on Package (in addition to relations if used)
      if ((createPackageDto as any).extra_services !== undefined) {
        try {
          const raw = (createPackageDto as any).extra_services;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          data.extra_services = parsed;
        } catch {}
      }
      // add vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type != 'vendor') {
        data.approved_at = DateHelper.now();
      }

      const record = await this.prisma.package.create({
        data: {
          ...data,
          user_id: user_id,
        },
      });

      // Compute and persist computed_price
      try {
        const basePrice = Number(data.price ?? 0);
        const discountPercent = Number(data.discount ?? 0);
        const fee = Number(data.service_fee ?? 0);
        const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
        const computed_price = discounted + (isNaN(fee) ? 0 : fee);
        await this.prisma.package.update({
          where: { id: record.id },
          data: { computed_price },
        });
      } catch (e) {
        console.error('Failed to compute/persist computed_price on create:', e?.message || e);
      }

      // create and link PackagePolicy if provided (schema: PackagePolicy { package_policies Json?, description String? })
      try {
        const policyItems = [
          { title: 'transportation', description: (createPackageDto as any)?.transportation },
          { title: 'meals', description: (createPackageDto as any)?.meals },
          { title: 'guide_tours', description: (createPackageDto as any)?.guide },
          { title: 'add_ons', description: (createPackageDto as any)?.addOns },
          { title: 'cancellation_policy', description: (createPackageDto as any)?.cancellation_policy },
        ].filter((i) => typeof i.description === 'string' && i.description.trim() !== '');

        const policyDescription = (createPackageDto as any)?.policy_description;

        if ((policyItems && policyItems.length > 0) || (typeof policyDescription === 'string' && policyDescription.trim() !== '')) {
          const createdPolicy = await this.prisma.packagePolicy.create({
            data: {
              description: policyDescription ?? null,
              package_policies: policyItems as any,
            },
          });

          await this.prisma.package.update({
            where: { id: record.id },
            data: {
              package_policies: {
                connect: { id: createdPolicy.id },
              },
            },
          });
        }
      } catch (e) {
        // If policy creation fails, continue without blocking package creation
        console.error('Failed to create/link PackagePolicy:', e?.message || e);
      }

      // add package files to package
      if (files.package_files && files.package_files.length > 0) {
        console.log('🔍 [SERVICE DEBUG] Processing package files...');
        console.log('🔍 [SERVICE DEBUG] Package files count:', files.package_files.length);
        
        const package_files_data = files.package_files.map((file) => {
          console.log('🔍 [SERVICE DEBUG] Package file info:', {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            destination: file.destination
          });
          
          return {
            file: file.filename,
            file_alt: file.originalname,
            package_id: record.id,
            type: file.mimetype,
          };
        });
        
        console.log('🔍 [SERVICE DEBUG] Creating package files in database...');
        await this.prisma.packageFile.createMany({
          data: package_files_data,
        });
        console.log('✅ [SERVICE DEBUG] Package files created in database successfully');
      }

      // add trip plan to package
      if (createPackageDto.trip_plans) {
        console.log('Processing trip_plans:', createPackageDto.trip_plans);
        const trip_plans = JSON.parse(createPackageDto.trip_plans);
        console.log('Parsed trip_plans:', trip_plans);
        for (const [idx, trip_plan] of trip_plans.entries()) {
          console.log('Processing trip_plan:', trip_plan);
          const trip_plan_data = {
            title: trip_plan.title,
            description: trip_plan.description,
            time: trip_plan.time, // Store time in time field
            // ticket_free is String? in schema; store as string
            ticket_free: (() => {
              const tf = (trip_plan as any).ticket_free ?? (trip_plan as any).tripPlan ?? [];
              return typeof tf === 'string' ? tf : JSON.stringify(tf);
            })(),
            package_id: record.id,
          };
          console.log('Creating trip_plan with data:', trip_plan_data);
          const trip_plan_record = await this.prisma.packageTripPlan.create({
            data: trip_plan_data,
          });
          console.log('Trip plan created successfully:', trip_plan_record.id);
          if (trip_plan_record) {
            // add trip plan images to trip plan
            const indexedImages = (files as any)?.trip_plans_by_index?.[idx] as Express.Multer.File[] | undefined;
            if (indexedImages && indexedImages.length > 0) {
              const trip_plan_images_data = indexedImages.map(
                (image) => ({
                  image: image.filename,
                  image_alt: image.originalname,
                  package_trip_plan_id: trip_plan_record.id,
                }),
              );
              await this.prisma.packageTripPlanImage.createMany({
                data: trip_plan_images_data,
              });
            } else if (files.trip_plans_images && files.trip_plans_images.length > 0) {
              // Legacy fallback: apply all provided trip_plans_images to each created plan (existing behavior)
              const trip_plan_images_data = files.trip_plans_images.map(
                (image) => ({
                  image: image.filename,
                  image_alt: image.originalname,
                  package_trip_plan_id: trip_plan_record.id,
                }),
              );
              await this.prisma.packageTripPlanImage.createMany({
                data: trip_plan_images_data,
              });
            }
          }
        }
      }

      // add extra services to package
      if (createPackageDto.extra_services) {
        const extra_services = JSON.parse(createPackageDto.extra_services);
        for (const extra_service of extra_services) {
          await this.prisma.packageExtraService.create({
            data: {
              package_id: record.id,
              extra_service_id: extra_service.id,
            },
          });
        }
      }

      // add destination to package
      if (createPackageDto.destinations) {
        console.log('Processing destinations:', createPackageDto.destinations);
        try {
          const destinations = JSON.parse(createPackageDto.destinations);
          console.log('Parsed destinations:', destinations);
          
          // Validate that destination IDs exist
          const destinationIds = destinations.map((dest: any) => dest.id);
          const existingDestinations = await this.prisma.destination.findMany({
            where: { id: { in: destinationIds } },
            select: { id: true, name: true }
          });
          
          const existingIds = existingDestinations.map(dest => dest.id);
          const invalidIds = destinationIds.filter(id => !existingIds.includes(id));
          
          if (invalidIds.length > 0) {
            console.error('Invalid destination IDs:', invalidIds);
            throw new Error(`The following destination IDs do not exist: ${invalidIds.join(', ')}`);
          }
          
          console.log('Valid destinations found:', existingDestinations);
          
          for (const destination of destinations) {
            const existing_destination =
              await this.prisma.packageDestination.findFirst({
                where: {
                  destination_id: destination.id,
                  package_id: record.id,
                },
              });
            if (!existing_destination) {
              console.log(`Creating package destination for destination ID: ${destination.id}`);
              await this.prisma.packageDestination.create({
                data: {
                  destination_id: destination.id,
                  package_id: record.id,
                },
              });
              console.log(`Package destination created successfully for: ${destination.id}`);
            } else {
              console.log(`Package destination already exists for: ${destination.id}`);
            }
          }
        } catch (error) {
          console.error('Error processing destinations:', error);
          throw new Error(`Failed to process destinations: ${error.message}`);
        }
      }

      // add tag to included_packages
      if (createPackageDto.included_packages) {
        const included_packages = JSON.parse(
          createPackageDto.included_packages,
        );
        for (const tag of included_packages) {
          const existing_tag = await this.prisma.packageTag.findFirst({
            where: {
              tag_id: tag.id,
              package_id: record.id,
              type: 'included',
            },
          });
          if (!existing_tag) {
            await this.prisma.packageTag.create({
              data: {
                tag_id: tag.id,
                package_id: record.id,
                type: 'included',
              },
            });
          }
        }
      }

      // add traveller_type to package
      if (createPackageDto.traveller_types) {
        const traveller_types = JSON.parse(createPackageDto.traveller_types);
        for (const traveller_type of traveller_types) {
          const existing_traveller_type =
            await this.prisma.packageTravellerType.findFirst({
              where: {
                package_id: record.id,
                traveller_type_id: traveller_type.id,
              },
            });
          if (!existing_traveller_type) {
            await this.prisma.packageTravellerType.create({
              data: {
                package_id: record.id,
                traveller_type_id: traveller_type.id,
              },
            });
          }
        }
      }

      // add language to package
      if (createPackageDto.languages) {
        const languages = JSON.parse(createPackageDto.languages);
        for (const language of languages) {
          const existing_language = await this.prisma.packageLanguage.findFirst(
            {
              where: {
                language_id: language.id,
                package_id: record.id,
              },
            },
          );
          if (!existing_language) {
            await this.prisma.packageLanguage.create({
              data: {
                language_id: language.id,
                package_id: record.id,
              },
            });
          }
        }
      }

      // add tag to excluded_packages
      if (createPackageDto.excluded_packages) {
        const excluded_packages = JSON.parse(
          createPackageDto.excluded_packages,
        );
        for (const tag of excluded_packages) {
          const existing_tag = await this.prisma.packageTag.findFirst({
            where: {
              tag_id: tag.id,
              package_id: record.id,
              type: 'excluded',
            },
          });
          if (!existing_tag) {
            await this.prisma.packageTag.create({
              data: {
                tag_id: tag.id,
                package_id: record.id,
                type: 'excluded',
              },
            });
          }
        }
      }
      // add category to package
      if (createPackageDto.package_category) {
        // const package_category = JSON.parse(createPackageDto.package_category);
        // for (const category of package_category) {
        //   await this.prisma.packageCategory.create({
        //     data: {
        //       category_id: category.id,
        //       package_id: record.id,
        //     },
        //   });
        // }
        // check if category exists
        const category = await this.prisma.category.findUnique({
          where: {
            id: createPackageDto.package_category,
          },
        });

        if (!category) {
          return {
            success: false,
            message: 'Category not found',
          };
        }

        await this.prisma.packageCategory.create({
          data: {
            category_id: category.id,
            package_id: record.id,
          },
        });
      }

      if (userDetails && userDetails.type != 'admin') {
        // Create notification using new repository method
        await NotificationRepository.createPackageNotification({
          package_id: record.id,
          vendor_id: user_id,
        });

        // Get and notify all admins
        const adminUsers = await this.prisma.user.findMany({
          where: { type: 'admin' },
          select: { id: true }
        });
        
        adminUsers.forEach(admin => {
          this.notificationGateway.server.emit('sendNotification', {
            userId: admin.id,
            type: 'package',
            message: 'New package created by vendor, needs approval',
            data: record
          });
        });
      }

      const detailed = await this.findOne(record.id, user_id);
      return {
        success: true,
        message: 'Package created successfully',
        data: detailed.success ? detailed.data : { id: record.id },
      };
    } catch (error) {
      // delete package images from storage
      if (files && files.package_files && files.package_files.length > 0) {
        for (const file of files.package_files) {
          await SojebStorage.delete(
            appConfig().storageUrl.package + file.filename,
          );
        }
      }

      // delete trip plans images from storage
      if (
        files &&
        files.trip_plans_images &&
        files.trip_plans_images.length > 0
      ) {
        for (const image of files.trip_plans_images) {
          await SojebStorage.delete(
            appConfig().storageUrl.package + image.filename,
          );
        }
      }
      // delete indexed trip plans images from storage
      if (files && (files as any).trip_plans_by_index) {
        for (const key of Object.keys((files as any).trip_plans_by_index)) {
          const list: Express.Multer.File[] = (files as any).trip_plans_by_index[key] || [];
          for (const image of list) {
            await SojebStorage.delete(appConfig().storageUrl.package + image.filename);
          }
        }
      }
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll(
    user_id?: string,
    vendor_id?: string,
    filters?: {
      q?: string;
      type?: string;
    },
    additionalWhere?: any,
  ) {
    try {
      const where_condition = {};
      // filter using vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type == 'vendor') {
        where_condition['user_id'] = user_id;
      }

      if (vendor_id) {
        where_condition['user_id'] = vendor_id;
      }

      if (filters) {
        if (filters.q) {
          where_condition['name'] = {
            contains: filters.q,
            mode: 'insensitive',
          };
        }
        if (filters.type) {
          where_condition['type'] = filters.type;
        }
      }

      // Merge additional where conditions
      if (additionalWhere) {
        Object.assign(where_condition, additionalWhere);
      }

      const packages = await this.prisma.package.findMany({
        where: { ...where_condition },
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          status: true,
          approved_at: true,
          user_id: true,
          name: true,
          description: true,
          price: true,
          computed_price: true,
          discount: true,
          duration: true,
          min_capacity: true,
          max_capacity: true,
          type: true,
          service_fee: true,
          user: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          package_languages: {
            select: {
              language: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          package_destinations: {
            select: {
              destination: {
                select: {
                  id: true,
                  name: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          // cancellation_policy_id: true,
          package_categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          package_files: {
            select: {
              id: true,
              file: true,
              file_alt: true,
              type: true,
            },
          },
          package_trip_plans: {
            select: {
              id: true,
              title: true,
              description: true,
              package_trip_plan_images: {
                select: {
                  id: true,
                  image: true,
                  image_alt: true,
                },
              },
            },
          },
          package_policies: {
            select: {
              id: true,
              description: true,
              package_policies: true,
            },
          },
        },
      });

      // Note: Image URLs are now generated in the controller using addImageUrls method
      // Attach computed price per item: price - price*(discount/100) + service_fee
      const withComputed = packages.map((pkg: any) => {
        const basePrice = Number(pkg.price ?? 0);
        const discountPercent = Number(pkg.discount ?? 0);
        const fee = Number(pkg.service_fee ?? 0);
        const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
        const computed_price = discounted + (isNaN(fee) ? 0 : fee);
        return { ...pkg, computed_price };
      });

      return {
        success: true,
        data: withComputed,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAllWithPagination(
    user_id?: string,
    vendor_id?: string,
    filters?: {
      q?: string;
      type?: string;
    },
    additionalWhere?: any,
    paginationOptions?: {
      page: number;
      limit: number;
      skip: number;
      sort_by: string;
      sort_order: 'asc' | 'desc';
    },
  ) {
    try {
      const where_condition = {};
      
      // filter using vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type == 'vendor') {
        where_condition['user_id'] = user_id;
      }

      if (vendor_id) {
        where_condition['user_id'] = vendor_id;
      }

      if (filters) {
        if (filters.q) {
          where_condition['name'] = {
            contains: filters.q,
            mode: 'insensitive',
          };
        }
        if (filters.type) {
          where_condition['type'] = filters.type;
        }
      }

      // Merge additional where conditions
      if (additionalWhere) {
        Object.assign(where_condition, additionalWhere);
      }

      // Get total count for pagination
      const totalCount = await this.prisma.package.count({
        where: { ...where_condition },
      });

      // Build orderBy object
      const orderBy = {};
      orderBy[paginationOptions?.sort_by || 'created_at'] = paginationOptions?.sort_order || 'desc';

      // Get paginated packages
      const packages = await this.prisma.package.findMany({
        where: { ...where_condition },
        skip: paginationOptions?.skip || 0,
        take: paginationOptions?.limit || 10,
        orderBy: orderBy,
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          status: true,
          approved_at: true,
          user_id: true,
          name: true,
          description: true,
          price: true,
          computed_price: true,
          discount: true,
          duration: true,
          min_capacity: true,
          max_capacity: true,
          type: true,
          service_fee: true,
          user: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          package_languages: {
            select: {
              language: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          package_destinations: {
            select: {
              destination: {
                select: {
                  id: true,
                  name: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          package_categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          package_files: {
            select: {
              id: true,
              file: true,
              file_alt: true,
              type: true,
            },
          },
          package_trip_plans: {
            select: {
              id: true,
              title: true,
              description: true,
              package_trip_plan_images: {
                select: {
                  id: true,
                  image: true,
                  image_alt: true,
                },
              },
            },
          },
          package_policies: {
            select: {
              id: true,
              description: true,
              package_policies: true,
            },
          },
        },
      });

      // Attach computed price per item: price - price*(discount/100) + service_fee
      const withComputed = packages.map((pkg: any) => {
        const basePrice = Number(pkg.price ?? 0);
        const discountPercent = Number(pkg.discount ?? 0);
        const fee = Number(pkg.service_fee ?? 0);
        const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
        const computed_price = discounted + (isNaN(fee) ? 0 : fee);
        return { ...pkg, computed_price };
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / (paginationOptions?.limit || 10));
      const currentPage = paginationOptions?.page || 1;
      const hasNextPage = currentPage < totalPages;
      const hasPrevPage = currentPage > 1;

      console.log('🔍 [SERVICE DEBUG] Pagination calculation:', {
        totalCount,
        limit: paginationOptions?.limit || 10,
        totalPages,
        currentPage,
        hasNextPage,
        hasPrevPage,
        withComputedLength: withComputed.length
      });

      const result = {
        success: true,
        data: withComputed,
        pagination: {
          current_page: currentPage,
          total_pages: totalPages,
          total_items: totalCount,
          items_per_page: paginationOptions?.limit || 10,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
          next_page: hasNextPage ? currentPage + 1 : null,
          prev_page: hasPrevPage ? currentPage - 1 : null,
        },
      };

      console.log('🔍 [SERVICE DEBUG] Final result:', {
        success: result.success,
        dataLength: result.data.length,
        pagination: result.pagination
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string, user_id?: string) {
    try {
      const where_condition = {};
      // filter using vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type == 'vendor') {
        where_condition['user_id'] = user_id;
      }

      const record = await this.prisma.package.findUnique({
        where: { id: id, ...where_condition },
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          status: true,
          approved_at: true,
          user_id: true,
          name: true,
          description: true,
          price: true,
          computed_price: true,
          discount: true,
          duration: true,
          duration_type: true,
          min_capacity: true,
          max_capacity: true,
          type: true,
          service_fee: true,
          package_languages: {
            select: {
              language: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          reviews: {
            select: {
              id: true,
              rating_value: true,
              comment: true,
              user_id: true,
            },
          },
          package_destinations: {
            select: {
              destination: {
                select: {
                  id: true,
                  name: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          // cancellation_policy: {
          //   select: {
          //     id: true,
          //     policy: true,
          //     description: true,
          //   },
          // },
          package_categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          package_files: {
            select: {
              id: true,
              file: true,
            },
          },
          package_trip_plans: {
            select: {
              id: true,
              title: true,
              description: true,
              package_trip_plan_images: {
                select: {
                  id: true,
                  image: true,
                },
              },
            },
          },
          package_tags: {
            select: {
              tag_id: true,
              type: true,
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          package_extra_services: {
            select: {
              id: true,
              extra_service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
          package_traveller_types: {
            select: {
              traveller_type: {
                select: {
                  id: true,
                  type: true,
                },
              },
            },
          },
          package_policies: {
            select: {
              id: true,
              description: true,
              package_policies: true,
            },
          },
        },
      });

      if (!record) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // add file url package_files
      if (record && record.package_files.length > 0) {
        for (const file of record.package_files) {
          if (file.file) {
            file['file_url'] = SojebStorage.url(
              appConfig().storageUrl.package + file.file,
            );
          }
        }
      }

      // add image url package_trip_plans
      if (record && record.package_trip_plans.length > 0) {
        for (const trip_plan of record.package_trip_plans) {
          if (trip_plan.package_trip_plan_images) {
            for (const image of trip_plan.package_trip_plan_images) {
              if (image.image) {
                image['image_url'] = SojebStorage.url(
                  appConfig().storageUrl.package + image.image,
                );
              }
            }
          }
        }
      }

      // Attach computed price: price - price*(discount/100) + service_fee
      const basePrice = Number((record as any).price ?? 0);
      const discountPercent = Number((record as any).discount ?? 0);
      const fee = Number((record as any).service_fee ?? 0);
      const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
      const computed_price = discounted + (isNaN(fee) ? 0 : fee);

      return {
        success: true,
        data: { ...record, computed_price },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(
    id: string,
    user_id: string,
    updatePackageDto: UpdatePackageDto,
    files: {
      package_files?: Express.Multer.File[];
      trip_plans_images?: Express.Multer.File[];
      trip_plans_by_index?: Record<number, Express.Multer.File[]>;
    },
  ) {
    try {
      const data: any = {};
      if (updatePackageDto.name) {
        data.name = updatePackageDto.name;
      }
      if (updatePackageDto.description) {
        data.description = updatePackageDto.description;
      }
      if (updatePackageDto.price) {
        data.price = updatePackageDto.price;
      }
      if (updatePackageDto.duration) {
        data.duration = Number(updatePackageDto.duration);
      }
      if (updatePackageDto.duration_type) {
        data.duration_type = updatePackageDto.duration_type;
      }
      if (updatePackageDto.type) {
        data.type = updatePackageDto.type;
      }
      if (updatePackageDto.min_capacity) {
        data.min_capacity = Number(updatePackageDto.min_capacity);
      }
      if (updatePackageDto.max_capacity) {
        data.max_capacity = Number(updatePackageDto.max_capacity);
      }
      // service_fee Decimal? on Package
      if ((updatePackageDto as any).service_fee != null) {
        const fee = Number((updatePackageDto as any).service_fee);
        if (!Number.isNaN(fee)) {
          data.service_fee = fee;
        }
      }
      // if (updatePackageDto.cancellation_policy_id) {
      //   data.cancellation_policy_id = updatePackageDto.cancellation_policy_id;
      // }
      if (updatePackageDto.bedrooms) {
        data.bedrooms = JSON.parse(updatePackageDto.bedrooms);
      }

      // existing package record
      const existing_package = await this.prisma.package.findUnique({
        where: { id: id },
      });

      if (!existing_package) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      const where_condition = {};
      // filter using vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type == 'vendor') {
        where_condition['user_id'] = user_id;
      }

      const record = await this.prisma.package.update({
        where: { id: id, ...where_condition },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });

      // Recompute and persist computed_price after update
      try {
        const basePrice = Number((data.price != null ? data.price : (existing_package as any).price) ?? 0);
        const discountPercent = Number((data.discount != null ? data.discount : (existing_package as any).discount) ?? 0);
        const fee = Number((data.service_fee != null ? data.service_fee : (existing_package as any).service_fee) ?? 0);
        const discounted = basePrice - (basePrice * (isNaN(discountPercent) ? 0 : discountPercent) / 100);
        const computed_price = discounted + (isNaN(fee) ? 0 : fee);
        await this.prisma.package.update({
          where: { id: record.id },
          data: { computed_price },
        });
      } catch (e) {
        console.error('Failed to compute/persist computed_price on update:', e?.message || e);
      }

      // delete package images which is not included in updatePackageDto.package_files
      if (updatePackageDto.package_files) {
        const package_files = JSON.parse(updatePackageDto.package_files);

        // old package files
        const old_package_files = await this.prisma.packageFile.findMany({
          where: { package_id: record.id },
        });
        // delete old package file that are not in the new package files
        for (const old_package_file of old_package_files) {
          if (!package_files.some((pi) => pi.id == old_package_file.id)) {
            await SojebStorage.delete(
              appConfig().storageUrl.package + old_package_file.file,
            );
            await this.prisma.packageFile.delete({
              where: { id: old_package_file.id, package_id: record.id },
            });
          }
        }
      }

      // add package images to package
      if (files.package_files && files.package_files.length > 0) {
        const package_files_data = files.package_files.map((file) => ({
          file: file.filename,
          file_alt: file.originalname,
          package_id: record.id,
          type: file.mimetype,
        }));
        await this.prisma.packageFile.createMany({
          data: package_files_data,
        });
      }

      // delete trip plans which is not included in updatePackageDto.trip_plans
      if (updatePackageDto.trip_plans) {
        const trip_plans = JSON.parse(updatePackageDto.trip_plans);
        // compare trip plans with old trip plans
        const old_trip_plans = await this.prisma.packageTripPlan.findMany({
          where: { package_id: record.id },
        });
        // delete old trip plans with images that are not in the new trip plans
        for (const old_trip_plan of old_trip_plans) {
          if (!trip_plans.some((tp) => tp.id == old_trip_plan.id)) {
            await this.prisma.packageTripPlan.delete({
              where: { id: old_trip_plan.id },
            });
            // delete old trip plan images from storage
            const trip_plan_images =
              await this.prisma.packageTripPlanImage.findMany({
                where: { package_trip_plan_id: old_trip_plan.id },
              });
            for (const image of trip_plan_images) {
              await SojebStorage.delete(
                appConfig().storageUrl.package + image.image,
              );
            }
            // delete old trip plan images from database
            await this.prisma.packageTripPlanImage.deleteMany({
              where: { package_trip_plan_id: old_trip_plan.id },
            });
          }
        }

        // add new trip plans to package
        for (const [idx, trip_plan] of trip_plans.entries()) {
          const trip_plan_data = {
            title: trip_plan.title,
            description: trip_plan.description,
            package_id: record.id,
          };
          if (trip_plan.id == null) {
            const trip_plan_record = await this.prisma.packageTripPlan.create({
              data: trip_plan_data,
            });
            if (trip_plan_record) {
              // add trip plan images to trip plan
              const indexedImages = (files as any)?.trip_plans_by_index?.[idx] as Express.Multer.File[] | undefined;
              if (indexedImages && indexedImages.length > 0) {
                const trip_plan_images_data = indexedImages.map(
                  (image) => ({
                    image: image.filename,
                    image_alt: image.originalname,
                    package_trip_plan_id: trip_plan_record.id,
                  }),
                );
                await this.prisma.packageTripPlanImage.createMany({
                  data: trip_plan_images_data,
                });
              } else if (
                files.trip_plans_images &&
                files.trip_plans_images.length > 0
              ) {
                // Legacy fallback
                const trip_plan_images_data = files.trip_plans_images.map(
                  (image) => ({
                    image: image.filename,
                    image_alt: image.originalname,
                    package_trip_plan_id: trip_plan_record.id,
                  }),
                );
                await this.prisma.packageTripPlanImage.createMany({
                  data: trip_plan_images_data,
                });
              }
            }
          } else {
            // update trip plan
            await this.prisma.packageTripPlan.update({
              where: { id: trip_plan.id },
              data: trip_plan_data,
            });

            // delete old trip plan images from storage which is not in the new trip plans
            const old_trip_plan_images =
              await this.prisma.packageTripPlanImage.findMany({
                where: { package_trip_plan_id: trip_plan.id },
              });
            for (const image of old_trip_plan_images) {
              const trip_plans_images = JSON.parse(
                updatePackageDto.trip_plans_images,
              );
              if (!trip_plans_images.some((tp) => tp.id == image.id)) {
                await SojebStorage.delete(
                  appConfig().storageUrl.package + image.image,
                );
                await this.prisma.packageTripPlanImage.delete({
                  where: {
                    id: image.id,
                    package_trip_plan_id: trip_plan.id,
                  },
                });
              }
            }

            // add trip plan images to trip plan
            const indexedImages = (files as any)?.trip_plans_by_index?.[idx] as Express.Multer.File[] | undefined;
            if (indexedImages && indexedImages.length > 0) {
              const trip_plan_images_data = indexedImages.map(
                (image) => ({
                  image: image.filename,
                  image_alt: image.originalname,
                  package_trip_plan_id: trip_plan.id,
                }),
              );
              await this.prisma.packageTripPlanImage.createMany({
                data: trip_plan_images_data,
              });
            } else if (files.trip_plans_images && files.trip_plans_images.length > 0) {
              // Legacy fallback
              const trip_plan_images_data = files.trip_plans_images.map(
                (image) => ({
                  image: image.filename,
                  image_alt: image.originalname,
                  package_trip_plan_id: trip_plan.id,
                }),
              );
              await this.prisma.packageTripPlanImage.createMany({
                data: trip_plan_images_data,
              });
            }
          }
        }
      }

      // add tag to included_packages. check if tag already exists in package_tags table
      if (updatePackageDto.included_packages) {
        const included_packages = JSON.parse(
          updatePackageDto.included_packages,
        );
        for (const tag of included_packages) {
          const existing_tag = await this.prisma.packageTag.findFirst({
            where: {
              tag_id: tag.id,
              package_id: record.id,
              type: 'included',
            },
          });
          if (!existing_tag) {
            await this.prisma.packageTag.create({
              data: {
                tag_id: tag.id,
                package_id: record.id,
                type: 'included',
              },
            });
          }
        }
      }

      // add tag to excluded_packages. check if tag already exists in package_tags table
      if (updatePackageDto.excluded_packages) {
        const excluded_packages = JSON.parse(
          updatePackageDto.excluded_packages,
        );
        for (const tag of excluded_packages) {
          const existing_tag = await this.prisma.packageTag.findFirst({
            where: {
              tag_id: tag.id,
              package_id: record.id,
              type: 'excluded',
            },
          });
          if (!existing_tag) {
            await this.prisma.packageTag.create({
              data: {
                tag_id: tag.id,
                package_id: record.id,
                type: 'excluded',
              },
            });
          }
        }
      }

      // add traveller_type to package
      if (updatePackageDto.traveller_types) {
        const traveller_types = JSON.parse(updatePackageDto.traveller_types);
        for (const traveller_type of traveller_types) {
          const existing_traveller_type =
            await this.prisma.packageTravellerType.findFirst({
              where: {
                package_id: record.id,
                traveller_type_id: traveller_type.id,
              },
            });
          if (!existing_traveller_type) {
            await this.prisma.packageTravellerType.create({
              data: {
                package_id: record.id,
                traveller_type_id: traveller_type.id,
              },
            });
          }
        }
      }

      // add category to package
      if (updatePackageDto.package_category) {
        // const package_category = JSON.parse(createPackageDto.package_category);
        // for (const category of package_category) {
        //   await this.prisma.packageCategory.create({
        //     data: {
        //       category_id: category.id,
        //       package_id: record.id,
        //     },
        //   });
        // }
        // check if category exists
        const category = await this.prisma.category.findUnique({
          where: {
            id: updatePackageDto.package_category,
          },
        });

        if (!category) {
          return {
            success: false,
            message: 'Category not found',
          };
        }

        // check if package category already exists
        const existing_package_category =
          await this.prisma.packageCategory.findMany({
            where: {
              package_id: record.id,
            },
          });

        if (existing_package_category && existing_package_category.length > 0) {
          // delete existing package category
          await this.prisma.packageCategory.deleteMany({
            where: {
              package_id: record.id,
            },
          });
        }

        await this.prisma.packageCategory.create({
          data: {
            category_id: category.id,
            package_id: record.id,
          },
        });
      }

      // add extra services to package
      if (updatePackageDto.extra_services) {
        const extra_services = JSON.parse(updatePackageDto.extra_services);
        // delete old extra services
        await this.prisma.packageExtraService.deleteMany({
          where: { package_id: record.id },
        });
        for (const extra_service of extra_services) {
          await this.prisma.packageExtraService.create({
            data: {
              package_id: record.id,
              extra_service_id: extra_service.id,
            },
          });
        }
      }

      // add language to package
      if (updatePackageDto.languages) {
        const languages = JSON.parse(updatePackageDto.languages);
        for (const language of languages) {
          const existing_language = await this.prisma.packageLanguage.findFirst(
            {
              where: {
                language_id: language.id,
                package_id: record.id,
              },
            },
          );
          if (!existing_language) {
            await this.prisma.packageLanguage.create({
              data: {
                language_id: language.id,
                package_id: record.id,
              },
            });
          }
        }
      }

      // add destination to package
      if (updatePackageDto.destinations) {
        const destinations = JSON.parse(updatePackageDto.destinations);
        for (const destination of destinations) {
          const existing_destination =
            await this.prisma.packageDestination.findFirst({
              where: {
                destination_id: destination.id,
                package_id: record.id,
              },
            });
          if (!existing_destination) {
            await this.prisma.packageDestination.create({
              data: {
                destination_id: destination.id,
                package_id: record.id,
              },
            });
          }
        }
      }

      return {
        success: true,
        message: 'Package updated successfully',
      };
    } catch (error) {
      // delete package images from storage
      if (files && files.package_files && files.package_files.length > 0) {
        for (const image of files.package_files) {
          await SojebStorage.delete(
            appConfig().storageUrl.package + image.filename,
          );
        }
      }

      // delete trip plans images from storage
      if (
        files &&
        files.trip_plans_images &&
        files.trip_plans_images.length > 0
      ) {
        for (const image of files.trip_plans_images) {
          await SojebStorage.delete(
            appConfig().storageUrl.package + image.filename,
          );
        }
      }
      // delete indexed trip plans images from storage
      if (files && (files as any).trip_plans_by_index) {
        for (const key of Object.keys((files as any).trip_plans_by_index)) {
          const list: Express.Multer.File[] = (files as any).trip_plans_by_index[key] || [];
          for (const image of list) {
            await SojebStorage.delete(appConfig().storageUrl.package + image.filename);
          }
        }
      }

      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateStatus(id: string, status: number, user_id: string) {
    try {
      const where_condition = {};
      // filter using vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type == 'vendor') {
        where_condition['user_id'] = user_id;
      }

      const record = await this.prisma.package.findUnique({
        where: { id, ...where_condition },
      });

      if (!record) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      await this.prisma.package.update({
        where: { id, ...where_condition },
        data: { status: status },
      });

      return {
        success: true,
        message: 'Package status updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async approve(id: string) {
    try {
      const record = await this.prisma.package.findUnique({
        where: { id },
      });
      if (!record) {
        return {
          success: false,
          message: 'Package not found',
        };
      }
      await this.prisma.package.update({
        where: { id },
        data: { approved_at: new Date() },
      });
      return {
        success: true,
        message: 'Package approved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async reject(id: string) {
    try {
      const record = await this.prisma.package.findUnique({
        where: { id },
      });
      if (!record) {
        return {
          success: false,
          message: 'Package not found',
        };
      }
      await this.prisma.package.update({
        where: { id },
        data: { approved_at: null },
      });
      return {
        success: true,
        message: 'Package rejected successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // delete tags
        await prisma.packageTag.deleteMany({ where: { package_id: id } });
        // delete categories
        await prisma.packageCategory.deleteMany({ where: { package_id: id } });

        // delete trip plans images
        const trip_plans = await prisma.packageTripPlan.findMany({
          where: { package_id: id },
        });
        for (const trip_plan of trip_plans) {
          const trip_plan_images = await prisma.packageTripPlanImage.findMany({
            where: { package_trip_plan_id: trip_plan.id },
          });
          for (const image of trip_plan_images) {
            await SojebStorage.delete(
              appConfig().storageUrl.package + image.image,
            );
          }
          await prisma.packageTripPlanImage.deleteMany({
            where: { package_trip_plan_id: trip_plan.id },
          });
        }
        await prisma.packageTripPlan.deleteMany({
          where: { package_id: id },
        });

        // Delete package images and package
        const packageFiles = await prisma.packageFile.findMany({
          where: { package_id: id },
        });
        for (const file of packageFiles) {
          await SojebStorage.delete(appConfig().storageUrl.package + file.file);
        }

        await prisma.package.delete({ where: { id: id } });

        return {
          success: true,
          message: 'Package deleted successfully',
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
