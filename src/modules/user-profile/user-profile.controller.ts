import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserProfileService } from './user-profile.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { CreateUserCardDto } from './dto/create-user-card.dto';

@Controller('user-profile')
@UseGuards(JwtAuthGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) { }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @Patch('/update')
  async update(
    @Req() req: Request,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    try {
      const user_id = req.user.userId;
      return this.userProfileService.update(user_id, updateUserProfileDto, avatar);
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

  // Payments
  @ApiOperation({ summary: 'Add user card details' })
  @Post('/cards')
  async addCard(
    @Req() req: Request,
    @Body() createUserCardDto: CreateUserCardDto,
  ) {
    const user_id = req.user.userId;
    return this.userProfileService.addCard(user_id, createUserCardDto);
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
    const user_id = req.user?.userId;
    return this.userProfileService.deleteCard(user_id, cardId);
  }

  @ApiOperation({ summary: 'Get transactions by user' })
  @Get('/transactions')
  async transactions(@Req() req: Request,) {
    const user_id = req.user?.userId;
    return this.userProfileService.getTransactions(user_id)
  }
}
