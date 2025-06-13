import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Req,
  ParseFilePipe,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import appConfig from '../../../config/app.config';

@ApiBearerAuth()
@ApiTags('Blog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Create blog' })
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.blog,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${file.originalname}`);
        },
      }),
    }),
  )
  async create(
    @Req() req: Request,
    @Body() createBlogDto: CreateBlogDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 10485760 }), // 10mb
          // new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    images?: Express.Multer.File[],
  ) {
    try {
      const user_id = req.user.userId;
      const result = await this.blogService.create(
        createBlogDto,
        user_id,
        images,
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get all blog' })
  @Get()
  async findAll(
    @Query() query: { q?: string; status?: number; approve?: string },
  ) {
    try {
      const searchQuery = query.q;
      const status = query.status;
      const approve = query.approve;

      const blogs = await this.blogService.findAll({
        q: searchQuery,
        status: status,
        approve: approve,
      });
      return blogs;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Get blog by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const blog = await this.blogService.findOne(id);
      return blog;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Update blog' })
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.blog,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${file.originalname}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 10485760 }), // 10mb
          // new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    images?: Express.Multer.File[],
  ) {
    try {
      const blog = await this.blogService.update(id, updateBlogDto, images);
      return blog;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN, Role.VENDOR)
  @ApiOperation({ summary: 'Update blog status' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: number },
  ) {
    try {
      const record = await this.blogService.updateStatus(id, body.status);

      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve blog by id' })
  @Patch('approve/:id')
  async approve(@Param('id') id: string) {
    try {
      const record = await this.blogService.approve(id);
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject blog by id' })
  @Patch('reject/:id')
  async reject(@Param('id') id: string) {
    try {
      const record = await this.blogService.reject(id);
      return record;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete blog' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const blog = await this.blogService.remove(id);
      return blog;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
