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
          user: { select: { id: true, name: true, email: true, type: true } },
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
    const verification = await this.prisma.vendorVerification.findUnique({ where: { user_id: userId } });
    if (!verification) throw new NotFoundException('Vendor verification record not found');

    await this.prisma.vendorVerification.update({
      where: { user_id: userId },
      data: { status: 'approved', verified_at: new Date(), updated_at: new Date() },
    });

    // Optionally set user.type to 'vendor' if not already
    await this.prisma.user.update({
      where: { id: userId },
      data: { type: 'vendor', approved_at: new Date() },
    });

    return { success: true, message: 'Vendor verification approved' };
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

    return { 
      success: true, 
      message: 'Vendor verification rejected' };
  }
}