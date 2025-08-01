import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';
import { CreateReviewDto } from './dto/create-review.dto';
import { MessageGateway } from '../../../modules/chat/message/message.gateway';
import { NotificationRepository } from '../../../common/repository/notification/notification.repository';
import { UpdateReviewDto } from './dto/update-review.dto';
import { SearchPackagesDto } from '../../admin/vendor-package/dto/search-packages.dto';

@Injectable()
export class PackageService {
  constructor(
    private prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) {}

  async searchPackages(searchDto: SearchPackagesDto) {
    const {
      search,
      destination_id,
      category_id,
      start_date,
      end_date,
      adults = 1,
      children = 0,
      infants = 0,
      rooms = 1,
      min_price,
      max_price,
      traveller_types,
      tags,
      page = 1,
      limit = 10,
      sort_by = 'created_at_desc'
    } = searchDto;

    // Calculate total guests
    const totalGuests = adults + children + infants;

    // Build where conditions
    const where: any = {
      deleted_at: null,
      is_available: true,
      status: 1, // Active packages
    };

    // Search term
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Destination filter
    if (destination_id) {
      where.package_destinations = {
        some: {
          destination_id: destination_id,
        },
      };
    }

    // Category filter
    if (category_id) {
      where.package_categories = {
        some: {
          category_id: category_id,
        },
      };
    }

    // Price range filter
    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price.gte = min_price;
      if (max_price) where.price.lte = max_price;
    }

    // Date availability check
    if (start_date && end_date) {
      where.package_availabilities = {
        some: {
          date: {
            gte: start_date,
            lte: end_date,
          },
        },
      };
    }

    // Guest capacity check
    where.package_room_types = {
      some: {
        max_guests: {
          gte: totalGuests,
        },
      },
    };

