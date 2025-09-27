import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserCardDto } from './dto/create-user-card.dto';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class UserProfileService {
  constructor(private prisma: PrismaService) { }
  async update(id: string, updateUserProfileDto: UpdateUserProfileDto, avatar?: Express.Multer.File) {
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

      let avatarFileName: string | null = null;

      // Handle avatar upload if provided
      if (avatar) {
        try {
          // Validate avatar file
          if (!avatar.buffer || avatar.buffer.length === 0) {
            throw new Error('Invalid avatar file: file buffer is empty');
          }

          if (!avatar.mimetype || !avatar.mimetype.startsWith('image/')) {
            throw new Error('Invalid file type: only image files are allowed for avatar');
          }

          if (avatar.size > 5 * 1024 * 1024) { // 5MB limit for avatar
            throw new Error('Avatar file too large: maximum size is 5MB');
          }

          // Generate unique filename for the avatar
          const timestamp = Date.now();
          const randomString = Array(8)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileExtension = avatar.originalname.split('.').pop();
          avatarFileName = `avatar_${timestamp}_${randomString}.${fileExtension}`;

          // Upload avatar using SojebStorage
          const filePath = appConfig().storageUrl.avatar + avatarFileName;
          await SojebStorage.put(filePath, avatar.buffer);

          console.log(`Avatar uploaded successfully: ${avatarFileName}`);
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          return {
            success: false,
            message: 'Failed to upload avatar',
            error: uploadError.message
          };
        }
      }

      // Prepare update data
      const updateData: any = {
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
      };

      // Add avatar filename to update data if uploaded
      if (avatarFileName) {
        updateData.avatar = avatarFileName;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Generate avatar URL if avatar was uploaded
      let avatarUrl = null;
      if (avatarFileName) {
        avatarUrl = SojebStorage.url(appConfig().storageUrl.avatar + avatarFileName);
      }

      return {
        success: true,
        message: avatarFileName ? 'Profile and avatar updated successfully' : 'Profile updated successfully',
        data: {
          ...updatedUser,
          avatar_url: avatarUrl
        }
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
      const { paymentMethodId } = createUserCardDto;

      const paymentMethod = await StripePayment.getPaymentMethod({ id: paymentMethodId });

      if (!paymentMethod || !paymentMethod.card) {
        throw new Error('Invalid payment method');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id: user_id
        }
      })

      await StripePayment.attachPaymentMethod({
        customer_id: user.stripe_customer_id,
        payment_method_id: paymentMethod.id,
      });

      const defaultCard = await this.prisma.userCard.findFirst({
        where: { user_id, is_default: true },
      });

      const card = await this.prisma.userCard.create({
        data: {
          user_id,
          customer_id: user.stripe_customer_id,
          stripe_payment_method_id: paymentMethod.id,
          brand: paymentMethod.card.brand,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          last4: paymentMethod.card.last4,
          is_default: !defaultCard,
        },
      });

      return {
        success: true,
        message: 'Card saved successfully',
        data: card,
      };
    } catch (error: any) {
      console.error(`Error adding card: ${error?.message}`);
      return {
        success: false,
        message: 'Failed to save card',
        error: error?.message,
      };
    }
  }


  async getCard(customer_id: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          stripe_customer_id: customer_id
        }
      })

      if (!user) {
        throw new NotFoundException('User not found.')
      }

      const cards = await this.prisma.userCard.findMany({
        where: {
          customer_id: customer_id
        }
      })
      return {
        success: true,
        message: 'Cards fetched successfully',
        data: cards
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch card',
        error: error.message,
      };
    }
  }

  async deleteCard(user_id: string, card_id: string) {
    try {
      const card = await this.prisma.userCard.findFirst({
        where: { stripe_payment_method_id: card_id, user_id },
      });

      if (!card) {
        return {
          success: false,
          message: 'Card not found',
        };
      }

      await StripePayment.deletePaymentMethods(card_id)
      await this.prisma.userCard.delete({ where: { stripe_payment_method_id: card_id } });

      return {
        success: true,
        message: 'Card deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting card:', error?.message)
      return {
        success: false,
        message: 'Failed to delete card',
        error: error.message,
      };
    }
  }

  async getTransactions(user_id: string) {
    try {
      const transactions = await this.prisma.paymentTransaction.findMany({
        where: {
          user_id: user_id
        }
      })
      return {
        success: true,
        message: 'Transactions fetched successfully.',
        data: transactions,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch transactions.',
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