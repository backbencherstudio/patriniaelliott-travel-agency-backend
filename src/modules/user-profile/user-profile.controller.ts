import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ApiOperation } from '@nestjs/swagger';
import { CreateUserCardDto } from './dto/create-user-card.dto';

@Controller('user-profile')
// @UseGuards(JwtAuthGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) { }

  @ApiOperation({ summary: 'Update user profile' })
  @Patch('/update')
  async update(
    @Req() req: Request,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    try {
      const user_id = req.user.userId;
      return this.userProfileService.update(user_id, updateUserProfileDto);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update user profile',
      };
    }
  }

  @Delete('/delete')
  async remove(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      return this.userProfileService.remove(user_id);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete user profile',
      };
    }
  }

  @ApiOperation({ summary: 'Add user card details' })
  @Post('/cards')
  async addCard(
    @Req() req: Request,
    @Body() createUserCardDto: CreateUserCardDto,
  ) {
    try {
      // const user_id = req.user.userId;
      const user_id = 'cmfm9miep0002vc18ns8mjehb';
      return this.userProfileService.addCard(user_id, createUserCardDto);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to save card',
      };
    }
  }


  @ApiOperation({ summary: 'Get call cards by user' })
  @Get('/cards/:customer_id')
  async indexCard(
    @Req() req: Request,
    @Param('customer_id') customer_id: string,
  ) {
    return this.userProfileService.getCard(customer_id)
  }

  @Delete('/cards/:cardId')
  async deleteCard(
    @Req() req: Request,
    @Param('cardId') cardId: string,
  ) {
    try {
      const user_id = req.user.userId;
      return this.userProfileService.deleteCard(user_id, cardId);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete card',
      };
    }
  }
}
