import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVendorVerificationDto } from './dto/create-vendor-verification.dto';
import { UpdateVendorVerificationDto } from './dto/update-vendor-verification.dto';
import { GetVendorTransactionsDto } from './dto/get-vendor-transactions.dto';
import { GetVendorBookingsDto } from './dto/get-vendor-bookings.dto';
import { GetVendorRefundsDto } from './dto/get-vendor-refunds.dto';
import { subDays, differenceInDays } from 'date-fns';
import { NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/common/repository/user/user.repository';

@Injectable()
export class VendorVerificationService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateVerification(
    userId: string,
    data: CreateVendorVerificationDto,
  ) {
    const verification = await this.prisma.vendorVerification.upsert({
      where: {
        user_id: userId,
      },
      update: {
        ...data,
        step: 1,
        status: 'pending',
      },
      create: {
        user_id: userId,
        ...data,
        step: 1,
        status: 'pending',
      },
    });

    // Automatically convert user to vendor if status is approved
    // (step-based conversion happens in updateVerification when step reaches 5)
    // if (verification.status === 'approved') {
    //   await UserRepository.convertTo(userId, 'vendor');
    // }

    return {
      success: true,
      message: 'Vendor verification information saved.',
      data: verification,
    };
  }

  async updateVerification(
    userId: string,
    data: UpdateVendorVerificationDto,
  ) {
    // Check if verification record exists first
    const existingVerification = await this.prisma.vendorVerification.findUnique({
      where: {
        user_id: userId,
      },
    });

    if (!existingVerification) {
      return {
        success: false,
        message: 'Vendor verification record not found. Please create a verification record first using the add-profile-info endpoint.',
      };
    }

    const verification = await this.prisma.vendorVerification.update({
      where: {
        user_id: userId,
      },
      data: {
        ...data,
      },
    });

    // Automatically convert user to vendor when verification is completed (step 5) or approved
    if (data.step === 5 || verification.status === 'approved') {
      await UserRepository.convertTo(userId, 'vendor');
    }

    return {
      success: true,
      message: 'Vendor verification details updated.',
      data: verification,
    };
  }

  async getTransactionHistory(
    userId: string,
    query: GetVendorTransactionsDto,
  ) {
    const { page, type, period } = query;
    const itemsPerPage = 6;

    const currentPage = page || 1;

    const where: any = { user_id: userId };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (period && period !== 'all') {
      const days = period === 'last_7_days' ? 7 : 30;
      where.created_at = {
        gte: subDays(new Date(), days),
      };
    }

    const transactions = await this.prisma.paymentTransaction.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    });

    const totalTransactions = await this.prisma.paymentTransaction.count({
      where,
    });

    const summary = await this.getSummary(userId);

    return {
      success: true,
      data: {
        summary,
        transactions,
        pagination: {
          currentPage: currentPage,
          totalPages: Math.ceil(totalTransactions / itemsPerPage),
          totalItems: totalTransactions,
        },
      },
    };
  }

  private async getSummary(userId: string) {
    const userWallet = await this.prisma.vendorWallet.findUnique({
      where: { user_id: userId },
    });

    const totalBookings = await this.prisma.paymentTransaction.count({
      where: { user_id: userId, type: 'booking' },
    });

    return {
      total_transactions: totalBookings,
      total_earnings: userWallet?.total_earnings ?? 0,
      total_withdrawn: userWallet?.total_withdrawals ?? 0,
      total_refunds: userWallet?.total_refunds ?? 0,
    };
  }

  async getBookings(userId: string, query: GetVendorBookingsDto) {
    const { page, period, status } = query;
    const itemsPerPage = 6;
    const currentPage = page || 1;

    const where: any = { vendor_id: userId };

    if (period && period !== 'all') {
      const days = period === 'last_7_days' ? 7 : 30;
      where.created_at = {
        gte: subDays(new Date(), days),
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    const totalBookings = await this.prisma.booking.count({ where });

    return {
      success: true,
      data: {
        bookings: bookings.map((b) => ({
          date: b.created_at,
          booking_id: b.invoice_number,
          guest_name: `${b.user.first_name ?? ''} ${b.user.last_name ?? ''}`.trim(),
          amount: b.total_amount,
          status: b.status,
          payment_method: b.payment_provider,
        })),
        pagination: {
          currentPage,
          totalPages: Math.ceil(totalBookings / itemsPerPage),
          totalItems: totalBookings,
        },
      },
    };
  }

  async getRefunds(userId: string, query: GetVendorRefundsDto) {
    const { page, period } = query;
    const itemsPerPage = 6;
    const currentPage = page || 1;

    const where: any = {
      user_id: userId,
      type: 'refund',
    };

    if (period && period !== 'all') {
      const days = period === 'last_7_days' ? 7 : 30;
      where.created_at = {
        gte: subDays(new Date(), days),
      };
    }

    const refunds = await this.prisma.paymentTransaction.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
      include: {
        booking: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    const totalRefunds = await this.prisma.paymentTransaction.count({ where });

    return {
      success: true,
      data: {
        refunds: refunds.map((r) => ({
          date: r.created_at,
          transaction_id: r.reference_number,
          guest_name:
            `${r.booking?.user?.first_name ?? ''} ${r.booking?.user?.last_name ?? ''}`.trim(),
          amount: r.amount,
          status: r.status,
          payment_method: r.provider,
        })),
        pagination: {
          currentPage,
          totalPages: Math.ceil(totalRefunds / itemsPerPage),
          totalItems: totalRefunds,
        },
      },
    };
  }

  async getInvoiceDetails(vendorId: string, invoiceId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { invoice_number: invoiceId },
      include: {
        user: true, // Guest details
        vendor: true, // Vendor details
        booking_items: {
          include: {
            package: true, // To get property location
          },
        },
      },
    });

    if (!booking || booking.vendor_id !== vendorId) {
      throw new NotFoundException('Invoice not found.');
    }

    const bookingItem = booking.booking_items[0]; // Assuming one item per booking for this invoice
    const serviceFee = booking.total_amount.toNumber() - bookingItem.price.toNumber();

    return {
      success: true,
      data: {
        invoice_id: booking.invoice_number,
        date: booking.created_at,
        from: {
          name: booking.vendor.name || 'Travel Booking',
          address: `${booking.vendor.street_address}, ${booking.vendor.city}, ${booking.vendor.state} ${booking.vendor.zip_code}`,
        },
        to: {
          name: booking.user.name,
          address: `${booking.user.street_address}, ${booking.user.city}, ${booking.user.state} ${booking.user.zip_code}`,
        },
        info: {
          account_name: booking.user.name,
          // These fields are examples as they are not in the user model
          usa_number: 'N/A',
          paypal_email: booking.user.email,
        },
        property_location: bookingItem?.package?.address,
        guest_name: booking.user.name,
        check_in: bookingItem?.start_date,
        check_out: bookingItem?.end_date,
        days: `${(bookingItem.end_date.getTime() - bookingItem.start_date.getTime()) / (1000 * 3600 * 24)} nights`,
        hotel_price: bookingItem?.price,
        service_fee: serviceFee,
        total_amount: booking.total_amount,
        payment_method: booking.payment_provider,
      },
    };
  }

  async getRefundDetails(vendorId: string, transactionId: string) {
    const refundTx = await this.prisma.paymentTransaction.findFirst({
      where: {
        id: transactionId,
        booking: {
          vendor_id: vendorId,
        },
        type: 'refund',
      },
      include: {
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!refundTx) {
      throw new NotFoundException('Refund details not found.');
    }

    let note = '';
    const daysAfterBooking = differenceInDays(
      refundTx.created_at,
      refundTx.booking.created_at,
    );
    if (daysAfterBooking > 2) {
      note = `You requested a refund ${daysAfterBooking} days after booking, which is beyond the 48-hour window allowed by our policy.`;
    }

    return {
      success: true,
      data: {
        transaction_id: refundTx.reference_number || refundTx.id,
        request_date: refundTx.created_at,
        guest_name: refundTx.booking.user.name,
        refund_amount: refundTx.amount,
        refund_status: refundTx.status,
        note: note,
      },
    };
  }
}
