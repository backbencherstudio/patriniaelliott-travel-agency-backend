import {
  Controller,
  UseGuards,
  UseInterceptors,
  Post,
  Req,
  Body,
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import appConfig from '../../../config/app.config';
import { VendorUserVerificationService } from './vendor_user_verification.service';
import { UserDocumentDto } from './dto/create-vendor-user-verification.dto/create-vendor-user-verification.dto';

@ApiTags('vendor-user-verification')
@Controller('vendor-user-verification')
export class VendorUserVerificationController {
  constructor(
    private readonly vendorUserVerificationService: VendorUserVerificationService,
  ) {}

  @ApiOperation({ summary: 'Upload a vendor verification document' })
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('document', {
      storage: diskStorage({
        destination:
          appConfig().storageUrl.rootUrl + '/' + appConfig().storageUrl.package,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${file.originalname}`);
        },
      }),
    }),
  )
  async create(
    @Req() req: any,
    @Body() body: UserDocumentDto,
    @UploadedFile() document?: Express.Multer.File,
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorUserVerificationService.create(body, user_id, document);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
