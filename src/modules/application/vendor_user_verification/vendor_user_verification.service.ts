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
    file?: Express.Multer.File,
  ) {
    // Check if user exists
    const userData = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      throw new Error('User not found');
    }

    // Use SojebStorage for file handling
    let file_name = userDocumentDto.file_name;
    let file_path = userDocumentDto.file_path;
    let file_type = userDocumentDto.file_type;

    if (file) {
      // Upload file using SojebStorage
      const fileName = file.originalname;
      const fileBuffer = file.buffer;
      
      await SojebStorage.put(fileName, fileBuffer);
      
      file_name = fileName;
      file_path = fileName;
      file_type = file.mimetype;
    }

    if (!file_name || !file_path || !file_type) {
      throw new Error('Document file is required or provide file_name, file_path, and file_type.');
    }

    const document = await this.prisma.userDocument.create({
      data: {
        user: { connect: { id: userId } },
        type: userDocumentDto.type,
        file_type,
        file_path,
        file_name,
        status: userDocumentDto.status ?? 'pending',
      },
    });

    return {
      success: true,
      data: document,
      message: 'Document uploaded for vendor verification.',
    };
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
        // Upload file using SojebStorage
        const fileName = file.originalname;
        const fileBuffer = file.buffer;
        
        await SojebStorage.put(fileName, fileBuffer);
        
        document = await this.prisma.userDocument.create({
          data: {
            user_id: user.id,
            type: 'vendor_verification',
            file_type: file.mimetype,
            file_path: fileName,
            file_name: fileName,
            status: 'pending',
          },
        });
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

      return {
        success: true,
        message: 'Vendor verification updated successfully.',
        data: vendorVerification,
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

      // Check if vendor verification exists
      if (!user.VendorVerification) {
        throw new Error('Vendor verification not found. Please register as a vendor first.');
      }

      // Add image URLs using SojebStorage
      if (user.user_documents && user.user_documents.length > 0) {
        for (const document of user.user_documents) {
          if (document.file_path) {
            document['file_url'] = SojebStorage.url(
              appConfig().storageUrl.package + document.file_path,
            );
          }
        }
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new Error(`Failed to get vendor verification: ${error.message}`);
    }
  }
}
