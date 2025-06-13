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
  }: {
    user_id?: string;
    q?: string;
    status?: number;
    approve?: string;
  }) {
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

      const bookings = await this.prisma.booking.findMany({
        where: {
          ...where_condition,
        },
        orderBy: {
          created_at: 'desc',
        },
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
          payment_status: true,
          booking_items: {
            select: {
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

      return {
        success: true,
        data: bookings,
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

      const booking = await this.prisma.booking.update({
        where: { id },
        data: updateBookingDto,
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

      await this.prisma.booking.update({
        where: { id },
        data: updateBookingDto,
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
        message: 'Booking status updated',
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
