import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateListingManagementDto } from './dto/create-listing-management.dto';
import { UpdateListingManagementDto } from './dto/update-listing-management.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';

@Injectable()
export class ListingManagementService {
  constructor(private prisma: PrismaService) {}

  async create(createListingManagementDto: CreateListingManagementDto) {
    return 'This action adds a new listingManagement';
  }

  async overview() {
    try {
      // Total packages count
      const totalPackages = await this.prisma.package.count({
        where: {
          deleted_at: null,
        },
      });

      // Total apartments count
      const totalApartments = await this.prisma.package.count({
        where: {
          type: 'apartment',
          deleted_at: null,
        },
      });

      // Total hotels count
      const totalHotels = await this.prisma.package.count({
        where: {
          type: 'hotel',
          deleted_at: null,
        },
      });

      // Total tours count
      const totalTours = await this.prisma.package.count({
        where: {
          type: 'tour',
          deleted_at: null,
        },
      });

      return {
        success: true,
        message: 'Package overview fetched successfully',
        data: {
          totalPackages: totalPackages,
          totalApartments: totalApartments,
          totalHotels: totalHotels,
          totalTours: totalTours,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(query: { 
    type?: string; 
    status?: string;
    page?: string; 
    limit?: string;
    dateFilter?: string;
  }) {
    try {
      // Parse pagination parameters
      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        deleted_at: null,
      };

      // Handle type filtering (apartment, hotel, tour)
      if (query.type && query.type !== 'all') {
        whereClause.type = query.type;
      }

      // Handle status filtering (available, booked, cancel)
      if (query.status && query.status !== 'all') {
        switch (query.status) {
          case 'available':
            whereClause.status = 1;
            whereClause.approved_at = { not: null };
            break;
          case 'booked':
            // For booked status, we need to check if there are active bookings
            // This is a simplified approach - you might want to join with bookings table
            whereClause.status = 1;
            break;
          case 'cancel':
            whereClause.status = 0;
            break;
        }
      }

      // Handle date filtering
      if (query.dateFilter) {
        const now = new Date();
        let startDate: Date;

        switch (query.dateFilter) {
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '15days':
            startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
            break;
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          default:
            // If no valid filter, don't add date constraint
            break;
        }

        if (startDate) {
          whereClause.created_at = {
            gte: startDate,
            lte: now,
          };
        }
      }

      // Get total count for pagination
      const totalCount = await this.prisma.package.count({
        where: whereClause,
      });

      // Get packages with pagination and related data
      const packages = await this.prisma.package.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          city: true,
          country: true,
          address: true,
          status: true,
          approved_at: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          package_files: {
            where: {
              is_featured: true,
            },
            select: {
              file: true,
              file_alt: true,
            },
            take: 1,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: skip,
        take: limit,
      });

      // Transform the data to match the UI requirements
      const transformedPackages = packages.map((pkg, index) => {
        // Generate a sequential ID for display (like #0001, #0002, etc.)
        const displayId = `#${String(skip + index + 1).padStart(4, '0')}`;
        
        // Determine status based on package data
        let status = 'Available';
        let statusClass = 'available';
        
        if (pkg.status === 0) {
          status = 'Cancel';
          statusClass = 'cancel';
        } else if (pkg.approved_at === null) {
          status = 'Pending';
          statusClass = 'pending';
        }

        // Format location
        const location = [pkg.city, pkg.country].filter(Boolean).join(', ');

        // Get featured image URL
        let imageUrl = null;
        if (pkg.package_files && pkg.package_files.length > 0) {
          imageUrl = SojebStorage.url(
            appConfig().storageUrl.package + pkg.package_files[0].file,
          );
        }

        return {
          id: pkg.id,
          displayId: displayId,
          name: pkg.name,
          type: pkg.type,
          location: location,
          price: pkg.price,
          status: status,
          statusClass: statusClass,
          joinDate: pkg.created_at,
          imageUrl: imageUrl,
          host: pkg.user?.name || 'Unknown',
        };
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: transformedPackages,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalCount: totalCount,
          limit: limit,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
        },
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
      const packageData = await this.prisma.package.findUnique({
        where: {
          id: id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone_number: true,
            },
          },
          package_files: true,
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
          package_trip_plans: {
            include: {
              package_trip_plan_images: true,
            },
          },
          package_extra_services: {
            include: {
              extra_service: true,
            },
          },
          package_languages: {
            include: {
              language: true,
            },
          },
          package_traveller_types: {
            include: {
              traveller_type: true,
            },
          },
          package_room_types: true,
          package_availabilities: true,
          property_calendars: true,
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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

      // Calculate average rating
      const ratingStats = await this.prisma.review.aggregate({
        where: {
          package_id: id,
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

      const averageRating = ratingStats._avg.rating_value || 0;
      const totalReviews = ratingStats._count.rating_value || 0;

      // Transform package files to include URLs
      const transformedFiles = packageData.package_files.map((file) => ({
        ...file,
        file_url: file.file ? SojebStorage.url(
          appConfig().storageUrl.package + file.file,
        ) : null,
      }));

      // Transform status to match findAll logic
      let statusText = 'Available';
      let statusClass = 'available';
      
      if (packageData.status === 0) {
        statusText = 'Cancel';
        statusClass = 'cancel';
      } else if (packageData.approved_at === null) {
        statusText = 'Pending';
        statusClass = 'pending';
      }

      return {
        success: true,
        data: {
          ...packageData,
          status: statusText,
          statusClass: statusClass,
          package_files: transformedFiles,
          averageRating: averageRating,
          totalReviews: totalReviews,
        },
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
      const packageData = await this.prisma.package.findUnique({
        where: { id: id },
      });
      
      if (!packageData) {
        return {
          success: false,
          message: 'Package not found',
        };
      }
      
      await this.prisma.package.update({
        where: { id: id },
        data: { 
          approved_at: new Date(),
          status: 1,
        },
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
      const packageData = await this.prisma.package.findUnique({
        where: { id: id },
      });
      
      if (!packageData) {
        return {
          success: false,
          message: 'Package not found',
        };
      }
      
      await this.prisma.package.update({
        where: { id: id },
        data: { 
          approved_at: null,
          status: 0,
        },
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

  async update(id: string, updateListingManagementDto: UpdateListingManagementDto) {
    try {
      // Check if package exists
      const existingPackage = await this.prisma.package.findUnique({
        where: { id: id },
      });

      if (!existingPackage) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // Filter out undefined values to avoid overwriting with null
      const updateData = Object.fromEntries(
        Object.entries(updateListingManagementDto).filter(([_, value]) => value !== undefined)
      );

      // Update the package
      const updatedPackage = await this.prisma.package.update({
        where: { id: id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          price: true,
          city: true,
          country: true,
          address: true,
          status: true,
          approved_at: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Package updated successfully',
        data: updatedPackage,
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
      const packageData = await this.prisma.package.findUnique({
        where: { id: id },
      });
      
      if (!packageData) {
        return {
          success: false,
          message: 'Package not found',
        };
      }
      
      // Soft delete by setting deleted_at
      await this.prisma.package.update({
        where: { id: id },
        data: { deleted_at: new Date() },
      });
      
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
