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
  Param,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VendorUserVerificationService } from './vendor_user_verification.service';
import { UserDocumentDto, VendorVerificationDto } from './dto/create-vendor-user-verification.dto/create-vendor-user-verification.dto';

@ApiTags('vendor-user-verification')
@Controller('vendor-user-verification')
export class VendorUserVerificationController {
  constructor(
    private readonly vendorUserVerificationService: VendorUserVerificationService,
  ) {}

  @ApiOperation({ summary: 'Upload a vendor verification document' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async create(
    @Req() req: any,
    @Body() body: UserDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ) {
    try {
      const user_id = req.user.userId;
      return await this.vendorUserVerificationService.create(body, user_id, image);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Register as a new vendor' })
  @ApiConsumes('multipart/form-data')
  @Post('register')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async registerVendor(
    @Body() vendorData: VendorVerificationDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    document?: Express.Multer.File,
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

  @ApiOperation({ summary: 'Get vendor verification by user id' })
  @UseGuards(JwtAuthGuard)
  @Get('vendor/:userId')
  async getVendorVerificationByUserId(@Param('userId') userId: string) {
    try {
      return await this.vendorUserVerificationService.getVendorVerification(userId);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Update vendor verification details' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async updateVendorVerification(
    @Req() req: any,
    @Body() vendorData: Partial<VendorVerificationDto>,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    document?: Express.Multer.File,
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
            status: 'pending'
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

  // Update vendor verification by user id (application scope)
  @ApiOperation({ summary: 'Update vendor verification by user id' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @Patch('vendor/:userId')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async updateVendorByUserId(
    @Param('userId') userId: string,
    @Body() vendorData: Partial<VendorVerificationDto>,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    document?: Express.Multer.File,
  ) {
    try {
      const result = await this.vendorUserVerificationService.updateVendorVerification(userId, vendorData);

      if (document) {
        await this.vendorUserVerificationService.create(
          {
            type: 'vendor_verification',
            status: 'pending'
          },
          userId,
          document,
        );
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
