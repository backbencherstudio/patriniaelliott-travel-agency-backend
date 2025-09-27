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

    return {
      success: true,
      data: docs,
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
  }>) {
    const verification = await this.prisma.vendorVerification.findUnique({ where: { user_id: userId } });
    if (!verification) throw new NotFoundException('Vendor verification record not found');

    const updated = await this.prisma.vendorVerification.update({
      where: { user_id: userId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return { success: true, message: 'Vendor verification updated', data: updated };
  }
}