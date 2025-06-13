import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';

@Injectable()
export class PaymentTransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll(user_id?: string) {
    try {
      const userDetails = await UserRepository.getUserDetails(user_id);

      const whereClause = {};
      if (userDetails.type == 'vendor') {
        whereClause['user_id'] = user_id;
      }

      const paymentTransactions = await this.prisma.paymentTransaction.findMany(
        {
          where: {
            ...whereClause,
          },
          select: {
            id: true,
            reference_number: true,
            status: true,
            provider: true,
            amount: true,
            currency: true,
            paid_amount: true,
            paid_currency: true,
            created_at: true,
            updated_at: true,
            booking: {
              select: {
                id: true,
                invoice_number: true,
                status: true,
                total_amount: true,
                booking_items: {
                  select: {
                    id: true,
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
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      );

      // add avatar url
      for (const paymentTransaction of paymentTransactions) {
        if (
          paymentTransaction.booking &&
          paymentTransaction.booking.user &&
          paymentTransaction.booking.user.avatar
        ) {
          paymentTransaction.booking.user['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar +
              paymentTransaction.booking.user.avatar,
          );
        }
      }

      return {
        success: true,
        data: paymentTransactions,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string, user_id?: string) {
    try {
      const userDetails = await UserRepository.getUserDetails(user_id);

      const whereClause = {};
      if (userDetails.type == 'vendor') {
        whereClause['user_id'] = user_id;
      }

      const paymentTransaction =
        await this.prisma.paymentTransaction.findUnique({
          where: {
            id: id,
            ...whereClause,
          },
          select: {
            id: true,
            reference_number: true,
            status: true,
            provider: true,
            amount: true,
            currency: true,
            paid_amount: true,
            paid_currency: true,
            created_at: true,
            updated_at: true,
            booking: {
              select: {
                id: true,
                invoice_number: true,
                status: true,
                total_amount: true,
                booking_items: {
                  select: {
                    id: true,
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
                    avatar: true,
                  },
                },
              },
            },
          },
        });

      if (!paymentTransaction) {
        return {
          success: false,
          message: 'Payment transaction not found',
        };
      }

      // add avatar url
      if (
        paymentTransaction.booking &&
        paymentTransaction.booking.user &&
        paymentTransaction.booking.user.avatar
      ) {
        paymentTransaction.booking.user['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar +
            paymentTransaction.booking.user.avatar,
        );
      }

      return {
        success: true,
        data: paymentTransaction,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string, user_id?: string) {
    try {
      const userDetails = await UserRepository.getUserDetails(user_id);

      const whereClause = {};
      if (userDetails.type == 'vendor') {
        whereClause['user_id'] = user_id;
      }

      const paymentTransaction =
        await this.prisma.paymentTransaction.findUnique({
          where: {
            id: id,
            ...whereClause,
          },
        });

      if (!paymentTransaction) {
        return {
          success: false,
          message: 'Payment transaction not found',
        };
      }

      await this.prisma.paymentTransaction.delete({
        where: {
          id: id,
        },
      });

      return {
        success: true,
        message: 'Payment transaction deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
