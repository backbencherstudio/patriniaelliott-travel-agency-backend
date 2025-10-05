import {
  Controller,
  UseGuards,
  Post,
  Get,
  Patch,
  Req,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Param,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VendorUserVerificationService } from './vendor_user_verification.service';
import { UserDocumentDto, VendorVerificationDto } from './dto/create-vendor-user-verification.dto/create-vendor-user-verification.dto';

@ApiTags('vendor-user-verification')
@Controller('vendor-user-verification')
export class VendorUserVerificationController {
  constructor(
    private readonly vendorUserVerificationService: VendorUserVerificationService,
  ) {}

  @ApiOperation({ summary: 'Upload vendor verification documents (front and back images)' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'front_image', maxCount: 1 },
      { name: 'back_image', maxCount: 1 },
      { name: 'image', maxCount: 1 }, // Keep backward compatibility
    ], {
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit per file (temporary increase for debugging)
        files: 3, // Maximum 3 files total
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
    @UploadedFiles()
    files?: {
      front_image?: Express.Multer.File[];
      back_image?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ) {
    try {
      const user_id = req.user.userId;
      
      // Validate user_id exists
      if (!user_id) {
        return {
          success: false,
          message: 'User ID is required for document upload',
        };
      }
      
      // Validate files before processing
      const validationResult = this.validateUploadedFiles(files);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: validationResult.message,
        };
      }
      
      // Extract individual files for backward compatibility
      const frontImage = files?.front_image?.[0];
      const backImage = files?.back_image?.[0];
      const image = files?.image?.[0]; // For backward compatibility
      
      // Check if at least one file is provided
      if (!frontImage && !backImage && !image) {
        return {
          success: false,
          message: 'At least one document file is required for upload',
        };
      }
      
      const docResp = await this.vendorUserVerificationService.create(
        body, 
        user_id, 
        frontImage, 
        backImage, 
        image
      );
      
      // If the response indicates that upload is not allowed, return it directly
      if (!docResp.success) {
        return docResp;
      }
      
      const userPackages = await this.vendorUserVerificationService.getUserPackages(user_id);
      return {
        ...docResp,
        user_packages: userPackages,
      };
    } catch (error) {
      console.error('Vendor verification upload error:', error);
      
      return {
        success: false,
        message: this.getErrorMessage(error),
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
        const docResp = await this.vendorUserVerificationService.create(
          {
            type: 'vendor_verification',
            status: 'pending'
          },
          user_id,
          document
        );
        
        // If document upload is not allowed, return the response
        if (!docResp.success) {
          return docResp;
        }
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
        const docResp = await this.vendorUserVerificationService.create(
          {
            type: 'vendor_verification',
            status: 'pending'
          },
          userId,
          document,
        );
        
        // If document upload is not allowed, return the response
        if (!docResp.success) {
          return docResp;
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Helper method to validate uploaded files
  private validateUploadedFiles(files?: {
    front_image?: Express.Multer.File[];
    back_image?: Express.Multer.File[];
    image?: Express.Multer.File[];
  }): { isValid: boolean; message?: string } {
    if (!files) {
      return { isValid: true };
    }

    const allFiles = [
      ...(files?.front_image || []),
      ...(files?.back_image || []),
      ...(files?.image || [])
    ];
    
    // Check each file individually
    for (const file of allFiles) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit per file
        return {
          isValid: false,
          message: `File "${file.originalname}" is too large. Maximum file size is 20MB per file.`,
        };
      }
      
      if (!file.mimetype.startsWith('image/')) {
        return {
          isValid: false,
          message: `File "${file.originalname}" is not a valid image file. Only image files (JPG, PNG, GIF, WebP) are allowed.`,
        };
      }
    }

    return { isValid: true };
  }

  // Helper method to get appropriate error message
  private getErrorMessage(error: any): string {
    if (error.message && error.message.includes('expected size is less than')) {
      return 'File too large. Maximum file size is 20MB per file.';
    }
    
    if (error.message && error.message.includes('Only image files are allowed')) {
      return 'Invalid file type. Only image files (JPG, PNG, GIF, WebP) are allowed.';
    }
    
    if (error.message && error.message.includes('Invalid file extension')) {
      return 'Invalid file extension. Only JPG, PNG, GIF, and WebP files are allowed.';
    }
    
    if (error.message && error.message.includes('User not found')) {
      return 'User not found. Please ensure you are logged in correctly.';
    }
    
    if (error.message && error.message.includes('Already your document approved')) {
      return 'Your documents have already been approved. No new uploads are allowed.';
    }
    
    if (error.message && error.message.includes('pending documents')) {
      return 'You already have pending documents. Please wait for approval before uploading new documents.';
    }
    
    if (error.message && error.message.includes('Failed to upload file')) {
      return 'File upload failed. Please try again with a valid image file.';
    }
    
    return error.message || 'An unexpected error occurred while uploading documents. Please try again.';
  }
}
