import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SocialMediaService } from './social-media.service';
import { CreateSocialMediaDto } from './dto/create-social-media.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';

@ApiBearerAuth()
@ApiTags('Social Media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/social-media')
export class SocialMediaController {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  @ApiOperation({ summary: 'Create social media' })
  @Post()
  async create(@Body() createSocialMediaDto: CreateSocialMediaDto) {
    try {
      const socialMedia =
        await this.socialMediaService.create(createSocialMediaDto);
      return socialMedia;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get all social media' })
  @Get()
  async findAll() {
    try {
      const socialMedia = await this.socialMediaService.findAll();
      return socialMedia;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get social media by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const socialMedia = await this.socialMediaService.findOne(id);
      return socialMedia;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update social media' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSocialMediaDto: UpdateSocialMediaDto,
  ) {
    try {
      const socialMedia = await this.socialMediaService.update(
        id,
        updateSocialMediaDto,
      );
      return socialMedia;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete social media' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const socialMedia = await this.socialMediaService.remove(id);
      return socialMedia;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
