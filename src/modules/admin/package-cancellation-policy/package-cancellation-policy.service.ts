import { Injectable } from '@nestjs/common';
import { CreatePackageCancellationPolicyDto } from './dto/create-package-cancellation-policy.dto';
import { UpdatePackageCancellationPolicyDto } from './dto/update-package-cancellation-policy.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import { DateHelper } from '../../../common/helper/date.helper';
import { UserRepository } from '../../../common/repository/user/user.repository';

@Injectable()
export class PackageCancellationPolicyService {
  constructor(private prisma: PrismaService) {}

  async create(
    user_id: string,
    createPackageCancellationPolicyDto: CreatePackageCancellationPolicyDto,
  ) {
    try {
      const { policy, description } = createPackageCancellationPolicyDto;

      await this.prisma.packageCancellationPolicy.create({
        data: {
          policy,
          description,
          user_id: user_id,
        },
      });

      return {
        success: true,
        message: 'Package cancellation policy created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll(user_id?: string) {
    try {
      const where_condition = {};
      // filter using vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type == 'vendor') {
        where_condition['user_id'] = user_id;
      }

      if (!userDetails) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const packageCancellationPolicies =
        await this.prisma.packageCancellationPolicy.findMany({
          where: {
            ...where_condition,
          },
          select: {
            id: true,
            policy: true,
            description: true,
            created_at: true,
            updated_at: true,
          },
        });

      return {
        success: true,
        data: packageCancellationPolicies,
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
      const where_condition = {};
      // filter using vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type == 'vendor') {
        where_condition['user_id'] = user_id;
      }
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const packageCancellationPolicy =
        await this.prisma.packageCancellationPolicy.findUnique({
          where: { id: id, ...where_condition },
          select: {
            id: true,
            policy: true,
            description: true,
            created_at: true,
            updated_at: true,
          },
        });

      if (!packageCancellationPolicy) {
        return {
          success: false,
          message: 'Package cancellation policy not found',
        };
      }

      return {
        success: true,
        data: packageCancellationPolicy,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(
    id: string,
    user_id: string,
    updatePackageCancellationPolicyDto: UpdatePackageCancellationPolicyDto,
  ) {
    try {
      const { policy, description } = updatePackageCancellationPolicyDto;

      const data: any = {};

      if (policy) data.policy = policy;
      if (description) data.description = description;

      await this.prisma.packageCancellationPolicy.update({
        where: { id: id },
        data: {
          ...data,
          user_id: user_id,
          updated_at: DateHelper.now(),
        },
      });
      return {
        success: true,
        message: 'Package cancellation policy updated successfully',
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
      await this.prisma.packageCancellationPolicy.delete({
        where: { id: id },
      });
      return {
        success: true,
        message: 'Package cancellation policy deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
