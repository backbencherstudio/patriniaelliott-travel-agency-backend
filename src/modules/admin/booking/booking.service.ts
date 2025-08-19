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
    page,
    limit,
    sort_by,
  }: {
    user_id?: string;
    q?: string;
    status?: number;
    approve?: string;
    type?: string;
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

      // Calculate pagination
      const skip = (pageNumber - 1) * limitNumber;
      
      // Determine sort order
      let orderBy = {};
      switch (sortBy) {
        case 'created_at_asc':
          orderBy = { created_at: 'asc' };
          break;
        case 'total_amount_desc':
          orderBy = { total_amount: 'desc' };
          break;
        case 'total_amount_asc':
          orderBy = { total_amount: 'asc' };
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
        data: bookings,
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
