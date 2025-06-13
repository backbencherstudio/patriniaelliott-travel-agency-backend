import { Injectable } from '@nestjs/common';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from 'src/common/repository/user/user.repository';
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user_id: string) {
    try {
      const where_condition = {};
      // filter using vendor id if the package is from vendor
      if (user_id) {
        const userDetails = await UserRepository.getUserDetails(user_id);
        if (userDetails && userDetails.type == 'vendor') {
          where_condition['vendor_id'] = user_id;
        }
      }

      const bookings = await this.prisma.booking.findMany({
        where: { ...where_condition },
        orderBy: {
          created_at: 'desc',
        },
        take: 7,
        select: {
          id: true,
          user_id: true,
          booking_items: {
            select: {
              package: {
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
              avatar: true,
            },
          },
          total_amount: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

      // add avatar url to user
      for (const booking of bookings) {
        if (booking.user && booking.user.avatar) {
          booking.user['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + booking.user.avatar,
          );
        }
      }

      const totalBookings = await this.prisma.booking.count();
      const totalUsers = await this.prisma.user.count({
        where: {
          type: 'user',
        },
      });
      const totalVendors = await this.prisma.user.count({
        where: {
          type: 'vendor',
        },
      });
      const totalRevenue = await this.prisma.booking.aggregate({
        where: {
          ...where_condition,
        },
        _sum: {
          total_amount: true,
        },
      });

      // revenue per month
      const revenuePerMonth = await this.prisma.booking.groupBy({
        by: ['created_at'],
        _sum: {
          total_amount: true,
        },
        where: {
          ...where_condition,
        },
      });

      // map revenue per month
      const revenuePerMonthMap = revenuePerMonth.map((item) => {
        return {
          month: item.created_at,
          revenue: item._sum.total_amount,
        };
      });

      // sort revenue per month
      revenuePerMonthMap.sort((a, b) => {
        return new Date(a.month).getTime() - new Date(b.month).getTime();
      });

      // booking stats
      const confirmedBookings = await this.prisma.booking.count({
        where: {
          ...where_condition,
          status: 'confirmed',
        },
      });

      const pendingBookings = await this.prisma.booking.count({
        where: {
          ...where_condition,
          status: 'pending',
        },
      });

      const cancelledBookings = await this.prisma.booking.count({
        where: {
          ...where_condition,
          status: 'cancelled',
        },
      });

      const processingBookings = await this.prisma.booking.count({
        where: {
          ...where_condition,
          status: 'processing',
        },
      });

      return {
        success: true,
        data: {
          bookings: bookings,
          total_bookings: totalBookings,
          total_users: totalUsers,
          total_vendors: totalVendors,
          total_revenue: totalRevenue._sum.total_amount,
          revenue_per_month: revenuePerMonthMap,
          confirmed_bookings: confirmedBookings,
          pending_bookings: pendingBookings,
          cancelled_bookings: cancelledBookings,
          processing_bookings: processingBookings,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
