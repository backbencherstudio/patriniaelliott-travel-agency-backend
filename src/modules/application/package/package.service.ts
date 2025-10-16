import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';
import { CreateReviewDto } from './dto/create-review.dto';
import { MessageGateway } from '../../../modules/chat/message/message.gateway';
import { NotificationRepository } from '../../../common/repository/notification/notification.repository';
import { UpdateReviewDto } from './dto/update-review.dto';
import { SearchPackagesDto } from '../../admin/vendor-package/dto/search-packages.dto';
import { EnhancedSearchDto } from './dto/enhanced-search.dto';
import { packageSearchQuerySchema } from '@/src/utils/query-validation';

@Injectable()
export class PackageService {
  constructor(
    private prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) { }

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
        // Not a DB column, will sort after fetch
        orderBy.created_at = 'desc';
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

    // Client-side rating sort
    let finalPackages = packages as any[];
    if (sort_by === 'rating_desc') {
      finalPackages = [...packages].sort((a: any, b: any) => {
        const aReviews = Array.isArray(a.reviews) ? a.reviews : [];
        const bReviews = Array.isArray(b.reviews) ? b.reviews : [];
        const aAvg = aReviews.length ? aReviews.reduce((s, r) => s + (r.rating_value || 0), 0) / aReviews.length : 0;
        const bAvg = bReviews.length ? bReviews.reduce((s, r) => s + (r.rating_value || 0), 0) / bReviews.length : 0;
        return bAvg - aAvg;
      });
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: {
        packages: finalPackages,
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

  async enhancedSearch(searchDto: EnhancedSearchDto) {
    const {
      search,
      name,
      location,
      city,
      country,
      destination_id,
      popular_destination,
      duration_start,
      duration_end,
      budget_start,
      budget_end,
      min_rating,
      ratings,
      free_cancellation,
      type_of_residence,
      type,
      meal_plans,
      popular_area,
      adults = 1,
      children = 0,
      infants = 0,
      rooms = 1,
      start_date,
      end_date,
      category_id,
      languages,
      traveller_types,
      tags,
      page = 1,
      limit = 10,
      sort_by = 'created_at_desc',
      vendor_id,
      vendor_name
    } = searchDto;

    // Calculate total guests
    const totalGuests = adults + children + infants;

    // Build where conditions
    const where: any = {
      deleted_at: null,
      status: 1, // Active packages only
      // Don't filter by approved_at since some packages might not be approved yet
    };

    // Enhanced search functionality - search in name, description, location, vendor name
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        {
          package_destinations: {
            some: {
              destination: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          }
        },
        {
          package_destinations: {
            some: {
              destination: {
                country: {
                  name: { contains: search, mode: 'insensitive' }
                }
              }
            }
          }
        },
        {
          user: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Name-specific search (takes precedence over general search)
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
      // Clear any existing OR conditions when searching by name specifically
      delete where.OR;
    }

    // Location search
    if (location) {
      where.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } },
        {
          package_destinations: {
            some: {
              destination: {
                name: { contains: location, mode: 'insensitive' }
              }
            }
          }
        },
        {
          package_destinations: {
            some: {
              destination: {
                country: {
                  name: { contains: location, mode: 'insensitive' }
                }
              }
            }
          }
        }
      ];
    }

    // City and Country specific search (can be used together)
    if (city || country) {
      // Build location conditions
      const locationConditions = [];

      if (city) {
        locationConditions.push({ city: { contains: city, mode: 'insensitive' } });
        console.log('City filter applied:', city);
      }

      if (country) {
        // Search in both package country field and destination countries
        const countryConditions = [
          { country: { contains: country, mode: 'insensitive' } },
          {
            package_destinations: {
              some: {
                destination: {
                  country: {
                    name: { contains: country, mode: 'insensitive' }
                  }
                }
              }
            }
          }
        ];

        // Use OR logic for country search to match either package country or destination country
        if (locationConditions.length > 0) {
          // If we have city conditions, combine with country using AND
          locationConditions.push({
            OR: countryConditions
          });
        } else {
          // If only country is provided, use OR logic directly
          where.OR = countryConditions;
        }

        console.log('Country filter applied:', country);
      }

      // If we have location conditions (city or combined city+country), apply them
      if (locationConditions.length > 0) {
        if (locationConditions.length === 1) {
          Object.assign(where, locationConditions[0]);
        } else {
          where.AND = locationConditions;
        }
      }

      // Clear any existing OR conditions when using specific location filters
      if (!country || city) {
        delete where.OR;
      }
    }

    // Destination filter
    if (destination_id) {
      where.package_destinations = {
        some: {
          destination_id: destination_id,
        },
      };
    }

    // Popular destination filter
    if (popular_destination) {
      where.package_destinations = {
        some: {
          destination: {
            name: { contains: popular_destination, mode: 'insensitive' }
          }
        }
      };
    }

    // Duration filters
    if (duration_start || duration_end) {
      where.duration = {};
      if (duration_start) where.duration.gte = duration_start;
      if (duration_end) where.duration.lte = duration_end;
    }

    // Budget filters
    if (budget_start || budget_end) {
      where.price = {};
      if (budget_start) {
        where.price.gte = Number(budget_start);
        console.log('Budget start filter applied:', Number(budget_start));
      }
      if (budget_end) {
        where.price.lte = Number(budget_end);
        console.log('Budget end filter applied:', Number(budget_end));
      }

      console.log('Budget filter applied:', {
        budget_start: budget_start ? Number(budget_start) : null,
        budget_end: budget_end ? Number(budget_end) : null,
        budget_start_type: typeof budget_start,
        budget_end_type: typeof budget_end,
        price_condition: where.price
      });
    }

    // Rating filters - filter by reviews instead of average_rating
    if (min_rating) {
      // Check if min_rating contains comma (multiple ratings)
      if (min_rating.includes(',')) {
        // Handle comma-separated ratings (e.g., "4,5")
        const ratingValues = min_rating.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
        if (ratingValues.length > 0) {
          where.reviews = {
            some: {
              rating_value: {
                in: ratingValues
              }
            }
          };
        }
      } else {
        // Handle single rating - show only exact rating, not greater than or equal
        const ratingValue = parseInt(min_rating);
        if (!isNaN(ratingValue)) {
          where.reviews = {
            some: {
              rating_value: ratingValue
            }
          };
        }
      }
    }

    if (ratings) {
      const ratingValues = ratings.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
      if (ratingValues.length > 0) {
        where.reviews = {
          some: {
            rating_value: {
              in: ratingValues
            }
          }
        };
      }
    }

    // Free cancellation filter
    if (free_cancellation !== undefined) {
      // Convert string to boolean if needed
      const isFreeCancellation = free_cancellation === true || String(free_cancellation).toLowerCase() === 'true';

      if (isFreeCancellation) {
        // For free cancellation, search for packages with free cancellation terms OR packages without cancellation policies
        where.OR = [
          {
            cancellation_policy: {
              OR: [
                { policy: { contains: 'free', mode: 'insensitive' } },
                { policy: { contains: 'no charge', mode: 'insensitive' } },
                { policy: { contains: 'no fee', mode: 'insensitive' } },
                { policy: { contains: 'refundable', mode: 'insensitive' } },
                { policy: { contains: 'full refund', mode: 'insensitive' } },
                { policy: { contains: 'cancel', mode: 'insensitive' } },
                { policy: { contains: 'flexible', mode: 'insensitive' } }
              ]
            }
          },
          {
            cancellation_policy: null
          }
        ];
      } else {
        // For paid cancellation, search for terms that indicate paid cancellation
        where.cancellation_policy = {
          OR: [
            { policy: { contains: 'paid', mode: 'insensitive' } },
            { policy: { contains: 'charge', mode: 'insensitive' } },
            { policy: { contains: 'fee', mode: 'insensitive' } },
            { policy: { contains: 'non-refundable', mode: 'insensitive' } },
            { policy: { contains: 'no refund', mode: 'insensitive' } }
          ]
        };
      }

      console.log('Free cancellation filter applied:', isFreeCancellation, 'Original value:', free_cancellation);
    }

    // Property type filters
    if (type_of_residence) {
      where.type = type_of_residence;
    }

    if (type) {
      where.type = type;
    }

    // Meal plans filter
    if (meal_plans) {
      where.meal_plans = {
        contains: meal_plans,
        mode: 'insensitive'
      };
    }

    // Popular area filter
    if (popular_area) {
      where.OR = [
        { city: { contains: popular_area, mode: 'insensitive' } },
        { address: { contains: popular_area, mode: 'insensitive' } }
      ];
    }

    // Guest capacity check (only apply if guests are specified)
    if (totalGuests > 1) {
      where.package_room_types = {
        some: {
          max_guests: {
            gte: totalGuests,
          },
        },
      };
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

    // Category filter
    if (category_id) {
      where.package_categories = {
        some: {
          category_id: category_id,
        },
      };
    }

    // Languages filter
    if (languages) {
      const languageIds = languages.split(',').map(l => l.trim());
      where.package_languages = {
        some: {
          language_id: {
            in: languageIds
          }
        }
      };
    }

    // Traveller types filter
    if (traveller_types) {
      const travellerTypeIds = traveller_types.split(',').map(t => t.trim());
      where.package_traveller_types = {
        some: {
          traveller_type_id: {
            in: travellerTypeIds
          }
        }
      };
    }

    // Tags filter
    if (tags) {
      const tagIds = tags.split(',').map(t => t.trim());
      where.package_tags = {
        some: {
          tag_id: {
            in: tagIds
          }
        }
      };
    }

    // Vendor filters
    if (vendor_id) {
      where.user_id = vendor_id;
    }

    if (vendor_name) {
      where.user = {
        name: { contains: vendor_name, mode: 'insensitive' }
      };
    }

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
        // For rating sorting, we'll need to calculate average rating in the transformation
        // For now, sort by review count as a proxy
        orderBy.reviews = {
          _count: 'desc'
        };
        break;
      case 'name_asc':
        orderBy.name = 'asc';
        break;
      case 'name_desc':
        orderBy.name = 'desc';
        break;
      default:
        orderBy.created_at = 'desc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Log the final where condition for debugging
    console.log('Final where condition:', JSON.stringify(where, null, 2));
    console.log('Search parameters:', {
      city,
      country,
      location,
      search,
      name,
      free_cancellation,
      budget_start: budget_start ? Number(budget_start) : null,
      budget_end: budget_end ? Number(budget_end) : null,
      budget_start_type: typeof budget_start,
      budget_end_type: typeof budget_end
    });
    console.log('Country search details:', {
      country,
      hasCountryFilter: !!country,
      searchInPackageCountry: !!country,
      searchInDestinationCountry: !!country
    });

    // Debug: Check what cancellation policies exist in the database
    if (free_cancellation !== undefined) {
      try {
        const samplePolicies = await this.prisma.package.findMany({
          take: 10,
          select: {
            id: true,
            name: true,
            cancellation_policy: true
          }
        });
        console.log('Sample cancellation policies in database:', samplePolicies);

        // Also check how many packages have cancellation policies
        const totalPackages = await this.prisma.package.count();
        const packagesWithPolicies = await this.prisma.package.count({
          where: {
            cancellation_policy: {
              isNot: null
            }
          }
        });
        console.log(`Total packages: ${totalPackages}, Packages with cancellation policies: ${packagesWithPolicies}`);

        // Test: Get packages without any filters to see if we can get any results
        const testPackages = await this.prisma.package.findMany({
          take: 5,
          where: {
            deleted_at: null,
            status: 1
          }
        });
        console.log('Test packages without filters:', testPackages.length);
      } catch (error) {
        console.log('Error fetching sample policies:', error.message);
      }
    }

    // Execute query with enhanced includes
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
              display_name: true,
              avatar: true,
            },
          },
          package_room_types: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              max_guests: true,
              is_available: true,
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
              status: true,
              rates: true,
            },
          } : false,
          package_files: {
            where: {
              is_featured: true,
            },
            select: {
              id: true,
              file: true,
              type: true,
              file_alt: true,
              sort_order: true,
              is_featured: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
          reviews: {
            select: {
              id: true,
              rating_value: true,
              comment: true,
              created_at: true,
            },
          },
          // cancellation_policy: true,
          // _count: {
          //   select: {
          //     reviews: true,
          //     package_room_types: true,
          //   },
          // },
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

    // Log query results for debugging
    console.log(`Query returned ${packages.length} packages out of ${total} total`);
    if (packages.length > 0) {
      console.log('Sample package cities:', packages.slice(0, 3).map(p => p.city));
      console.log('Sample package countries:', packages.slice(0, 3).map(p => p.country));
      console.log('Sample destination countries:', packages.slice(0, 3).map(p =>
        p.package_destinations?.map(pd => pd.destination.country?.name).filter(Boolean)
      ));
      console.log('Sample cancellation policies:', packages.slice(0, 3).map(p => ({
        package_id: p.id,
        cancellation_policy_id: (p as any)?.cancellation_policy_id
      })));

      // Log price range of returned packages
      const prices = packages.map(p => Number(p.price)).filter(p => !isNaN(p));
      if (prices.length > 0) {
        console.log('Price range of returned packages:', {
          min: Math.min(...prices),
          max: Math.max(...prices),
          count: prices.length,
          all_prices: prices.slice(0, 10) // Show first 10 prices for debugging
        });
      } else {
        console.log('No packages with valid prices found');
      }
    } else {
      console.log('No packages found. This might be due to:');
      console.log('1. No packages match the free cancellation criteria');
      console.log('2. All packages have paid cancellation policies');
      console.log('3. Packages don\'t have cancellation policies set');
      console.log('4. No packages match the budget criteria');
    }

    // // Transform data for frontend - Return ALL package properties
    // const transformedPackages = packages.map(pkg => {
    //   // Calculate average rating from reviews
    //   const validReviews = pkg.reviews.filter(review => review.rating_value !== null);
    //   const averageRating = validReviews.length > 0 
    //     ? validReviews.reduce((sum, review) => sum + review.rating_value, 0) / validReviews.length 
    //     : 0;

    //   // Return ALL package properties plus calculated fields
    //   return {
    //     // All original package properties
    //     ...pkg,

    //     // Additional calculated fields
    //     average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    //     total_reviews: pkg._count.reviews,
    //     free_cancellation: (() => {
    //       const cp: any = pkg.cancellation_policy as any;
    //       const policy = cp?.policy;
    //       return typeof policy === 'string' && policy.toLowerCase().includes('free');
    //     })() || false,

    //     // Ensure price is a number
    //     price: Number(pkg.price),

    //     // Add file URLs for images
    //     package_files: pkg.package_files.map(file => ({
    //       ...file,
    //       file_url: `${process.env.APP_URL || 'http://localhost:4000'}/storage/package/${file.file}`
    //     })),

    //     // Add vendor info
    //     vendor: {
    //       id: pkg.user.id,
    //       name: pkg.user.display_name || pkg.user.name,
    //       email: pkg.user.email,
    //       avatar: pkg.user.avatar,
    //     },

    //     // Add destination info
    //     destinations: pkg.package_destinations.map(pd => ({
    //       id: pd.destination.id,
    //       name: pd.destination.name,
    //       country: pd.destination.country?.name,
    //     })),

    //     // Add category info
    //     categories: pkg.package_categories.map(pc => ({
    //       id: pc.category.id,
    //       name: pc.category.name,
    //     })),

    //     // Add room type info
    //     room_types: pkg.package_room_types.map(rt => ({
    //       id: rt.id,
    //       name: rt.name,
    //       price: Number(rt.price),
    //       max_guests: rt.max_guests,
    //       is_available: rt.is_available,
    //     })),

    //     // Add availability info
    //     availability: pkg.package_availabilities || [],
    //   };
    // });

    // Ensure transformedPackages exists; if transformation is commented out, fallback to raw packages
    // Build a basic transformed list if not already declared
    // @ts-ignore
    if (typeof transformedPackages === 'undefined') {
      // @ts-ignore
      var transformedPackages = (packages as any[]).map((pkg: any) => ({
        ...pkg,
        average_rating: Array.isArray(pkg.reviews) && pkg.reviews.length
          ? pkg.reviews.reduce((s: number, r: any) => s + (r?.rating_value || 0), 0) / pkg.reviews.length
          : 0,
      }));
    }

    // Apply rating sorting if needed (since we can't do it in the database query)
    if (sort_by === 'rating_desc') {
      transformedPackages.sort((a: any, b: any) => (b.average_rating || 0) - (a.average_rating || 0));
    }



    return {
      success: true,
      data: {
        packages: transformedPackages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          applied: {
            search,
            name,
            location,
            city,
            country,
            budget_start,
            budget_end,
            min_rating,
            free_cancellation,
            type,
            adults,
            children,
            infants,
            rooms,
            start_date,
            end_date,
          },
          available: {
            total_packages: total,
            price_range: {
              min: packages.length > 0 ? Math.min(...packages.map(p => Number(p.price))) : 0,
              max: packages.length > 0 ? Math.max(...packages.map(p => Number(p.price))) : 0,
            },
            rating_range: {
              min: 0,
              max: 5,
            },
          },
        },
      },
    };
  }

  // {
  //   filters: {
  //     q,
  //     type,
  //     duration_start,
  //     duration_end,
  //     budget_start,
  //     budget_end,
  //     ratings,
  //     free_cancellation,
  //     destinations,
  //     languages,
  //     cursor,
  //     limit = 15,
  //     page,
  //   },
  // }: {
  //   filters: {
  //     q?: string;
  //     type?: string;
  //     duration_start?: string;
  //     duration_end?: string;
  //     budget_start?: number;
  //     budget_end?: number;
  //     ratings?: number[];
  //     free_cancellation?: string[];
  //     destinations?: string[];
  //     languages?: string[];
  //     cursor?: string;
  //     limit?: number;
  //     page?: number;
  //   };
  // }

  async findAll(requestQuery: any) {
    try {
      const query = packageSearchQuerySchema.safeParse(requestQuery);

      if (!query.success) {
        throw new BadRequestException({
          message: "Invalid query parameters",
          errors: query.error.flatten().fieldErrors,
        });
      }

      let { budget_end, budget_start, cursor, destinations, duration_end, duration_start, free_cancellation, languages, limit, page, q, ratings, type, popular_area } = query.data

      const where_condition: any = {};
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
      if (budget_end) {
        where_condition['price'] = {
          gte: Number(budget_start - .1),
          // lte: Number(budget_end),
        };

        if (budget_end) {
          where_condition['price']['lte'] = Number(budget_end);
        }
      }

      if (ratings?.length) {
        // Ensure it's always an array
        if (!Array.isArray(ratings)) {
          ratings = [ratings];
        }

        const numericRatings = ratings.map((r) => Number(r));

        if (numericRatings.length > 1) {
          where_condition['reviews'] = {
            some: {
              rating_value: {
                in: numericRatings,
              },
            },
          };
        } else {
          where_condition['reviews'] = {
            some: {
              rating_value: {
                equals: numericRatings[0],
              },
            },
          };
        }
      }


      if (free_cancellation.length) {
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

      if (destinations?.length) {
        if (!Array.isArray(destinations)) {
          destinations = [destinations];
        }
        if (destinations.length > 1) {
          where_condition.OR = destinations.map((d) => ({
            country: {
              contains: d,
              mode: 'insensitive',
            },
          }));
        } else {
          where_condition.country = {
            contains: destinations[0],
            mode: 'insensitive',
          };
        }
      }

      if (popular_area?.length) {
        if (!Array.isArray(popular_area)) {
          popular_area = [popular_area];
        }

        if (popular_area.length > 1) {
          where_condition.OR = [
            ...(where_condition.OR || []),
            ...popular_area.map((area) => ({
              city: {
                contains: area,
                mode: 'insensitive',
              },
            })),
          ];
        } else {
          where_condition.city = {
            contains: popular_area[0],
            mode: 'insensitive',
          };
        }
      }


      if (languages.length) {
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

      console.log('===========condition=========================');
      console.log({ where_condition, query_condition });
      console.log('====================================');

      const packages = await this.prisma.package.findMany({
        where: {
          ...where_condition,
          status: 1,
        },
        orderBy: {
          id: 'asc',
        },
        ...query_condition,
        select: {
          id: true,
          total_bedrooms: true,
          bathrooms: true,
          created_at: true,
          updated_at: true,
          breakfast_available: true,
          amenities: true,
          user_id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
          min_capacity: true,
          max_capacity: true,
          type: true,
          package_room_types: true,
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
          country: true,
          city: true,
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

      // 👉 Add rating summary for each package
      const packagesWithRatingSummary = packages.map(({ package_room_types, ...pkg }) => {
        const totalReviews = pkg.reviews.length;
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        let totalRating = 0;
        pkg.reviews.forEach(review => {
          const rating = review.rating_value;
          totalRating += rating;
          if (ratingDistribution[rating] !== undefined) {
            ratingDistribution[rating] += 1;
          }
        });

        const processedRoomTypes = package_room_types.map(roomType => {
          let processedRoomPhotos = roomType.room_photos;
          if (Array.isArray(roomType.room_photos)) {
            processedRoomPhotos = roomType.room_photos.map(photo => SojebStorage.url(appConfig().storageUrl.package + photo)
            );
          }
          return { ...roomType, room_photos: processedRoomPhotos };
        });

        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        return {
          ...pkg,
          address: `${pkg.city}, ${pkg.country}`,
          package_room_types: processedRoomTypes,
          room_photos: processedRoomTypes?.[0]?.room_photos,
          rating_summary: {
            averageRating,
            totalReviews,
            ratingDistribution,
          },
        };
      });

      const total = await this.prisma.package.count({ where: where_condition });

      // add image url package_files
      // if (packages && packages.length > 0) {
      //   for (const record of packages) {
      //     if (record.package_files) {
      //       for (const file of record.package_files) {
      //         file['file_url'] = SojebStorage.url(
      //           appConfig().storageUrl.package + file.file,
      //         );
      //       }
      //     }
      //   }
      // }

      const meta = {
        total,
        page,
        limit: limit,
        totalPages: page * limit < total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      }

      return {
        success: true,
        meta: meta,
        data: [
          ...packagesWithRatingSummary,
        ],
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`${error?.message}`);
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
        },
      });

      if (!record) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // // add file url package_files
      // if (record && record.package_files.length > 0) {
      //   for (const file of record.package_files) {
      //     if (file.file) {
      //       file['file_url'] = SojebStorage.url(
      //         appConfig().storageUrl.package + file.file,
      //       );
      //     }
      //   }
      // }

      // // add image url package_trip_plans
      // if (record && record.package_trip_plans.length > 0) {
      //   for (const trip_plan of record.package_trip_plans) {
      //     if (trip_plan.package_trip_plan_images) {
      //       for (const image of trip_plan.package_trip_plan_images) {
      //         if (image.image) {
      //           image['image_url'] = SojebStorage.url(
      //             appConfig().storageUrl.package + image.image,
      //           );
      //         }
      //       }
      //     }
      //   }
      // }

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
  private generateFileUrl(filePath: string, type: 'package' | 'avatar' = 'package'): string {
    const storagePath = type === 'package' ? appConfig().storageUrl.package : appConfig().storageUrl.avatar;
    return SojebStorage.url(storagePath + filePath);
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
  async getVendorPackage(
    page: number,
    limit: number,
    user_id?: string | null,
    searchParams?: {
      searchQuery?: string;
      country?: string;
      location?: string;
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
    try {
      const skip = (page - 1) * limit;

      // Debug logging
      console.log('getVendorPackage called with:', {
        page,
        limit,
        user_id,
        searchParams
      });

      // Build where conditions
      const where: any = {
        deleted_at: null
      };

      // Add user_id filter only if provided
      if (user_id) {
        where.user_id = user_id;
      }

      // Add search functionality
      if (searchParams?.searchQuery || searchParams?.country || searchParams?.location) {
        const searchConditions = [];

        // Search by package name and description
        if (searchParams?.searchQuery) {
          searchConditions.push(
            { name: { contains: searchParams.searchQuery, mode: 'insensitive' } },
            { description: { contains: searchParams.searchQuery, mode: 'insensitive' } }
          );
        }

        // Search by country
        if (searchParams?.country) {
          searchConditions.push({
            package_destinations: {
              some: {
                destination: {
                  country: {
                    name: { contains: searchParams.country, mode: 'insensitive' }
                  }
                }
              }
            }
          });
        }

        // Search by location (city)
        if (searchParams?.location) {
          searchConditions.push(
            // Search in package's direct location fields
            { city: { contains: searchParams.location, mode: 'insensitive' } },
            { country: { contains: searchParams.location, mode: 'insensitive' } },
            // Search in destination names
            {
              package_destinations: {
                some: {
                  destination: {
                    name: { contains: searchParams.location, mode: 'insensitive' }
                  }
                }
              }
            }
          );
        }

        if (searchConditions.length > 0) {
          where.OR = searchConditions;
        }
      }

      // Add status filter
      if (searchParams?.status !== undefined) {
        where.status = Number(searchParams.status);
      }

      // Add category filter via relation
      if (searchParams?.categoryId) {
        where.package_categories = {
          some: { category_id: searchParams.categoryId }
        };
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

      // Free cancellation filter will be applied in-memory (JSON field)

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
      if (searchParams?.ratings && Array.isArray(searchParams.ratings) && searchParams.ratings.length > 0) {
        // Filter out any invalid ratings
        const validRatings = searchParams.ratings.filter(rating =>
          typeof rating === 'number' && rating >= 0 && rating <= 5
        );

        console.log('Ratings filter - Original:', searchParams.ratings);
        console.log('Ratings filter - Valid:', validRatings);

        if (validRatings.length > 0) {
          // Only return packages that have at least one review with the specified rating
          // This ensures packages without reviews are excluded when rating filter is applied
          where.reviews = {
            some: {
              rating_value: {
                in: validRatings
              },
              deleted_at: null,
              status: 1
            }
          };
          console.log('Applied ratings filter to where clause:', where.reviews);
          console.log('Looking for packages with reviews having rating values:', validRatings);
        }
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

      console.log('Final where clause for package query:', JSON.stringify(where, null, 2));

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
            // cancellation_policy: true,
            // package_languages: {
            //   include: { language: { select: { id: true, name: true, code: true } } },
            // },
            package_destinations: {
              include: {
                destination: {
                  select: {
                    id: true,
                    name: true,
                    country: {
                      select: {
                        id: true,
                        name: true,
                        country_code: true,
                        flag: true
                      }
                    }
                  }
                }
              }
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

      console.log(`Found ${packages.length} packages, total: ${total}`);
      console.log('Package IDs:', packages.map(p => p.id));

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

      console.log('Rating aggregation results:', ratingAgg);

      const packageIdToRating = new Map<string, { averageRating: number; totalReviews: number }>();
      for (const row of ratingAgg as any[]) {
        packageIdToRating.set(row.package_id, {
          averageRating: row._avg?.rating_value ?? 0,
          totalReviews: row._count?.rating_value ?? 0,
        });
      }

      console.log('Package ID to Rating mapping:', Object.fromEntries(packageIdToRating));

      // Debug: Check if any packages were returned without matching ratings
      if (searchParams?.ratings && Array.isArray(searchParams.ratings) && searchParams.ratings.length > 0) {
        const packagesWithoutMatchingRatings = packages.filter(pkg => {
          const ratingData = packageIdToRating.get(pkg.id);
          return !ratingData || ratingData.totalReviews === 0;
        });

        if (packagesWithoutMatchingRatings.length > 0) {
          console.log('WARNING: Found packages without matching ratings:', packagesWithoutMatchingRatings.map(p => p.id));
        }
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

      console.log('Rating distribution results:', distributionAgg);

      // Debug: Check actual review data for returned packages when rating filter is applied
      if (searchParams?.ratings && Array.isArray(searchParams.ratings) && searchParams.ratings.length > 0) {
        const actualReviews = await this.prisma.review.findMany({
          where: {
            package_id: { in: packageIds },
            deleted_at: null,
            status: 1,
          },
          select: {
            package_id: true,
            rating_value: true,
          }
        });

        console.log('Actual review data for returned packages:', actualReviews);

        // Check if any packages have reviews that don't match the filter
        const validRatings = searchParams.ratings.filter(rating =>
          typeof rating === 'number' && rating >= 0 && rating <= 5
        );

        const packagesWithNonMatchingReviews = new Set();
        actualReviews.forEach(review => {
          if (!validRatings.includes(review.rating_value)) {
            packagesWithNonMatchingReviews.add(review.package_id);
          }
        });

        if (packagesWithNonMatchingReviews.size > 0) {
          console.log('ERROR: Found packages with reviews that do not match the rating filter:', Array.from(packagesWithNonMatchingReviews));
        }
      }

      const packageIdToDistribution = new Map<string, Record<number, number>>();
      for (const row of distributionAgg as any[]) {
        const current = packageIdToDistribution.get(row.package_id) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        // rating_value may be float; clamp to 1..5 integer bucket
        const bucket = Math.round(row.rating_value as number) as 1 | 2 | 3 | 4 | 5;
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
      // const processedData = packages.map(pkg => {
      //   const processedPackageFiles = pkg.package_files.map(file => ({
      //     ...file,
      //     file_url: this.generateFileUrl(file.file, 'package'),
      //   }));

      //   const processedRoomTypes = pkg.package_room_types.map(roomType => {
      //     let processedRoomPhotos = roomType.room_photos;
      //     if (Array.isArray(roomType.room_photos)) {
      //       processedRoomPhotos = roomType.room_photos.map(photo =>
      //         typeof photo === 'string' ? SojebStorage.url(appConfig().storageUrl.package + photo) : photo,
      //       );
      //     }
      //     return { ...roomType, room_photos: processedRoomPhotos };
      //   });

      //   // const processedExtraServices = pkg.package_extra_services.map(service => ({
      //   //   id: service.id,
      //   //   extra_service: {
      //   //     id: service.extra_service.id,
      //   //     name: service.extra_service.name,
      //   //     price: service.extra_service.price,
      //   //     description: service.extra_service.description
      //   //   }
      //   // }));

      //   //        const processedUser = pkg.user
      //   //    ? {
      //   //        ...pkg.user,
      //   //        avatar_url: pkg.user.avatar
      //   //          ? this.generateFileUrl(pkg.user.avatar, 'avatar')
      //   //          : null,
      //   //      }
      //   //    : null;

      //   const rating = packageIdToRating.get(pkg.id) ?? { averageRating: 0, totalReviews: 0 };
      //   const ratingDistribution = packageIdToDistribution.get(pkg.id) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      //   const confirmed = packageIdToConfirmed.get(pkg.id) ?? { confirmedBookings: 0, confirmedQuantity: 0 };
      //   const approvedDate = pkg.approved_at ? pkg.approved_at.toISOString() : null;

      //   // Extract room photos from processed data
      // const allRoomPhotos = processedRoomTypes.flatMap(roomType => roomType.room_photos || []);

      //   return {
      //     ...pkg,
      //     package_files: processedPackageFiles,
      //     package_room_types: processedRoomTypes,
      //     // package_extra_services: processedExtraServices,
      //     // user: processedUser,
      //     rating_summary: {
      //       averageRating: rating.averageRating,
      //       totalReviews: rating.totalReviews,
      //       ratingDistribution,
      //     },

      //     roomFiles: allRoomPhotos,
      //     confirmed_bookings: confirmed.confirmedBookings,
      //     confirmed_quantity: confirmed.confirmedQuantity,
      //     approved_at: pkg.approved_at,
      //     approved_date: approvedDate,
      //   } as any;
      // });

      // // Add calendar configuration to each package
      // for (const pkg of processedData) {
      //   const calendarConfig = await this.getCalendarConfiguration(pkg.id);
      //   if (calendarConfig) {
      //     (pkg as any).calendar_configuration = calendarConfig;
      //   }
      // }



      // Apply free cancellation filter in-memory if requested
      let returnedPackages = packages as any[];
      if (searchParams?.freeCancellation !== undefined) {
        const isFree = !!searchParams.freeCancellation;
        returnedPackages = (packages as any[]).filter((pkg: any) => {
          const cp: any = pkg.cancellation_policy as any;
          const text = typeof cp?.policy === 'string' ? cp.policy.toLowerCase() : '';
          if (isFree) {
            return !cp || text.includes('free') || text.includes('refundable') || text.includes('no charge') || text.includes('full refund');
          }
          return cp && (text.includes('paid') || text.includes('fee') || text.includes('non-refundable') || text.includes('no refund'));
        });
      }

      return {
        data: returnedPackages,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in getVendorPackage service:', error);
      throw error;
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

  // Debug method to test cancellation policies
  async debugCancellationPolicies() {
    try {
      const packages = await this.prisma.package.findMany({
        take: 20,
        where: {
          deleted_at: null,
          status: 1
        },
        select: {
          id: true,
          name: true,
          cancellation_policy: true
        }
      });

      const totalPackages = await this.prisma.package.count({
        where: {
          deleted_at: null,
          status: 1
        }
      });

      const packagesWithPolicies = await this.prisma.package.count({
        where: {
          deleted_at: null,
          status: 1,
          cancellation_policy: {
            isNot: null
          }
        }
      });

      return {
        success: true,
        data: {
          total_packages: totalPackages,
          packages_with_policies: packagesWithPolicies,
          sample_packages: packages
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Debug method to test budget filtering
  async debugBudgetFiltering(budget_start?: number, budget_end?: number) {
    try {
      const where: any = {
        deleted_at: null,
        status: 1
      };

      if (budget_start || budget_end) {
        where.price = {};
        if (budget_start) {
          where.price.gte = Number(budget_start);
          console.log('Debug: Budget start filter applied:', Number(budget_start));
        }
        if (budget_end) {
          where.price.lte = Number(budget_end);
          console.log('Debug: Budget end filter applied:', Number(budget_end));
        }
        console.log('Debug: Final price condition:', where.price);
      }

      const packages = await this.prisma.package.findMany({
        take: 20,
        where,
        select: {
          id: true,
          name: true,
          price: true
        },
        orderBy: {
          price: 'asc'
        }
      });

      const totalPackages = await this.prisma.package.count({
        where: {
          deleted_at: null,
          status: 1
        }
      });

      const filteredPackages = await this.prisma.package.count({ where });

      const prices = packages.map(p => Number(p.price)).filter(p => !isNaN(p));
      const priceRange = prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        all_prices: prices
      } : null;

      return {
        success: true,
        data: {
          total_packages: totalPackages,
          filtered_packages: filteredPackages,
          budget_filter: {
            budget_start: budget_start ? Number(budget_start) : null,
            budget_end: budget_end ? Number(budget_end) : null
          },
          price_range: priceRange,
          sample_packages: packages,
          where_condition: where
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async topLocations(limit = 5) {
    try {
      const packages = await this.prisma.package.findMany({
        where: {
          booking_items: {
            some: {
              booking: { payment_status: "pending" },
            },
          },
        },
        select: {
          id: true,
          country: true,
          package_files: true,
          _count: {
            select: { booking_items: true },
          },
        },
      })

      const src_url = '/public/storage/package/'

      const topDestinations = packages
        .map((pkg) => ({ id: pkg.id, img: src_url + pkg.package_files?.[0]?.file, country: pkg.country, count: pkg._count.booking_items }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit ? limit : 10)
      return {
        success: true,
        message: 'Success',
        data: topDestinations,
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error.');
    }
  }
}
