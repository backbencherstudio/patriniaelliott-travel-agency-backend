import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import appConfig from '../../../config/app.config';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await UserRepository.createUser(createUserDto);

      if (user.success) {
        return {
          success: user.success,
          message: user.message,
        };
      } else {
        return {
          success: user.success,
          message: user.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async overview(){
    try {
      // total users count
      const totalUsers = await this.prisma.user.count({
        where: {
          type: 'user',
        },
      });

      // total admin count
      const totalAdmins = await this.prisma.user.count({
        where:{
          type: 'admin'
        }
      })
      const totalHost = await this.prisma.user.count({
        where:{
          type: 'vendor'
        }
      })

      const totalGuest = await this.prisma.user.count({
        where:{
          type: 'user'
        }
      })


      return {
        success: true,
        message: 'User overview fetched successfully',
        data: {
          totalUsers: totalUsers,
          totalAdmins: totalAdmins,
          totalHost: totalHost,
          totalGuest: totalGuest,
        },
      };
      
    } catch (error) {
      if(error instanceof HttpException){
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(query: { 
    type?: string; 
    day?: string; 
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
        type: query.type || "user",
      };

      // Handle date filtering
      if (query.dateFilter) {
        const now = new Date();
        let startDate: Date;

        switch (query.dateFilter) {
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '1week':
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
      const totalCount = await this.prisma.user.count({
        where: whereClause,
      });

      // Get users with pagination
      const users = await this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone_number: true,
          address: true,
          type: true,
          approved_at: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: skip,
        take: limit,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: users,
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
      const user = await this.prisma.user.findUnique({
        where: {
          id: id,
        }
      });

      const user_reviews = await this.prisma.review.findMany({
        where: {
          user_id: user.id,
        },
      });

      const reviews_count = await this.prisma.review.count({
        where: {
          user_id: user.id,
        },
      });

      // calculate avarage rating
      let totalRating = 0;
      let totalReviews = 0;
      for (const review of user_reviews) {
        totalRating += review.rating_value;
        totalReviews++;
      }
      const averageRating = totalRating / totalReviews;
      user['average_rating'] = averageRating;
      user['reviews_count'] = reviews_count;

      // add avatar url to user
      if (user.avatar) {
        user['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + user.avatar,
        );
      }

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
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
      const user = await this.prisma.user.findUnique({
        where: { id: id },
      });
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      await this.prisma.user.update({
        where: { id: id },
        data: { approved_at: DateHelper.now() },
      });
      return {
        success: true,
        message: 'User approved successfully',
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
      const user = await this.prisma.user.findUnique({
        where: { id: id },
      });
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      await this.prisma.user.update({
        where: { id: id },
        data: { approved_at: null },
      });
      return {
        success: true,
        message: 'User rejected successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await UserRepository.updateUser(id, updateUserDto);

      if (user.success) {
        return {
          success: user.success,
          message: user.message,
        };
      } else {
        return {
          success: user.success,
          message: user.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      const user = await UserRepository.deleteUser(id);
      return user;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
