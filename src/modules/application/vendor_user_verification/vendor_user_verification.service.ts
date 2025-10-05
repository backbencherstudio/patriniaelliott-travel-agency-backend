import { Injectable } from '@nestjs/common';
import appConfig from '../../../config/app.config';
import { UserDocumentDto, VendorVerificationDto } from './dto/create-vendor-user-verification.dto/create-vendor-user-verification.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../../common/guard/role/role.enum';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';

@Injectable()
export class VendorUserVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userDocumentDto: UserDocumentDto,
    userId: string,
    frontImage?: Express.Multer.File,
    backImage?: Express.Multer.File,
    legacyImage?: Express.Multer.File, // For backward compatibility
  ) {
    try {
      // Check if user exists
      const userData = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!userData) {
        throw new Error('User not found');
      }

      // Set default type if not provided
      const documentType = userDocumentDto.type || 'vendor_verification';

      // Helper function to process and upload a file
      const processFile = async (file: Express.Multer.File): Promise<string> => {
        // Validate file
        if (!file.buffer || file.buffer.length === 0) {
          throw new Error('Invalid file: file buffer is empty');
        }

        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          throw new Error('Invalid file type: only image files are allowed');
        }
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
          throw new Error('File too large: maximum size is 20MB');
        }
        
        // Generate unique filename for the uploaded image
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${randomName}.${fileExtension}`;
        
        try {
          // Upload file using SojebStorage with the correct path structure
          const filePath = appConfig().storageUrl.package + fileName;
          console.log('Uploading file to:', filePath);
          await SojebStorage.put(filePath, file.buffer);
          return fileName;
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
      };

      // Process all provided files
      let frontImageFileName: string | null = null;
      let backImageFileName: string | null = null;
      let legacyImageFileName: string | null = null;

      if (frontImage) {
        frontImageFileName = await processFile(frontImage);
      }

      if (backImage) {
        backImageFileName = await processFile(backImage);
      }

      if (legacyImage) {
        legacyImageFileName = await processFile(legacyImage);
      }

      // Create UserDocument record following the schema
      const document = await this.prisma.userDocument.create({
        data: {
          user_id: userId,
          type: documentType,
          number: userDocumentDto.number || null,
          front_image: frontImageFileName,
          back_image: backImageFileName,
          image: legacyImageFileName, // For backward compatibility
          status: userDocumentDto.status || 'pending',
        },
      });

      // Generate public URLs for all uploaded images
      const documentWithUrls = {
        ...document,
        front_image_url: frontImageFileName ? this.generateFileUrl(frontImageFileName, 'package') : null,
        back_image_url: backImageFileName ? this.generateFileUrl(backImageFileName, 'package') : null,
        image_url: legacyImageFileName ? this.generateFileUrl(legacyImageFileName, 'package') : null
      };

      return {
        success: true,
        data: documentWithUrls,
        message: 'Document(s) uploaded successfully for vendor verification.',
      };
    } catch (error) {
      throw new Error(`Failed to create user document: ${error.message}`);
    }
  }

  async getUserPackages(userId: string) {
    const packages = await this.prisma.package.findMany({
      where: { user_id: userId, deleted_at: null },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        approved_at: true,
        price: true,
        type: true,
        created_at: true,
        package_files: {
          select: { id: true, file: true, type: true, sort_order: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    // Attach file URLs
    for (const pkg of packages) {
      if (pkg.package_files && (pkg.package_files as any[]).length > 0) {
        for (const f of pkg.package_files as any[]) {
          if (f.file) {
            f['file_url'] = SojebStorage.url(appConfig().storageUrl.package + f.file);
          }
        }
      }
    }

    return packages;
  }

  // Helper method to generate file URLs
  private generateFileUrl(filename: string, type: string): string {
    const storagePath = appConfig().storageUrl[type] || appConfig().storageUrl.package;
    return SojebStorage.url(storagePath + filename);
  }

  async registerVendor(vendorData: VendorVerificationDto, file?: Express.Multer.File) {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: vendorData.email }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        vendorData.password,
        appConfig().security.salt,
      );

      // Create user with vendor type
      const user = await this.prisma.user.create({
        data: {
          first_name: vendorData.first_name,
          email: vendorData.email,
          phone_number: vendorData.phone_number,
          password: hashedPassword,
          type: Role.VENDOR,
          status: 1,
        },
      });

      // Create vendor verification record
      const vendorVerification = await this.prisma.vendorVerification.create({
        data: {
          user_id: user.id,
          first_name: vendorData.first_name,
          phone_number: vendorData.phone_number,
          business_website: vendorData.business_website,
          vendor_type: vendorData.vendor_type,
          TIN: vendorData.TIN,
          property_name: vendorData.property_name,
          address: vendorData.address,
          unit_number: vendorData.unit_number,
          postal_code: vendorData.postal_code,
          city: vendorData.city,
          country: vendorData.country,
          owner_type: vendorData.owner_type,
          owner_first_name: vendorData.owner_first_name,
          owner_last_name: vendorData.owner_last_name,
          owner_phone_numbers: vendorData.owner_phone_numbers,
          owner_alt_names: vendorData.owner_alt_names,
          manager_name: vendorData.manager_name,
          is_govt_representation: vendorData.is_govt_representation,
          payment_method: vendorData.payment_method,
          payment_email: vendorData.payment_email,
          payment_account_name: vendorData.payment_account_name,
          payment_TIN: vendorData.payment_TIN,
          billing_address: vendorData.billing_address,
          status: 'pending',
          step: 1,
        },
      });

      // If file is provided, create user document using SojebStorage
      let document = null;
      if (file) {
        // Validate file
        if (!file.buffer || file.buffer.length === 0) {
          throw new Error('Invalid file: file buffer is empty');
        }

        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          throw new Error('Invalid file type: only image files are allowed');
        }

        if (file.size > 20 * 1024 * 1024) { // 20MB limit
          throw new Error('File too large: maximum size is 20MB');
        }

        try {
          // Generate unique filename for the uploaded image
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileExtension = file.originalname.split('.').pop();
          const fileName = `${randomName}.${fileExtension}`;
          
          // Upload file using SojebStorage with the correct path structure
          const filePath = appConfig().storageUrl.package + fileName;
          await SojebStorage.put(filePath, file.buffer);
          
          document = await this.prisma.userDocument.create({
            data: {
              user_id: user.id,
              type: 'vendor_verification',
              image: fileName,
              status: 'pending',
            },
          });
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
      }

      return {
        success: true,
        message: 'Vendor registration successful. Verification is pending.',
        data: {
          user: {
            id: user.id,
            first_name: user.first_name,
            email: user.email,
            phone_number: user.phone_number,
            type: user.type,
          },
          vendor_verification: vendorVerification,
          document: document,
        },
      };
    } catch (error) {
      throw new Error(`Vendor registration failed: ${error.message}`);
    }
  }

  async updateVendorVerification(userId: string, vendorData: Partial<VendorVerificationDto>) {
    try {
      console.log('Updating vendor verification for user ID:', userId);
      console.log('Update data:', vendorData);

      // Check if user exists and is a vendor
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { VendorVerification: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      console.log('Found user:', { id: user.id, email: user.email, type: user.type });

      // Check if user is a vendor
      if (user.type !== Role.VENDOR) {
        throw new Error('Access denied. Only vendors can update verification details.');
      }

      // Check if vendor verification exists
      if (!user.VendorVerification) {
        throw new Error('Vendor verification not found. Please register as a vendor first.');
      }

      console.log('Found vendor verification for user:', user.VendorVerification.id);

      // Update user data if provided
      const userUpdateData: any = {};
      if (vendorData.first_name) userUpdateData.first_name = vendorData.first_name;
      if (vendorData.phone_number) userUpdateData.phone_number = vendorData.phone_number;
      if (vendorData.password) {
        userUpdateData.password = await bcrypt.hash(
          vendorData.password,
          appConfig().security.salt,
        );
      }

      // Check if email is being updated and if it already exists
      if (vendorData.email && vendorData.email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: vendorData.email }
        });

        if (existingUser && existingUser.id !== userId) {
          throw new Error('Email already exists');
        }

        userUpdateData.email = vendorData.email;
      }

      // Update user data if any changes
      if (Object.keys(userUpdateData).length > 0) {
        console.log('Updating user data:', userUpdateData);
        await this.prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
        console.log('User data updated successfully');
      }

      // Update vendor verification
      const vendorVerificationData = {
        first_name: vendorData.first_name,
        phone_number: vendorData.phone_number,
        business_website: vendorData.business_website,
        vendor_type: vendorData.vendor_type,
        TIN: vendorData.TIN,
        property_name: vendorData.property_name,
        address: vendorData.address,
        unit_number: vendorData.unit_number,
        postal_code: vendorData.postal_code,
        city: vendorData.city,
        country: vendorData.country,
        owner_type: vendorData.owner_type,
        owner_first_name: vendorData.owner_first_name,
        owner_last_name: vendorData.owner_last_name,
        owner_phone_numbers: vendorData.owner_phone_numbers,
        owner_alt_names: vendorData.owner_alt_names,
        manager_name: vendorData.manager_name,
        is_govt_representation: vendorData.is_govt_representation,
        payment_method: vendorData.payment_method,
        payment_email: vendorData.payment_email,
        payment_account_name: vendorData.payment_account_name,
        payment_TIN: vendorData.payment_TIN,
        billing_address: vendorData.billing_address,
      };

      // Filter out undefined values
      const filteredVendorData = Object.fromEntries(
        Object.entries(vendorVerificationData).filter(([_, value]) => value !== undefined)
      );

      console.log('Updating vendor verification data:', filteredVendorData);

      const vendorVerification = await this.prisma.vendorVerification.update({
        where: { user_id: userId },
        data: filteredVendorData,
      });

      console.log('Vendor verification updated successfully for user ID:', userId);

      // Fetch latest user to expose email in response
      const updatedUser = await this.prisma.user.findUnique({ where: { id: userId } });

      return {
        success: true,
        message: 'Vendor verification updated successfully.',
        data: vendorVerification,
        email: updatedUser?.email ?? null,
      };
    } catch (error) {
      console.error('Error updating vendor verification for user ID:', userId, error);
      throw new Error(`Vendor verification update failed: ${error.message}`);
    }
  }

  async getVendorVerification(userId: string) {
    try {
      // Check if user exists and is a vendor
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          VendorVerification: true,
          user_documents: {
            where: { type: 'vendor_verification' },
            orderBy: { created_at: 'desc' }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is a vendor
      if (user.type !== Role.VENDOR) {
        throw new Error('Access denied. Only vendors can view verification details.');
      }

      // If vendor verification doesn't exist, create a default one
      if (!user.VendorVerification) {
        console.log(`Creating default VendorVerification record for user: ${userId}`);
        
        const defaultVerification = await this.prisma.vendorVerification.create({
          data: {
            user_id: userId,
            first_name: user.first_name || user.name || 'Unknown',
            phone_number: user.phone_number || 'Not provided',
            business_website: '',
            vendor_type: 'individual',
            status: 'pending'
          }
        });

        // Fetch the user again with the new verification record
        const updatedUser = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            VendorVerification: true,
            user_documents: {
              where: { type: 'vendor_verification' },
              orderBy: { created_at: 'desc' }
            }
          }
        });

        user.VendorVerification = updatedUser.VendorVerification;
      }

      // Add image URLs using SojebStorage
      if (user.user_documents && user.user_documents.length > 0) {
        for (const document of user.user_documents) {
          if (document.image) {
            document['image_url'] = this.generateFileUrl(document.image, 'package');
          }
        }
      }

      return {
        success: true,
        data: user,
        email: user.email ?? null,
        message: user.VendorVerification ? 'Vendor verification found' : 'Default vendor verification created'
      };
    } catch (error) {
      throw new Error(`Failed to get vendor verification: ${error.message}`);
    }
  }
}
