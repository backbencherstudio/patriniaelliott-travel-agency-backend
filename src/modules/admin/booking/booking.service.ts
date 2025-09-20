import { Injectable } from '@nestjs/common';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async findAll({
    user_id,
    q,
    status = null,
    approve,
    type,
    date_range,
    page,
    limit,
    sort_by,
  }: {
    user_id?: string;
    q?: string;
    status?: number;
    approve?: string;
    type?: string;
    date_range?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
  }) {
    // Ensure proper default values
    const pageNumber = page || 1;
    const limitNumber = limit || 10;
    const sortBy = sort_by || 'created_at_desc';
    try {
      const where_condition = {};
      
      // filter using vendor id if the package is from vendor
      if (user_id) {
        const userDetails = await UserRepository.getUserDetails(user_id);
        if (userDetails && userDetails.type == 'vendor') {
          where_condition['vendor_id'] = user_id;
        }
      }
      
      // search using q
      if (q) {
        where_condition['OR'] = [
          { invoice_number: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
        ];
      }

      if (status) {
        where_condition['status'] = Number(status);
      }

      if (approve) {
        if (approve === 'approved') {
          where_condition['approved_at'] = { not: null };
        } else {
          where_condition['approved_at'] = null;
        }
      }

      // filter by type
      if (type && type !== 'all') {
        where_condition['type'] = type;
      }
      // If type is 'all' or not provided, don't filter by type (show all types)

      // filter by date range
      if (date_range && date_range !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (date_range) {
          case 'last_7_days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last_30_days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last_90_days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default to 30 days
        }
        
        where_condition['created_at'] = {
          gte: startDate,
        };
      }

      // Calculate pagination
      const skip = (pageNumber - 1) * limitNumber;
      
      // Determine sort order
      let orderBy = {};
      switch (sortBy) {
        case 'created_at_asc':
          orderBy = { created_at: 'asc' };
          break;
        case 'created_at_desc':
          orderBy = { created_at: 'desc' };
          break;
        case 'total_amount_desc':
          orderBy = { total_amount: 'desc' };
          break;
        case 'total_amount_asc':
          orderBy = { total_amount: 'asc' };
          break;
        case 'booking_id_asc':
          orderBy = { invoice_number: 'asc' };
          break;
        case 'booking_id_desc':
          orderBy = { invoice_number: 'desc' };
          break;
        case 'name_asc':
          orderBy = { user: { name: 'asc' } };
          break;
        case 'name_desc':
          orderBy = { user: { name: 'desc' } };
          break;
        default:
          orderBy = { created_at: 'desc' };
      }

      // Get total count for pagination
      const totalCount = await this.prisma.booking.count({
        where: where_condition,
      });

      const bookings = await this.prisma.booking.findMany({
        where: {
          ...where_condition,
        },
        orderBy,
        skip,
        take: limitNumber,
        select: {
          id: true,
          invoice_number: true,
          email: true,
          phone_number: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          zip_code: true,
          country: true,
          total_amount: true,
          status: true,
          type: true,
          payment_status: true,
          approved_at: true,
          booking_items: {
            select: {
              start_date: true,
              end_date: true,
              package: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
      });

      // Format the bookings data to match UI requirements
      const formattedBookings = bookings.map(booking => {
        // Get check-in and check-out dates from booking items
        const checkInDate = booking.booking_items?.[0]?.start_date;
        const checkOutDate = booking.booking_items?.[0]?.end_date;
        
        // Format service type for display
        let serviceType = 'N/A';
        if (booking.type) {
          switch (booking.type.toLowerCase()) {
            case 'hotel':
              serviceType = 'Hotel';
              break;
            case 'apartment':
              serviceType = 'Apartment';
              break;
            case 'tour':
              serviceType = 'Tour';
              break;
            default:
              serviceType = booking.type.charAt(0).toUpperCase() + booking.type.slice(1);
          }
        }
        
        // Format payment status for display
        let paymentStatusDisplay = 'Pending';
        let paymentStatusColor = 'orange';
        
        if (booking.payment_status === 'approved' || booking.payment_status === 'paid') {
          paymentStatusDisplay = 'Full Paid';
          paymentStatusColor = 'green';
        } else if (booking.payment_status === 'canceled' || booking.payment_status === 'cancelled') {
          paymentStatusDisplay = 'Canceled';
          paymentStatusColor = 'red';
        } else if (booking.payment_status === 'pending') {
          paymentStatusDisplay = 'Pending';
          paymentStatusColor = 'orange';
        }
        
        // Format booking status for display
        let statusDisplay = booking.status || 'Pending';
        let statusColor = 'orange';
        
        if (booking.status === 'confirmed' || booking.status === 'approved') {
          statusDisplay = 'Confirmed';
          statusColor = 'green';
        } else if (booking.status === 'canceled' || booking.status === 'cancelled') {
          statusDisplay = 'Canceled';
          statusColor = 'red';
        } else if (booking.status === 'pending') {
          statusDisplay = 'Pending';
          statusColor = 'orange';
        }
        
        // Format amount for display
        const amountDisplay = booking.total_amount ? `$${Number(booking.total_amount).toLocaleString()}` : '$0';
        
        // Format dates for display
        const formatDate = (date: Date | string | null) => {
          if (!date) return 'N/A';
          const dateObj = new Date(date);
          return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
        };

        return {
          id: booking.id,
          booking_id: booking.invoice_number || `#${booking.id.slice(-5)}`, // Use invoice_number or fallback to last 5 chars of ID
          name: booking.user?.name || 'N/A',
          services: serviceType,
          payment: {
            status: paymentStatusDisplay,
            color: paymentStatusColor
          },
          check_in: formatDate(checkInDate),
          check_out: formatDate(checkOutDate),
          amount: amountDisplay,
          status: {
            text: statusDisplay,
            color: statusColor
          },
          // Keep original data for backend processing
          original_data: {
            id: booking.id,
            invoice_number: booking.invoice_number,
            email: booking.email,
            phone_number: booking.phone_number,
            address1: booking.address1,
            address2: booking.address2,
            city: booking.city,
            state: booking.state,
            zip_code: booking.zip_code,
            country: booking.country,
            total_amount: booking.total_amount,
            status: booking.status,
            type: booking.type,
            payment_status: booking.payment_status,
            approved_at: booking.approved_at,
            user: booking.user,
            booking_items: booking.booking_items,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
          }
        };
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPreviousPage = pageNumber > 1;

      const paginationData = {
        current_page: pageNumber,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limitNumber,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage,
      };



      return {
        success: true,
        data: formattedBookings,
        pagination: paginationData,
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
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: {
          id: true,
          invoice_number: true,
          status: true,
          vendor_id: true,
          user_id: true,
          type: true,
          total_amount: true,
          payment_status: true,
          payment_raw_status: true,
          paid_amount: true,
          paid_currency: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          comments: true,
          user: {
            select: {
              name: true,
              email: true,
              avatar: true,
            },
          },
          booking_items: {
            select: {
              start_date: true,
              end_date: true,
              package: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
          booking_extra_services: {
            select: {
              extra_service: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          },
          booking_travellers: {
            select: {
              full_name: true,
              type: true,
            },
          },
          booking_coupons: {
            select: {
              coupon: {
                select: {
                  name: true,
                  amount: true,
                  amount_type: true,
                },
              },
            },
          },
          payment_transactions: {
            select: {
              amount: true,
              currency: true,
              paid_amount: true,
              paid_currency: true,
              status: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
      });

      if (!booking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      // add avatar url
      if (booking.user && booking.user.avatar) {
        booking.user['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + booking.user.avatar,
        );
      }

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    try {
      // check if exists
      const existBooking = await this.prisma.booking.findUnique({
        where: { id },
      });
      if (!existBooking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      // Prepare update data
      const updateData: any = { ...updateBookingDto };

      // Handle payment_status based on status changes
      if (updateBookingDto.status) {
        const status = updateBookingDto.status.toLowerCase();
        console.log(`Updating booking ${id} status from ${existBooking.status} to ${status}`);
        
        switch (status) {
          case 'canceled':
          case 'cancelled':
            updateData.payment_status = 'canceled';
            console.log(`Setting payment_status to 'canceled' for status: ${status}`);
            break;
          case 'approved':
            updateData.payment_status = 'approved';
            console.log(`Setting payment_status to 'approved' for status: ${status}`);
            break;
          case 'pending':
          case 'confirmed':
          case 'completed':
          case 'processing':
          case 'active':
          case 'in_progress':
          default:
            // Keep existing payment_status or set to pending if not set
            if (!updateData.payment_status) {
              updateData.payment_status = 'pending';
              console.log(`Setting payment_status to 'pending' for status: ${status}`);
            } else {
              console.log(`Keeping existing payment_status: ${updateData.payment_status} for status: ${status}`);
            }
            break;
        }
      }

      const booking = await this.prisma.booking.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        data: booking,
        message: `Booking updated successfully. Status: ${booking.status}, Payment Status: ${booking.payment_status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateStatus(id: string, updateBookingDto: UpdateBookingDto) {
    try {
      // check if exists
      const existBooking = await this.prisma.booking.findUnique({
        where: { id },
      });
      if (!existBooking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      // Prepare update data
      const updateData: any = { ...updateBookingDto };

      // Handle payment_status based on status changes
      if (updateBookingDto.status) {
        const status = updateBookingDto.status.toLowerCase();
        console.log(`Updating booking ${id} status from ${existBooking.status} to ${status}`);
        
        switch (status) {
          case 'canceled':
          case 'cancelled':
            updateData.payment_status = 'canceled';
            console.log(`Setting payment_status to 'canceled' for status: ${status}`);
            break;
          case 'approved':
            updateData.payment_status = 'approved';
            console.log(`Setting payment_status to 'approved' for status: ${status}`);
            break;
          case 'pending':
          case 'confirmed':
          case 'completed':
          case 'processing':
          case 'active':
          case 'in_progress':
          default:
            // Keep existing payment_status or set to pending if not set
            if (!updateData.payment_status) {
              updateData.payment_status = 'pending';
              console.log(`Setting payment_status to 'pending' for status: ${status}`);
            } else {
              console.log(`Keeping existing payment_status: ${updateData.payment_status} for status: ${status}`);
            }
            break;
        }
      }

      const booking = await this.prisma.booking.update({
        where: { id },
        data: updateData,
      });

      // send notification
      // await NotificationRepository.createNotification({
      //   sender_id: booking.user_id,
      //   receiver_id: booking.vendor_id,
      //   text: 'Your booking has been updated',
      //   type: 'booking',
      // });

      return {
        success: true,
        message: `Booking status updated successfully. Status: ${booking.status}, Payment Status: ${booking.payment_status}`,
        data: booking,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getBookingStatistics(user_id?: string) {
    try {
      const where_condition = {};
      
      // filter using vendor id if the package is from vendor
      if (user_id) {
        const userDetails = await UserRepository.getUserDetails(user_id);
        if (userDetails && userDetails.type == 'vendor') {
          where_condition['vendor_id'] = user_id;
        }
      }

      // Get total count
      const totalCount = await this.prisma.booking.count({
        where: where_condition,
      });

      // Get count by type
      const hotelCount = await this.prisma.booking.count({
        where: {
          ...where_condition,
          type: 'hotel',
        },
      });

      const apartmentCount = await this.prisma.booking.count({
        where: {
          ...where_condition,
          type: 'apartment',
        },
      });

      const tourCount = await this.prisma.booking.count({
        where: {
          ...where_condition,
          type: 'tour',
        },
      });

      return {
        success: true,
        data: {
          all: totalCount,
          hotel: hotelCount,
          apartment: apartmentCount,
          tour: tourCount,
        },
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
      const booking = await this.prisma.booking.delete({
        where: { id },
      });

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