    // Build sort order
    let orderBy: any = {};
    switch (sort_by) {
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      case 'rating_desc':
        orderBy.average_rating = 'desc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        include: {
          package_destinations: {
            include: {
              destination: {
                select: {
                  id: true,
                  name: true,
                  description: true,
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
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          package_room_types: {
            where: {
              max_guests: {
                gte: totalGuests,
              },
            },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              max_guests: true,
            },
          },
          package_availabilities: start_date && end_date ? {
            where: {
              date: {
                gte: start_date,
                lte: end_date,
              },
            },
            select: {
              date: true,
            },
          } : false,
          package_files: {
            select: {
              id: true,
              file: true,
              type: true,
              file_alt: true,
              sort_order: true,
              is_featured: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.package.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: {
        packages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    };
  }

  async findAll({
    filters: {
      q,
      type,
      duration_start,
      duration_end,
      budget_start,
      budget_end,
      ratings,
      free_cancellation,
      destinations,
      languages,
      cursor,
      limit = 15,
      page,
    },
  }: {
    filters: {
      q?: string;
      type?: string;
      duration_start?: string;
      duration_end?: string;
      budget_start?: number;
      budget_end?: number;
      ratings?: number[];
      free_cancellation?: string[];
      destinations?: string[];
      languages?: string[];
      cursor?: string;
      limit?: number;
      page?: number;
    };
  }) {
    try {
      const where_condition = {};
      const query_condition = {};
      if (q) {
        where_condition['OR'] = [
          { name: { contains: q, mode: 'insensitive' } },
          {
            package_destinations: {
              some: {
                destination: { name: { contains: q, mode: 'insensitive' } },
              },
            },
          },
          {
            package_languages: {
              some: {
                language: { name: { contains: q, mode: 'insensitive' } },
              },
            },
          },
        ];
      }
      if (type) {
        where_condition['type'] = type;
      }
      if (duration_start && duration_end) {
        // const diff = DateHelper.diff(duration_start, duration_end, 'day') + 1;
        // where_condition['duration'] = {
        //   gte: DateHelper.format(duration_start),
        //   lte: DateHelper.format(duration_end),
        // };
      }
      if (budget_start) {
        where_condition['price'] = {
          gte: Number(budget_start),
          // lte: Number(budget_end),
        };

        if (budget_end) {
          where_condition['price']['lte'] = Number(budget_end);
        }
      }

      if (ratings) {
        // if not array
        if (!Array.isArray(ratings)) {
          ratings = [ratings];
        }

        const minRating = Math.min(...ratings);
        const maxRating = Math.max(...ratings);

        where_condition['reviews'] = {
          some: {
            rating_value: {
              // in: ratings.map((rating) => Number(rating)),
              gte: minRating,
            },
          },
        };

        if (ratings.length > 1) {
          where_condition['reviews']['some']['rating_value']['lte'] = maxRating;
        }
      }

      if (free_cancellation) {
        // if not array
        if (!Array.isArray(free_cancellation)) {
          free_cancellation = [free_cancellation];
        }
        where_condition['cancellation_policy'] = {
          id: {
            in: free_cancellation,
          },
        };
      }

      if (destinations) {
        // if not array
        if (!Array.isArray(destinations)) {
          destinations = [destinations];
        }

        where_condition['package_destinations'] = {
          some: {
            destination_id: {
              in: destinations,
            },
          },
        };
      }

      if (languages) {
        if (!Array.isArray(languages)) {
          languages = [languages];
        }
        where_condition['package_languages'] = {
          some: {
            language_id: {
              in: languages,
            },
          },
        };
      }

      // cursor based pagination
      if (cursor) {
        // where_condition['id'] = {
        //   gt: cursor,
        // };
        query_condition['cursor'] = {
          id: cursor,
        };

        query_condition['skip'] = 1;
      }

      // offset based pagination
      if (page) {
        query_condition['skip'] = (page - 1) * limit;
      }

      if (limit) {
        query_condition['take'] = limit;
      }

      const packages = await this.prisma.package.findMany({
        where: {
          ...where_condition,
          status: 1,
          approved_at: {
            not: null,
          },
        },
        orderBy: {
          id: 'asc',
        },
        ...query_condition,
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          user_id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
          min_capacity: true,
          max_capacity: true,
          type: true,
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
          cancellation_policy: {
            select: {
              id: true,
              policy: true,
              description: true,
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
        },
      });

      // add image url package_files
      if (packages && packages.length > 0) {
        for (const record of packages) {
          if (record.package_files) {
            for (const file of record.package_files) {
              file['file_url'] = SojebStorage.url(
                appConfig().storageUrl.package + file.file,
              );
            }
          }
        }
      }

      const pagination = {
        current_page: page,
        total_pages: Math.ceil(packages.length / limit),
        cursor: cursor,
      };

      return {
        success: true,
        pagination: pagination,
        data: packages,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string) {
    try {
      const record = await this.prisma.package.findUnique({
        where: { id: id },
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
          duration: true,
          min_capacity: true,
          max_capacity: true,
          type: true,
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
          cancellation_policy: {
            select: {
              id: true,
              policy: true,
              description: true,
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

      return {
        success: true,
        data: record,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async createReview(
    package_id: string,
    user_id: string,
    createReviewDto: CreateReviewDto,
  ) {
    try {
      const data = {};
      if (createReviewDto.rating_value) {
        data['rating_value'] = createReviewDto.rating_value;
      }
      if (createReviewDto.comment) {
        data['comment'] = createReviewDto.comment;
      }
      if (createReviewDto.booking_id) {
        data['booking_id'] = createReviewDto.booking_id;
      }

      // check if package exists
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: package_id },
      });
      if (!packageRecord) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // check if user has review
      const review = await this.prisma.review.findFirst({
        where: { user_id: user_id, package_id: package_id },
      });
      if (review) {
        return {
          success: false,
          message: 'You have already reviewed this package',
        };
      }
      await this.prisma.review.create({
        data: {
          ...data,
          package_id: package_id,
          user_id: user_id,
        },
      });

      // notify the user that the package is reviewed
      await NotificationRepository.createNotification({
        sender_id: user_id,
        receiver_id: packageRecord.user_id,
        text: 'Your package has been reviewed',
        type: 'review',
        entity_id: package_id,
      });

      this.messageGateway.server.emit('notification', {
        sender_id: user_id,
        receiver_id: packageRecord.user_id,
        text: 'Your package has been reviewed',
        type: 'review',
        entity_id: package_id,
      });

      return {
        success: true,
        message: 'Review created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateReview(
    package_id: string,
    review_id: string,
    user_id: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    try {
      const data = {};
      if (updateReviewDto.rating_value) {
        data['rating_value'] = updateReviewDto.rating_value;
      }
      if (updateReviewDto.comment) {
        data['comment'] = updateReviewDto.comment;
      }

      // check if package exists
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: package_id },
      });
      if (!packageRecord) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // check if user has review
      const review = await this.prisma.review.findFirst({
        where: { user_id: user_id, package_id: package_id },
      });
      if (!review) {
        return {
          success: false,
          message: 'You have not reviewed this package',
        };
      }
      await this.prisma.review.update({
        where: { id: review_id },
        data: {
          ...data,
        },
      });

      // notify the user that the package is reviewed
      await NotificationRepository.createNotification({
        sender_id: user_id,
        receiver_id: packageRecord.user_id,
        text: 'Your package has been reviewed',
        type: 'review',
        entity_id: package_id,
      });

      this.messageGateway.server.emit('notification', {
        sender_id: user_id,
        receiver_id: packageRecord.user_id,
        text: 'Your package has been reviewed',
        type: 'review',
        entity_id: package_id,
      });

      return {
        success: true,
        message: 'Review updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async removeReview(package_id: string, review_id: string, user_id: string) {
    try {
      // check if package exists
      const packageRecord = await this.prisma.package.findFirst({
        where: { id: package_id },
      });
      if (!packageRecord) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // check if user has review
      const review = await this.prisma.review.findFirst({
        where: { id: review_id, user_id: user_id },
      });
      if (!review) {
        return {
          success: false,
          message: 'Review not found',
        };
      }
      await this.prisma.review.delete({
        where: {
          id: review_id,
          user_id: user_id,
          package_id: package_id,
        },
      });
      return {
        success: true,
        message: 'Review removed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
