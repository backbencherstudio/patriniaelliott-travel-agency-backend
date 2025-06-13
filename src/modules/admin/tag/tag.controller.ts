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
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';

@ApiBearerAuth()
@ApiTags('Tag')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create tag' })
  @Post()
  async create(@Body() createTagDto: CreateTagDto) {
    try {
      const tag = await this.tagService.create(createTagDto);
      return tag;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get all tags' })
  @Get()
  async findAll() {
    try {
      const tags = await this.tagService.findAll();
      return tags;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get tag by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const tag = await this.tagService.findOne(id);
      return tag;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update tag' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    try {
      const tag = await this.tagService.update(id, updateTagDto);
      return tag;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete tag' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const tag = await this.tagService.remove(id);
      return tag;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
