import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class VendorUserVerificationAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listDocuments({ status, page = 1, limit = 20 }: { status?: string; page?: number; limit?: number }) {
    const where: any = { deleted_at: null };
    if (status && status !== 'all') where.status = status;

    const [docs, total] = await Promise.all([
      this.prisma.userDocument.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { 
            select: { 
              id: true, 
              name: true, 
              email: true, 
              type: true,
              packages: {
                orderBy: { created_at: 'desc' },
                select: {
                  id: true,
                  name: true,
                  price: true,
                  type: true,
                  status: true,
                  approved_at: true,
                  created_at: true,
                  package_files: {
                    select: { id: true, file: true, type: true, sort_order: true },
                    orderBy: { sort_order: 'asc' },
                  },
                },
              },
            } 
          },
        },
      }),
      this.prisma.userDocument.count({ where }),
    ]);

    // Generate full URLs for document images
    const docsWithUrls = docs.map(doc => {
      const baseUrl = process.env.APP_URL || 'http://localhost:4001';
      
      const docWithUrls = {
        ...doc,
        // Generate URLs for different image fields
        image_url: doc.image ? `${baseUrl}/public/storage/package/${encodeURIComponent(doc.image)}` : null,
        front_image_url: doc.front_image ? `${baseUrl}/public/storage/package/${encodeURIComponent(doc.front_image)}` : null,
        back_image_url: doc.back_image ? `${baseUrl}/public/storage/package/${encodeURIComponent(doc.back_image)}` : null,
      };

      // Also generate URLs for user packages if they exist
      if (doc.user?.packages) {
        docWithUrls.user.packages = doc.user.packages.map(pkg => ({
          ...pkg,
          package_files: pkg.package_files?.map(file => ({
            ...file,
            file_url: file.file ? `${baseUrl}/public/storage/package/${encodeURIComponent(file.file)}` : null,
          })) || []
        }));
      }

      return docWithUrls;
    });

    return {
      success: true,
      data: docsWithUrls,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveDocument(id: string) {
    const doc = await this.prisma.userDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    // Update the document status
    const document = await this.prisma.userDocument.update({
      where: { id },
      data: { status: 'approved', updated_at: new Date() },
    });
    console.log(document);

    // Check if all documents for this user are now approved
    const userDocuments = await this.prisma.userDocument.findMany({
      where: { 
        user_id: doc.user_id,
        deleted_at: null 
      }
    });

    const allApproved = userDocuments.every(d => d.status === 'approved');
    let vendorApproved = false;

    // If all documents are approved, automatically approve vendor verification
    
      const verification = await this.prisma.vendorVerification.findUnique({ 
        where: { user_id: doc.user_id } 
      });

      console.log("testing...........");
      
      if (verification && verification.status !== 'approved') {
        await this.prisma.vendorVerification.update({
          where: { user_id: doc.user_id },
          data: { 
            status: 'approved', 
            verified_at: new Date(), 
            updated_at: new Date() 
          },
        });

        // Set user type to vendor
        await this.prisma.user.update({
          where: { id: doc.user_id },
          data: { type: 'vendor', approved_at: new Date() },
        });

        vendorApproved = true;
      }

    return { 
      success: true, 
      message: vendorApproved 
        ? 'Document approved and vendor verification completed automatically' 
        : 'Document approved',
      vendorApproved
    };
  }

  async rejectDocument(id: string, reason?: string) {
    const doc = await this.prisma.userDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.userDocument.update({
      where: { id },
      data: { status: 'rejected', updated_at: new Date() },
    });

    return { success: true, message: 'Document rejected', reason };
  }

  // Mark the vendor verification as approved; call when required docs are approved.
  async approveVendor(userId: string) {
    // First check if user exists
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, name: true, email: true, type: true }
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check all user documents status before approving vendor
    const userDocuments = await this.prisma.userDocument.findMany({
      where: { 
        user_id: userId,
        deleted_at: null 
      },
      select: {
        id: true,
        status: true,
        type: true,
        created_at: true
      }
    });

    // Check if user has any documents
    if (userDocuments.length === 0) {
      return {
        success: false,
        message: 'Cannot approve vendor. User has no documents uploaded.',
        data: {
          user_id: userId,
          user_name: user.name,
          user_email: user.email,
          total_documents: 0,
          documents_status: []
        }
      };
    }

    // Check document statuses
    const pendingDocuments = userDocuments.filter(doc => doc.status !== 'approved');
    const rejectedDocuments = userDocuments.filter(doc => doc.status === 'rejected');
    
    if (pendingDocuments.length > 0) {
      return {
        success: false,
        message: 'Cannot approve vendor. Some documents are still pending approval.',
        data: {
          user_id: userId,
          user_name: user.name,
          user_email: user.email,
          total_documents: userDocuments.length,
          pending_documents: pendingDocuments.length,
          rejected_documents: rejectedDocuments.length,
          pending_document_types: pendingDocuments.map(doc => doc.type),
          documents_status: userDocuments
        }
      };
    }

    if (rejectedDocuments.length > 0) {
      return {
        success: false,
        message: 'Cannot approve vendor. Some documents have been rejected.',
        data: {
          user_id: userId,
          user_name: user.name,
          user_email: user.email,
          total_documents: userDocuments.length,
          pending_documents: pendingDocuments.length,
          rejected_documents: rejectedDocuments.length,
          rejected_document_types: rejectedDocuments.map(doc => doc.type),
          documents_status: userDocuments
        }
      };
    }

    // All documents are approved, proceed with vendor approval
    // Create or update vendor verification record
    let verification = await this.prisma.vendorVerification.findUnique({ where: { user_id: userId } });
    
    if (!verification) {
      // Create vendor verification record if it doesn't exist
      verification = await this.prisma.vendorVerification.create({
        data: {
          user_id: userId,
          first_name: user.name || 'Auto-generated',
          phone_number: '0000000000', // Default placeholder
          status: 'approved',
          verified_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    } else {
      // Update existing verification record
      await this.prisma.vendorVerification.update({
        where: { user_id: userId },
        data: { status: 'approved', verified_at: new Date(), updated_at: new Date() },
      });
    }

    // Set user.type to 'vendor'
    await this.prisma.user.update({
      where: { id: userId },
      data: { type: 'vendor', approved_at: new Date() },
    });

    // Get user data with packages for response
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        approved_at: true,
        packages: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            computed_price: true,
            type: true,
            status: true,
            approved_at: true,
            created_at: true,
            updated_at: true,
            discount: true,
            service_fee: true,
            package_files: {
              select: { id: true, file: true, type: true, sort_order: true },
              orderBy: { sort_order: 'asc' },
            },
          },
        },
      },
    });

    return { 
      success: true, 
      message: 'Vendor verification approved successfully. All documents verified.',
      data: userData,
      documents_verified: userDocuments.length
    };
  }

  async rejectVendor(userId: string, reason?: string) {
    const verification = await this.prisma.vendorVerification.findUnique({ 
      where: { user_id: userId } 
    });
    if (!verification) throw new NotFoundException('Vendor verification record not found');
    await this.prisma.vendorVerification.update({
      where: { user_id: userId },
      data: { 
        status: 'rejected', 
        rejection_reason: reason ?? 'Rejected by admin', 
        updated_at: new Date() 
      },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { type: 'user' },
    });

    // Get user data with packages for response
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        approved_at: true,
        packages: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            computed_price: true,
            type: true,
            status: true,
            approved_at: true,
            created_at: true,
            updated_at: true,
            discount: true,
            service_fee: true,
            package_files: {
              select: { id: true, file: true, type: true, sort_order: true },
              orderBy: { sort_order: 'asc' },
            },
          },
        },
      },
    });

    return { 
      success: true, 
      message: 'Vendor verification rejected',
      data: userData
    };
  }

  // Update vendor verification by user ID (admin)
  async updateVendorByUserId(userId: string, data: Partial<{
    first_name: string;
    phone_number: string;
    business_website: string;
    vendor_type: string;
    TIN: string;
    property_name: string;
    address: string;
    unit_number: string;
    postal_code: string;
    city: string;
    country: string;
    owner_type: string;
    owner_first_name: string;
    owner_last_name: string;
    owner_phone_numbers: string;
    owner_alt_names: string;
    manager_name: string;
    is_govt_representation: boolean;
    payment_method: string;
    payment_email: string;
    payment_account_name: string;
    payment_TIN: string;
    billing_address: string;
    status: string;
  }>, loggedInUser?: any) {
    try {
      console.log('=== UPDATE VENDOR VERIFICATION DEBUG ===');
      console.log('User ID:', userId);
      console.log('Logged in user:', loggedInUser);
      console.log('Received data:', JSON.stringify(data, null, 2));
      
      // Check authorization: Only admins can update any user, vendors can only update their own data
      if (loggedInUser) {
        const isAdmin = loggedInUser.role === 'admin' || loggedInUser.type === 'admin';
        const isVendor = loggedInUser.role === 'vendor' || loggedInUser.type === 'vendor';
        const isOwnData = loggedInUser.userId === userId || loggedInUser.id === userId;
        
        console.log('Authorization check:', { 
          isAdmin, 
          isVendor, 
          isOwnData,
          isSameUser: (loggedInUser.userId === userId) || (loggedInUser.id === userId),
          loggedInUserRole: loggedInUser.role,
          loggedInUserType: loggedInUser.type,
          loggedInUserId: loggedInUser.userId || loggedInUser.id,
          targetUserId: userId
        });
        
        // Allow if: (Admin) OR (Vendor AND Own Data) OR (Same User ID - for testing)
        const isSameUser = (loggedInUser.userId === userId) || (loggedInUser.id === userId);
        
        if (!isAdmin && !isSameUser && (!isVendor || !isOwnData)) {
          return {
            success: false,
            message: 'Access denied. You can only update your own vendor verification data.',
            data: {
              user_id: userId,
              logged_in_user_id: loggedInUser.userId || loggedInUser.id,
              error_code: 'ACCESS_DENIED',
              debug_info: {
                isAdmin,
                isVendor,
                isOwnData,
                loggedInUserRole: loggedInUser.role,
                loggedInUserType: loggedInUser.type
              }
            }
          };
        }
        
        console.log('Authorization passed - proceeding with update');
      } else {
        console.log('No logged in user found - proceeding without authorization check');
      }
      
      // First, check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          first_name: true,
          email: true,
          phone_number: true,
          type: true
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: {
            user_id: userId,
            error_code: 'USER_NOT_FOUND'
          }
        };
      }

      // Check if vendor verification record exists
      const existingVerification = await this.prisma.vendorVerification.findUnique({ 
        where: { user_id: userId }
      });
      
      console.log('Existing verification record:', existingVerification);

      let updated;

      if (!existingVerification) {
        // Create vendor verification record if it doesn't exist
        updated = await this.prisma.vendorVerification.create({
          data: {
            user_id: userId,
            first_name: data.first_name || user.first_name || user.name || 'Unknown',
            phone_number: data.phone_number || user.phone_number || 'Not provided',
            business_website: data.business_website || '',
            vendor_type: data.vendor_type || 'individual',
            TIN: data.TIN || '',
            property_name: data.property_name || '',
            address: data.address || '',
            unit_number: data.unit_number || '',
            postal_code: data.postal_code || '',
            city: data.city || '',
            country: data.country || '',
            owner_type: data.owner_type || 'individual',
            owner_first_name: data.owner_first_name || user.first_name || user.name || 'Unknown',
            owner_last_name: data.owner_last_name || '',
            owner_phone_numbers: data.owner_phone_numbers || user.phone_number || '',
            owner_alt_names: data.owner_alt_names || '',
            manager_name: data.manager_name || '',
            is_govt_representation: data.is_govt_representation || false,
            payment_method: data.payment_method || '',
            payment_email: data.payment_email || user.email || '',
            payment_account_name: data.payment_account_name || '',
            payment_TIN: data.payment_TIN || '',
            billing_address: data.billing_address || '',
            status: data.status || 'pending',
            created_at: new Date(),
            updated_at: new Date(),
          },
          select: {
            id: true,
            user_id: true,
            first_name: true,
            phone_number: true,
            business_website: true,
            vendor_type: true,
            TIN: true,
            property_name: true,
            address: true,
            unit_number: true,
            postal_code: true,
            city: true,
            country: true,
            owner_type: true,
            owner_first_name: true,
            owner_last_name: true,
            owner_phone_numbers: true,
            owner_alt_names: true,
            manager_name: true,
            is_govt_representation: true,
            payment_method: true,
            payment_email: true,
            payment_account_name: true,
            payment_TIN: true,
            billing_address: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        });

        // Prepare user update data (only fields that exist in User table)
        const userUpdateData: any = { type: 'vendor' };
        const dataWithUserFields = data as any; // Type assertion to access user fields
        
        if (data.first_name !== undefined) userUpdateData.first_name = data.first_name;
        if (data.phone_number !== undefined) userUpdateData.phone_number = data.phone_number;
        if (dataWithUserFields.email !== undefined) userUpdateData.email = dataWithUserFields.email;
        if (dataWithUserFields.name !== undefined) userUpdateData.name = dataWithUserFields.name;
        if (dataWithUserFields.last_name !== undefined) userUpdateData.last_name = dataWithUserFields.last_name;
        if (data.country !== undefined) userUpdateData.country = data.country;
        if (data.city !== undefined) userUpdateData.city = data.city;
        if (data.address !== undefined) userUpdateData.address = data.address;
        if (dataWithUserFields.zip_code !== undefined) userUpdateData.zip_code = dataWithUserFields.zip_code;
        if (dataWithUserFields.gender !== undefined) userUpdateData.gender = dataWithUserFields.gender;
        if (dataWithUserFields.date_of_birth !== undefined) userUpdateData.date_of_birth = dataWithUserFields.date_of_birth;
        if (dataWithUserFields.nationality !== undefined) userUpdateData.nationality = dataWithUserFields.nationality;
        if (dataWithUserFields.passport_number !== undefined) userUpdateData.passport_number = dataWithUserFields.passport_number;
        if (dataWithUserFields.passport_first_name !== undefined) userUpdateData.passport_first_name = dataWithUserFields.passport_first_name;
        if (dataWithUserFields.passport_last_name !== undefined) userUpdateData.passport_last_name = dataWithUserFields.passport_last_name;
        if (dataWithUserFields.passport_issuing_country !== undefined) userUpdateData.passport_issuing_country = dataWithUserFields.passport_issuing_country;
        if (dataWithUserFields.passport_expiry_date !== undefined) userUpdateData.passport_expiry_date = dataWithUserFields.passport_expiry_date;
        if (dataWithUserFields.street_address !== undefined) userUpdateData.street_address = dataWithUserFields.street_address;
        if (dataWithUserFields.apt_suite_unit !== undefined) userUpdateData.apt_suite_unit = dataWithUserFields.apt_suite_unit;
        if (dataWithUserFields.display_name !== undefined) userUpdateData.display_name = dataWithUserFields.display_name;
        if (dataWithUserFields.state !== undefined) userUpdateData.state = dataWithUserFields.state;

        console.log('Creating vendor verification - User update data:', userUpdateData);

        // Update user data
        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: {
            ...userUpdateData,
            updated_at: new Date(),
          },
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
            country: true,
            city: true,
            address: true,
            zip_code: true,
            gender: true,
            date_of_birth: true,
            nationality: true,
            passport_number: true,
            passport_first_name: true,
            passport_last_name: true,
            passport_issuing_country: true,
            passport_expiry_date: true,
            street_address: true,
            apt_suite_unit: true,
            display_name: true,
            state: true,
            type: true,
            updated_at: true,
          },
        });
        console.log('Updated user data during creation:', updatedUser);

        return { 
          success: true, 
          message: 'Vendor verification record created and user data updated successfully', 
          data: {
            ...updated,
            action: 'created',
            user_info: updatedUser,
            user_updated: true,
            updated_fields: Object.keys(userUpdateData)
          }
        };
      } else {
        // Filter out undefined values and prepare update data
        const updateData = Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined && value !== null)
        );
        
        console.log('Updating vendor verification with data:', updateData);
        console.log('User ID:', userId);
        
        // Prepare user update data (only fields that exist in User table)
        const userUpdateData: any = {};
        const dataWithUserFields = data as any; // Type assertion to access user fields
        
        if (data.first_name !== undefined) userUpdateData.first_name = data.first_name;
        if (data.phone_number !== undefined) userUpdateData.phone_number = data.phone_number;
        if (dataWithUserFields.email !== undefined) userUpdateData.email = dataWithUserFields.email;
        if (dataWithUserFields.name !== undefined) userUpdateData.name = dataWithUserFields.name;
        if (dataWithUserFields.last_name !== undefined) userUpdateData.last_name = dataWithUserFields.last_name;
        if (data.country !== undefined) userUpdateData.country = data.country;
        if (data.city !== undefined) userUpdateData.city = data.city;
        if (data.address !== undefined) userUpdateData.address = data.address;
        if (dataWithUserFields.zip_code !== undefined) userUpdateData.zip_code = dataWithUserFields.zip_code;
        if (dataWithUserFields.gender !== undefined) userUpdateData.gender = dataWithUserFields.gender;
        if (dataWithUserFields.date_of_birth !== undefined) userUpdateData.date_of_birth = dataWithUserFields.date_of_birth;
        if (dataWithUserFields.nationality !== undefined) userUpdateData.nationality = dataWithUserFields.nationality;
        if (dataWithUserFields.passport_number !== undefined) userUpdateData.passport_number = dataWithUserFields.passport_number;
        if (dataWithUserFields.passport_first_name !== undefined) userUpdateData.passport_first_name = dataWithUserFields.passport_first_name;
        if (dataWithUserFields.passport_last_name !== undefined) userUpdateData.passport_last_name = dataWithUserFields.passport_last_name;
        if (dataWithUserFields.passport_issuing_country !== undefined) userUpdateData.passport_issuing_country = dataWithUserFields.passport_issuing_country;
        if (dataWithUserFields.passport_expiry_date !== undefined) userUpdateData.passport_expiry_date = dataWithUserFields.passport_expiry_date;
        if (dataWithUserFields.street_address !== undefined) userUpdateData.street_address = dataWithUserFields.street_address;
        if (dataWithUserFields.apt_suite_unit !== undefined) userUpdateData.apt_suite_unit = dataWithUserFields.apt_suite_unit;
        if (dataWithUserFields.display_name !== undefined) userUpdateData.display_name = dataWithUserFields.display_name;
        if (dataWithUserFields.state !== undefined) userUpdateData.state = dataWithUserFields.state;

        console.log('User update data:', userUpdateData);

        // Update user data if there are fields to update
        let updatedUser = null;
        if (Object.keys(userUpdateData).length > 0) {
          updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
              ...userUpdateData,
              updated_at: new Date(),
            },
            select: {
              id: true,
              name: true,
              first_name: true,
              last_name: true,
              email: true,
              phone_number: true,
              country: true,
              city: true,
              address: true,
              zip_code: true,
              gender: true,
              date_of_birth: true,
              nationality: true,
              passport_number: true,
              passport_first_name: true,
              passport_last_name: true,
              passport_issuing_country: true,
              passport_expiry_date: true,
              street_address: true,
              apt_suite_unit: true,
              display_name: true,
              state: true,
              type: true,
              updated_at: true,
            },
          });
          console.log('Updated user data:', updatedUser);
        }

        // Update existing vendor verification record
        updated = await this.prisma.vendorVerification.update({
      where: { user_id: userId },
      data: {
            ...updateData,
        updated_at: new Date(),
      },
          select: {
            id: true,
            user_id: true,
            first_name: true,
            phone_number: true,
            business_website: true,
            vendor_type: true,
            TIN: true,
            property_name: true,
            address: true,
            unit_number: true,
            postal_code: true,
            city: true,
            country: true,
            owner_type: true,
            owner_first_name: true,
            owner_last_name: true,
            owner_phone_numbers: true,
            owner_alt_names: true,
            manager_name: true,
            is_govt_representation: true,
            payment_method: true,
            payment_email: true,
            payment_account_name: true,
            payment_TIN: true,
            billing_address: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        });
        
        console.log('Updated vendor verification:', updated);

        return { 
          success: true, 
          message: 'Vendor verification and user data updated successfully', 
          data: {
            ...updated,
            action: 'updated',
            user_info: updatedUser || {
              id: user.id,
              name: user.name,
              first_name: user.first_name,
              email: user.email,
              type: user.type
            },
            user_updated: !!updatedUser,
            updated_fields: Object.keys(userUpdateData)
          }
        };
      }
    } catch (error) {
      console.error('Error updating vendor verification:', error);
      return {
        success: false,
        message: `Failed to update vendor verification: ${error.message}`,
        data: {
          user_id: userId,
          error_code: 'UPDATE_FAILED'
        }
      };
    }
  }

  // Get vendor verification by user ID (admin)
  async getVendorByUserId(userId: string, loggedInUser?: any) {
    try {
      console.log('=== GET VENDOR VERIFICATION DEBUG ===');
      console.log('User ID:', userId);
      console.log('Logged in user:', loggedInUser);

      // Check authorization: Only admins can view any user, vendors can only view their own data
      if (loggedInUser) {
        const isAdmin = loggedInUser.role === 'admin' || loggedInUser.type === 'admin';
        const isVendor = loggedInUser.role === 'vendor' || loggedInUser.type === 'vendor';
        const isSameUser = (loggedInUser.userId === userId) || (loggedInUser.id === userId);
        
        console.log('Authorization check:', { 
          isAdmin, 
          isVendor, 
          isSameUser,
          loggedInUserRole: loggedInUser.role,
          loggedInUserType: loggedInUser.type,
          loggedInUserId: loggedInUser.userId || loggedInUser.id,
          targetUserId: userId
        });
        
        // Allow if: (Admin) OR (Same User) OR (Vendor AND Own Data)
        if (!isAdmin && !isSameUser && (!isVendor || !isSameUser)) {
          return {
            success: false,
            message: 'Access denied. You can only view your own vendor verification data.',
            data: {
              user_id: userId,
              logged_in_user_id: loggedInUser.userId || loggedInUser.id,
              error_code: 'ACCESS_DENIED',
              debug_info: {
                isAdmin,
                isVendor,
                isSameUser,
                loggedInUserRole: loggedInUser.role,
                loggedInUserType: loggedInUser.type
              }
            }
          };
        }
        
        console.log('Authorization passed - proceeding with fetch');
      } else {
        console.log('No logged in user found - proceeding without authorization check');
      }

      // First, check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          country: true,
          city: true,
          address: true,
          zip_code: true,
          gender: true,
          date_of_birth: true,
          nationality: true,
          passport_number: true,
          passport_first_name: true,
          passport_last_name: true,
          passport_issuing_country: true,
          passport_expiry_date: true,
          street_address: true,
          apt_suite_unit: true,
          display_name: true,
          state: true,
          type: true,
          created_at: true,
          updated_at: true,
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: {
            user_id: userId,
            error_code: 'USER_NOT_FOUND'
          }
        };
      }

      // Check if vendor verification record exists
      const verification = await this.prisma.vendorVerification.findUnique({ 
        where: { user_id: userId },
        select: {
          id: true,
          user_id: true,
          first_name: true,
          phone_number: true,
          business_website: true,
          vendor_type: true,
          TIN: true,
          property_name: true,
          address: true,
          unit_number: true,
          postal_code: true,
          city: true,
          country: true,
          owner_type: true,
          owner_first_name: true,
          owner_last_name: true,
          owner_phone_numbers: true,
          owner_alt_names: true,
          manager_name: true,
          is_govt_representation: true,
          payment_method: true,
          payment_email: true,
          payment_account_name: true,
          payment_TIN: true,
          billing_address: true,
          status: true,
          created_at: true,
          updated_at: true,
          verified_at: true,
        }
      });
      
      console.log('User data:', user);
      console.log('Vendor verification data:', verification);

      return { 
        success: true, 
        message: 'Vendor verification and user data retrieved successfully', 
        data: {
          vendor_verification: verification,
          user_info: user,
          has_verification: !!verification
        }
      };
    } catch (error) {
      console.error('Error getting vendor verification:', error);
      return {
        success: false,
        message: `Failed to get vendor verification: ${error.message}`,
        data: {
          user_id: userId,
          error_code: 'GET_FAILED'
        }
      };
    }
  }
}