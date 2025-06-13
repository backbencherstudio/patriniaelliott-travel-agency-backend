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
import { LanguageService } from './language.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('language')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create language' })
  @Post()
  async create(@Body() createLanguageDto: CreateLanguageDto) {
    try {
      const language = await this.languageService.create(createLanguageDto);
      return language;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get all languages' })
  @Get()
  async findAll() {
    try {
      const languages = await this.languageService.findAll();
      return languages;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get one language' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const language = await this.languageService.findOne(id);
      return language;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update language' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLanguageDto: UpdateLanguageDto,
  ) {
    try {
      const language = this.languageService.update(id, updateLanguageDto);
      return language;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete language' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const language = await this.languageService.remove(id);
      return language;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
