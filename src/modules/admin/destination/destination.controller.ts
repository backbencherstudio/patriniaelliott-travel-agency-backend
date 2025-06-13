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
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { DestinationService } from './destination.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Destination')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VENDOR)
@Controller('admin/destination')
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  @ApiOperation({ summary: 'Create destination' })
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.destination,
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
    @Body() createDestinationDto: CreateDestinationDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 10485760 }), // 10mb
          // new FileTypeValidator({ fileType: 'image/*' }),
        ],
        // fileIsRequired: false,
      }),
    )
    images?: Express.Multer.File[],
  ) {
    try {
      const user_id = req.user.userId;
      const destination = await this.destinationService.create(
        user_id,
        createDestinationDto,
        images,
      );
      return destination;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get all destinations' })
  @Get()
  async findAll(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      const destinations = await this.destinationService.findAll(user_id);
      return destinations;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get destination by id' })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const destination = await this.destinationService.findOne(id, user_id);
      return destination;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update destination by id' })
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + appConfig().storageUrl.destination,
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
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDestinationDto: UpdateDestinationDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10485760 }), // 10mb
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    images?: Express.Multer.File[],
  ) {
    try {
      const user_id = req.user.userId;
      const destination = await this.destinationService.update(
        id,
        user_id,
        updateDestinationDto,
        images,
      );
      return destination;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete destination image by id' })
  @Delete('image/:id')
  async removeImage(@Param('id') id: string) {
    try {
      const destination = await this.destinationService.removeImage(id);
      return destination;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Approve destination by id' })
  @Patch('approve/:id')
  async approve(@Param('id') id: string) {
    try {
      const destination = await this.destinationService.approve(id);
      return destination;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Reject destination by id' })
  @Patch('reject/:id')
  async reject(@Param('id') id: string) {
    try {
      const destination = await this.destinationService.reject(id);
      return destination;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete destination by id' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const destination = await this.destinationService.remove(id);
      return destination;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
