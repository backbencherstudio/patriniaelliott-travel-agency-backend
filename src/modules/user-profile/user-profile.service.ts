import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserCardDto } from './dto/create-user-card.dto';

@Injectable()
export class UserProfileService {
  constructor(private prisma: PrismaService) {}
  async update(id: string, updateUserProfileDto: UpdateUserProfileDto) {
    try {
      // First check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: id }
      });

      if (!existingUser) {
        return {
          success: false,
          message: 'User not found',
          error: 'No user exists with this ID'
        };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          first_name: updateUserProfileDto.first_name,
          last_name: updateUserProfileDto.last_name,
          display_name: updateUserProfileDto.display_name,
          nationality: updateUserProfileDto.nationality,
          email: updateUserProfileDto.email,
          phone_number: updateUserProfileDto.phone_number,
          gender: updateUserProfileDto.gender,
          date_of_birth: updateUserProfileDto.date_of_birth ? new Date(updateUserProfileDto.date_of_birth) : undefined,
          country: updateUserProfileDto.country,
          street_address: updateUserProfileDto.street_address,
          apt_suite_unit: updateUserProfileDto.apt_suite_unit,
          city: updateUserProfileDto.city,
          state: updateUserProfileDto.state,
          zip_code: updateUserProfileDto.zip_code,
          passport_first_name: updateUserProfileDto.passport_first_name,
          passport_last_name: updateUserProfileDto.passport_last_name,
          passport_number: updateUserProfileDto.passport_number,
          passport_issuing_country: updateUserProfileDto.passport_issuing_country,
          passport_expiry_date: updateUserProfileDto.passport_expiry_date ? new Date(updateUserProfileDto.passport_expiry_date) : undefined,
        },
      });

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            message: 'User not found',
            error: 'No user exists with this ID'
          };
        }
      }
      return {
        success: false,
        message: 'Failed to update profile',
        error: error.message
      };
    }
  }

  async addCard(user_id: string, createUserCardDto: CreateUserCardDto) {
    try {
      // Validate user existence
      const user = await this.prisma.user.findUnique({ where: { id: user_id } });
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const newCard = await this.prisma.userCard.create({
        data: {
          user_id,
          card_number: createUserCardDto.card_number,
          expiry_month: createUserCardDto.expiry_month,
          expiry_year: createUserCardDto.expiry_year,
          cvv: createUserCardDto.cvv,
          billing_country: createUserCardDto.billing_country,
          billing_street_address: createUserCardDto.billing_street_address,
          billing_apt_suite_unit: createUserCardDto.billing_apt_suite_unit,
          billing_state: createUserCardDto.billing_state,
          billing_city: createUserCardDto.billing_city,
          billing_zip_code: createUserCardDto.billing_zip_code,
        },
      });

      return {
        success: true,
        message: 'Card saved successfully',
        data: newCard,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to save card',
        error: error.message,
      };
    }
  }

  async deleteCard(user_id: string, card_id: string) {
    try {
      // Verify card exists and belongs to user
      const card = await this.prisma.userCard.findFirst({
        where: { id: card_id, user_id },
      });

      if (!card) {
        return {
          success: false,
          message: 'Card not found',
        };
      }

      await this.prisma.userCard.delete({ where: { id: card_id } });

      return {
        success: true,
        message: 'Card deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete card',
        error: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: id }
      });

      if (!existingUser) {
        return {
          success: false,
          message: 'User not found',
          error: 'No user exists with this ID'
        };
      }

      await this.prisma.user.delete({
        where: { id: id }
      });
      return {
        success: true,
        message: 'Profile deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete profile',
        error: error.message
      };
    }
  }
}
