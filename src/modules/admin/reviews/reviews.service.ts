import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add image URLs to package data
   */
  private addImageUrls(packageData: any) {
    const baseUrl = appConfig().app.url;
    
    console.log('🔍 Package data:', {
      id: packageData.id,
      name: packageData.name,
      package_files: packageData.package_files
    });
    
    // Add URLs to package files
    if (packageData.package_files && packageData.package_files.length > 0) {
      packageData.package_files.forEach((file, index) => {
        if (file.file) {
          // Encode the filename to handle special characters and spaces
          const encodedFilename = encodeURIComponent(file.file);
          file.file_url = `${baseUrl}/public/storage/package/${encodedFilename}`;
          console.log('✅ Added image URL:', file.file_url);
        }
      });
    } else {
      console.log('❌ No package files found for package:', packageData.name);
    }
    
    return packageData;
  }

  async findAll({
    status = 'all',
    date_range = 'all',
    page = 1,
    limit = 10,
    search = ''
  }: {
    status?: string;
    date_range?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      const whereClause: any = {};

      // Filter by status
      if (status !== 'all') {
        switch (status) {
          case 'approved':
            whereClause['status'] = 1;
            break;
          case 'pending':
            whereClause['status'] = 0;
            break;
          case 'rejected':
            whereClause['status'] = -1;
            break;
        }
      }

      // Filter by date range
      if (date_range !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (date_range) {
          case 'last_7_days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last_30_days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'present_day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        
        whereClause['created_at'] = {
          gte: startDate,
        };
      }

      // Search functionality
      if (search) {
        whereClause['OR'] = [
          { comment: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { package: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const totalCount = await this.prisma.review.count({
        where: whereClause,
      });

      const reviews = await this.prisma.review.findMany({
        where: whereClause,
        select: {
          id: true,
          rating_value: true,
          comment: true,
          status: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              type: true,
              package_files: {
                select: {
                  id: true,
                  file: true,
                  file_alt: true,
                  type: true,
                  is_featured: true,
                },
                take: 1,
              },
            },
          },
          booking: {
            select: {
              id: true,
              invoice_number: true,
              booking_items: {
                select: {
                  start_date: true,
                  end_date: true,
                },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      });

      // Format the reviews data to match UI requirements
      const formattedReviews = reviews.map(review => {
        // Format status for display
        let statusDisplay = 'Pending';
        let statusColor = 'orange';
        
        if (review.status === 1) {
          statusDisplay = 'Approved';
          statusColor = 'green';
        } else if (review.status === -1) {
          statusDisplay = 'Rejected';
          statusColor = 'red';
        } else {
          statusDisplay = 'Pending';
          statusColor = 'orange';
        }

        // Add image URLs to package data
        const packageWithImages = this.addImageUrls(review.package);
        
        // Format package image
        const packageImage = packageWithImages.package_files?.[0] ? {
          url: packageWithImages.package_files[0].file_url,
          alt: packageWithImages.package_files[0].file_alt,
        } : null;

        // Format user avatar
        const userAvatar = review.user.avatar ? {
          url: SojebStorage.url(
            appConfig().storageUrl.avatar + review.user.avatar,
          ),
          alt: review.user.name,
        } : null;

        return {
          id: review.id,
          user: {
            id: review.user.id,
            name: review.user.name,
            email: review.user.email,
            avatar: userAvatar,
          },
          reservation: {
            id: review.booking?.id,
            invoice_number: review.booking?.invoice_number,
            package_name: review.package.name,
            package_type: review.package.type,
            package_image: packageImage,
            check_in: review.booking?.booking_items?.[0]?.start_date,
            check_out: review.booking?.booking_items?.[0]?.end_date,
          },
          review: {
            comment: review.comment,
            rating: review.rating_value,
            created_at: review.created_at,
          },
          status: {
            text: statusDisplay,
            color: statusColor,
            value: review.status,
          },
          actions: {
            can_approve: review.status !== 1,
            can_reject: review.status !== -1,
            can_delete: true,
          }
        };
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const paginationData = {
        current_page: page,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limit,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage,
      };

      return {
        success: true,
        data: formattedReviews,
        pagination: paginationData,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getStatistics() {
    try {
      // Get total reviews count
      const totalReviews = await this.prisma.review.count();

      // Get average rating
      const avgRatingResult = await this.prisma.review.aggregate({
        _avg: {
          rating_value: true,
        },
      });
      const averageRating = avgRatingResult._avg.rating_value || 0;

      // Get reviews from last week for comparison
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const lastWeekReviews = await this.prisma.review.count({
        where: {
          created_at: {
            gte: lastWeek,
          },
        },
      });

      // Calculate percentage change vs last week
      const previousWeek = new Date();
      previousWeek.setDate(previousWeek.getDate() - 14);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

      const previousWeekReviews = await this.prisma.review.count({
        where: {
          created_at: {
            gte: previousWeek,
            lt: twoWeeksAgo,
          },
        },
      });

      const percentageChange = previousWeekReviews > 0 
        ? ((lastWeekReviews - previousWeekReviews) / previousWeekReviews) * 100 
        : 0;

      // Get overall satisfaction breakdown
      const satisfactionBreakdown = await this.prisma.review.groupBy({
        by: ['rating_value'],
        _count: {
          rating_value: true,
        },
      });

      // Calculate satisfaction percentages
      let satisfied = 0; // 4-5 stars
      let neutral = 0;   // 3 stars
      let dissatisfied = 0; // 1-2 stars

      satisfactionBreakdown.forEach(group => {
        const count = group._count.rating_value;
        const rating = group.rating_value || 0;
        
        if (rating >= 4) {
          satisfied += count;
        } else if (rating === 3) {
          neutral += count;
        } else {
          dissatisfied += count;
        }
      });

      const total = satisfied + neutral + dissatisfied;
      const satisfiedPercent = total > 0 ? Math.round((satisfied / total) * 100) : 0;
      const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
      const dissatisfiedPercent = total > 0 ? Math.round((dissatisfied / total) * 100) : 0;

      return {
        success: true,
        data: {
          average_review: {
            value: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            display: `${Math.round(averageRating * 10) / 10}`,
            label: 'Average Review',
          },
          all_feedback: {
            total: totalReviews,
            change_percentage: Math.round(percentageChange * 10) / 10,
            change_direction: percentageChange >= 0 ? 'up' : 'down',
            display: `${totalReviews}`,
            label: 'All Feedback',
          },
          overall_satisfaction: {
            satisfied: {
              percentage: satisfiedPercent,
              emoji: '😊',
              color: 'green',
            },
            neutral: {
              percentage: neutralPercent,
              emoji: '😐',
              color: 'gray',
            },
            dissatisfied: {
              percentage: dissatisfiedPercent,
              emoji: '😞',
              color: 'red',
            },
            label: 'Overall Satisfaction',
          },
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
      const review = await this.prisma.review.findUnique({
        where: { id },
        select: {
          id: true,
          rating_value: true,
          comment: true,
          status: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone_number: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              price: true,
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
          },
          booking: {
            select: {
              id: true,
              invoice_number: true,
              total_amount: true,
              booking_items: {
                select: {
                  start_date: true,
                  end_date: true,
                  quantity: true,
                },
              },
            },
          },
        },
      });

      if (!review) {
        return {
          success: false,
          message: 'Review not found',
        };
      }

      // Get property details with all images for the gallery
      const propertyImages = await this.prisma.packageFile.findMany({
        where: {
          package_id: review.package.id,
        },
        select: {
          file: true,
          file_alt: true,
          is_featured: true,
        },
        orderBy: {
          is_featured: 'desc',
        },
      });

      // Get all reviews for this property to calculate average rating
      const propertyReviews = await this.prisma.review.findMany({
        where: {
          package_id: review.package.id,
          status: 1, // Only approved reviews
        },
        select: {
          rating_value: true,
        },
      });

      // Calculate average rating
      const averageRating = propertyReviews.length > 0 
        ? propertyReviews.reduce((sum, r) => sum + (r.rating_value || 0), 0) / propertyReviews.length
        : 0;

      // Format property images
      const formattedImages = propertyImages.map(img => ({
        url: SojebStorage.url(
          appConfig().storageUrl.package + img.file,
        ),
        alt: img.file_alt,
        is_featured: img.is_featured,
      }));

      // Format user avatar
      const userAvatar = review.user.avatar ? {
        url: SojebStorage.url(
          appConfig().storageUrl.avatar + review.user.avatar,
        ),
        alt: review.user.name,
      } : null;

      // Format the response to match the Property Details UI
      const formattedReview = {
        // Property Details (matching the image)
        property: {
          id: review.package.id,
          name: review.package.name,
          type: review.package.type,
          description: review.package.description,
          price: review.package.price,
          price_display: `$${Number(review.package.price).toLocaleString()}/per night`,
          rating: {
            average: Math.round(averageRating * 10) / 10,
            stars: Math.round(averageRating),
            total_reviews: propertyReviews.length,
          },
          images: formattedImages,
          featured_image: formattedImages.find(img => img.is_featured) || formattedImages[0] || null,
        },

        // Review Details (matching the image)
        review: {
          id: review.id,
          comment: review.comment,
          rating: review.rating_value,
          status: review.status,
          created_at: review.created_at,
          formatted_date: review.created_at.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        },

        // Reviewer Information (matching the image)
        reviewer: {
          id: review.user.id,
          name: review.user.name,
          email: review.user.email,
          phone: review.user.phone_number,
          avatar: userAvatar,
        },

        // Booking Information
        booking: review.booking ? {
          id: review.booking.id,
          invoice_number: review.booking.invoice_number,
          total_amount: review.booking.total_amount,
          check_in: review.booking.booking_items?.[0]?.start_date,
          check_out: review.booking.booking_items?.[0]?.end_date,
          guests: review.booking.booking_items?.[0]?.quantity || 1,
        } : null,

        // Feedback Actions (matching the image buttons)
        feedback: {
          thumbs_up: {
            count: 128, // This would come from a feedback system
            active: false,
          },
          thumbs_down: {
            count: 5, // This would come from a feedback system
            active: false,
          },
        },

        // Admin Actions
        admin_actions: {
          can_approve: review.status !== 1,
          can_reject: review.status !== -1,
          can_delete: true,
          status_display: this.getStatusDisplay(review.status),
        },
      };

      return {
        success: true,
        data: formattedReview,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private getStatusDisplay(status: number): string {
    switch (status) {
      case 1:
        return 'Approved';
      case -1:
        return 'Rejected';
      default:
        return 'Pending';
    }
  }

  async updateStatus(id: string, status: string) {
    try {
      let statusValue: number;
      
      switch (status.toLowerCase()) {
        case 'approved':
          statusValue = 1;
          break;
        case 'rejected':
          statusValue = -1;
          break;
        case 'pending':
        default:
          statusValue = 0;
          break;
      }

      const review = await this.prisma.review.update({
        where: { id },
        data: { status: statusValue },
      });

      return {
        success: true,
        message: `Review ${status} successfully`,
        data: review,
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
      const review = await this.prisma.review.delete({
        where: {
          id: id,
        },
      });

      if (!review) {
        return {
          success: false,
          message: 'Review not found',
        };
      }

      return {
        success: true,
        message: 'Review deleted',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
