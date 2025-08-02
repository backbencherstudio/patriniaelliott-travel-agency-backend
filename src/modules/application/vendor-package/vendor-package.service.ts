import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SearchPackagesDto } from '../../admin/vendor-package/dto/search-packages.dto';

@Injectable()
export class VendorPackageService {
  constructor(private readonly prisma: PrismaService) {}

  async searchVendorPackages(searchDto: SearchPackagesDto) {
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
      approved_at: { not: null }, // Only approved packages
    };

    // Search term
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price range
    if (min_price !== undefined || max_price !== undefined) {
      where.price = {};
      if (min_price !== undefined) where.price.gte = min_price;
      if (max_price !== undefined) where.price.lte = max_price;
    }

    // Capacity filter
    if (totalGuests > 0) {
      where.max_guests = { gte: totalGuests };
    }

    // Room capacity filter
    if (rooms > 1) {
      where.bedrooms = { gte: rooms };
    }

    // Build order by
    let orderBy: any = {};
    switch (sort_by) {
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      case 'rating_desc':
        orderBy.reviews = { _count: 'desc' };
        break;
      case 'created_at_desc':
      default:
        orderBy.created_at = 'desc';
        break;
    }

    const skip = (page - 1) * limit;

    // Execute query with relations
    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              display_name: true,
              avatar: true,
              type: true,
            },
          },
          package_destinations: {
            include: {
              destination: true,
            },
          },
          package_categories: {
            include: {
              category: true,
            },
          },
          package_tags: {
            include: {
              tag: true,
            },
          },
          package_room_types: true,
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

  async getVendorPackageById(id: string) {
    const packageData = await this.prisma.package.findFirst({
      where: {
        id,
        deleted_at: null,
        is_available: true,
        status: 1,
        approved_at: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            display_name: true,
            avatar: true,
            type: true,
            phone_number: true,
            email: true,
          },
        },
        package_destinations: {
          include: {
            destination: true,
          },
        },
        package_categories: {
          include: {
            category: true,
          },
        },
        package_tags: {
          include: {
            tag: true,
          },
        },
        package_room_types: {
          orderBy: {
            price: 'asc',
          },
        },
        package_availabilities: {
          orderBy: {
            date: 'asc',
          },
        },
        package_files: {
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
        package_trip_plans: {
          include: {
            package_trip_plan_images: {
              orderBy: {
                sort_order: 'asc',
              },
            },
          },
          orderBy: {
            day: 'asc',
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                display_name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!packageData) {
      return {
        success: false,
        message: 'Package not found',
      };
    }

    return {
      success: true,
      data: packageData,
    };
  }

  async getVendorPackagesByVendor(vendorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {
      user_id: vendorId,
      deleted_at: null,
      is_available: true,
      status: 1,
      approved_at: { not: null },
    };

    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        include: {
          package_files: {
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
            take: 1, // Only get featured image
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.package.count({ where }),
    ]);

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

  async getFeaturedVendorPackages(limit = 10) {
    const packages = await this.prisma.package.findMany({
      where: {
        deleted_at: null,
        is_available: true,
        status: 1,
        approved_at: { not: null },
        package_files: {
          some: {
            is_featured: true,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            display_name: true,
            avatar: true,
            type: true,
          },
        },
        package_files: {
          where: {
            is_featured: true,
          },
          select: {
            id: true,
            file: true,
            type: true,
            file_alt: true,
          },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: packages,
    };
  }
} 