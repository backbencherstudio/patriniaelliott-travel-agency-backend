import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Req,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { VendorUserVerificationService } from './vendor_user_verification.service';
import { UserDocumentDto, VendorVerificationDto } from './dto/create-vendor-user-verification.dto/create-vendor-user-verification.dto';

@ApiTags('vendor-user-verification')
@Controller('vendor-user-verification')
export class VendorUserVerificationController {
  constructor(
    private readonly vendorUserVerificationService: VendorUserVerificationService,
  ) {}

  @ApiOperation({ summary: 'Upload a vendor verification document' })
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('document'))
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

  @ApiOperation({ summary: 'Register as a new vendor' })
  @Post('register')
  @UseInterceptors(FileInterceptor('document'))
  async registerVendor(
    @Body() vendorData: VendorVerificationDto,
    @UploadedFile() document?: Express.Multer.File,
  ) {
    try {
      return await this.vendorUserVerificationService.registerVendor(vendorData, document);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Get vendor verification details' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getVendorVerification(@Req() req: any) {
    try {
      const user_id = req.user.userId;
      return await this.vendorUserVerificationService.getVendorVerification(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update vendor verification details' })
  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('document'))
  async updateVendorVerification(
    @Req() req: any,
    @Body() vendorData: Partial<VendorVerificationDto>,
    @UploadedFile() document?: Express.Multer.File,
  ) {
    const user_id = req.user.userId;
    console.log(user_id);
    console.log(vendorData);
    try {
      // Update vendor verification data for this specific user
      const result = await this.vendorUserVerificationService.updateVendorVerification(user_id, vendorData);
      
      // If document is provided, create user document for this user
      if (document) {
        await this.vendorUserVerificationService.create(
          {
            type: 'vendor_verification',
            file_name: document.originalname,
            file_path: document.filename,
            file_type: document.mimetype,
          },
          user_id,
          document
        );
      }
      
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
