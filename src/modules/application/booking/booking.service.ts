import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBookingDto, BookingItemDto, BookingTravellerDto, BookingExtraServiceDto } from './dto/create-booking.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { CreatePaymentDto, PaymentIntentResponseDto } from './dto/create-payment.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) { }


  async createBooking(
    user_id: string,
    createBookingDto: CreateBookingDto,
  ) {
    try {
      // Add timeout and retry configuration for transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Validate user exists
        const user = await prisma.user.findUnique({
          where: { id: user_id },
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        if (user.status !== 1) {
          throw new BadRequestException('User account is not active');
        }

        // Process booking items and validate packages
        const processedItems = await this.processBookingItems(prisma, createBookingDto.booking_items);

        if (!processedItems || processedItems.length === 0) {
          throw new BadRequestException('No valid booking items found');
        }

        // Get vendor_id from the first package (assuming all packages are from same vendor)
        const vendor_id = processedItems[0]?.package?.user_id;

        if (!vendor_id) {
          throw new BadRequestException('Invalid package or vendor not found');
        }

        // Validate vendor exists
        const vendor = await prisma.user.findUnique({
          where: { id: vendor_id },
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        });

        if (!vendor) {
          throw new NotFoundException('Vendor not found');
        }

        if (vendor.status !== 1) {
          throw new BadRequestException('Vendor account is not active');
        }

        // Calculate total amount
        const total_amount = this.calculateTotalAmount(processedItems, createBookingDto.booking_extra_services);

        // Generate invoice number
        const invoice_number = await this.generateInvoiceNumber(prisma);

        // Create the main booking
        const booking = await prisma.booking.create({
          data: {
            invoice_number,
            status: createBookingDto.status || 'pending',
            type: createBookingDto.type || 'tour',
            user_id,
            vendor_id,
            booking_date_time: createBookingDto.booking_date_time || new Date(),
            total_amount,
            payment_status: createBookingDto.payment_status || 'pending',
            first_name: createBookingDto.first_name,
            last_name: createBookingDto.last_name,
            email: createBookingDto.email,
            phone_number: createBookingDto.phone_number,
            address1: createBookingDto.address1,
            address2: createBookingDto.address2,
            city: createBookingDto.city,
            state: createBookingDto.state,
            zip_code: createBookingDto.zip_code,
            country: createBookingDto.country,
            comments: createBookingDto.comments,
          },
        });

        // Create booking items
        const bookingItems = await this.createBookingItems(prisma, booking.id, processedItems);

        // Create booking travellers
        const bookingTravellers = await this.createBookingTravellers(prisma, booking.id, createBookingDto.booking_travellers);

        // Create booking extra services
        const bookingExtraServices = await this.createBookingExtraServices(prisma, booking.id, createBookingDto.booking_extra_services);

        return {
          success: true,
          data: {
            booking: {
              id: booking.id,
              invoice_number: booking.invoice_number,
              status: booking.status,
              type: booking.type,
              total_amount: booking.total_amount,
              booking_date_time: booking.booking_date_time,
            },
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
            vendor: {
              id: vendor.id,
              name: vendor.name,
              email: vendor.email,
            },
            items: bookingItems,
            travellers: bookingTravellers,
            extra_services: bookingExtraServices,
          },
          message: 'Booking created successfully',
        };
      }, {
        timeout: 30000, // 30 seconds timeout
        maxWait: 10000, // 10 seconds max wait
        isolationLevel: 'ReadCommitted', // Use ReadCommitted for better performance
      });

      return result;
    } catch (error) {
      console.error('Booking creation error:', error);

      if (error.message.includes('timeout') || error.message.includes('transaction')) {
        throw new BadRequestException('Database operation timed out. Please try again.');
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Failed to create booking. Please try again.');
    }
  }

  private async processBookingItems(prisma: any, items: BookingItemDto[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Booking items are required');
    }

    // Collect all package IDs and room type IDs for batch querying
    const packageIds = items.map(item => item.package_id);
    const roomTypeIds = items
      .filter(item => item.packageRoomTypeId)
      .map(item => item.packageRoomTypeId);

    // Batch query packages
    const packages = await prisma.package.findMany({
      where: {
        id: { in: packageIds },
        status: 1, // Approved packages only
        deleted_at: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        package_room_types: roomTypeIds.length > 0 ? {
          where: {
            id: { in: roomTypeIds },
            is_available: true,
            deleted_at: null,
          },
        } : false,
      },
    });

    // Create a map for quick lookup
    const packageMap = new Map(packages.map(pkg => [pkg.id, pkg]));

    const processedItems = [];

    for (const item of items) {
      const packageData = packageMap.get(item.package_id);

      if (!packageData) {
        throw new BadRequestException(`Package with ID ${item.package_id} not found or not available`);
      }

      // Validate room type if specified
      if (item.packageRoomTypeId) {
        const roomType = (packageData as any).package_room_types?.find((rt: any) => rt.id === item.packageRoomTypeId);
        if (!roomType) {
          throw new BadRequestException(`Room type with ID ${item.packageRoomTypeId} not available for package ${item.package_id}`);
        }
      }

      // Validate dates
      this.validateBookingDates(item.start_date, item.end_date);

      // Calculate price if not provided
      const price = item.price || parseFloat((packageData as any).price.toString());

      processedItems.push({
        ...item,
        package: packageData,
        price,
      });
    }

    return processedItems;
  }


  private validateBookingDates(start_date: Date, end_date: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start_date < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (end_date <= start_date) {
      throw new BadRequestException('End date must be after start date');
    }
  }


  private calculateTotalAmount(items: any[], extraServices?: BookingExtraServiceDto[]): number {
    let total = 0;

    // Calculate items total
    for (const item of items) {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
    }

    // Calculate extra services total
    if (extraServices) {
      for (const service of extraServices) {
        total += service.price || 0;
      }
    }

    return total;
  }

  private async generateInvoiceNumber(prisma: any): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get count of bookings for today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const count = await prisma.booking.count({
      where: {
        created_at: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}${day}-${sequence}`;
  }


  private async createBookingItems(prisma: any, booking_id: string, items: any[]) {
    const bookingItems = [];

    for (const item of items) {
      const bookingItem = await prisma.bookingItem.create({
        data: {
          booking_id,
          package_id: item.package_id,
          start_date: item.start_date,
          end_date: item.end_date,
          quantity: item.quantity,
          price: item.price,
          packageRoomTypeId: item.packageRoomTypeId,
        },
        include: {
          package: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          PackageRoomType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      bookingItems.push(bookingItem);
    }

    return bookingItems;
  }


  private async createBookingTravellers(prisma: any, booking_id: string, travellers: BookingTravellerDto[]) {
    const bookingTravellers = [];

    for (const traveller of travellers) {
      const bookingTraveller = await prisma.bookingTraveller.create({
        data: {
          booking_id,
          type: traveller.type,
          gender: traveller.gender,
          full_name: traveller.full_name,
          first_name: traveller.first_name,
          last_name: traveller.last_name,
          email: traveller.email,
          phone_number: traveller.phone_number,
          address1: traveller.address1,
          address2: traveller.address2,
          city: traveller.city,
          state: traveller.state,
          zip_code: traveller.zip_code,
          country: traveller.country,
        },
      });

      bookingTravellers.push(bookingTraveller);
    }

    return bookingTravellers;
  }


  private async createBookingExtraServices(prisma: any, booking_id: string, extraServices?: BookingExtraServiceDto[]) {
    if (!extraServices || extraServices.length === 0) {
      return [];
    }

    const bookingExtraServices = [];

    for (const service of extraServices) {
      // Validate extra service exists
      const extraService = await prisma.extraService.findUnique({
        where: { id: service.extra_service_id },
      });

      if (!extraService) {
        throw new BadRequestException(`Extra service with ID ${service.extra_service_id} not found`);
      }

      const bookingExtraService = await prisma.bookingExtraService.create({
        data: {
          booking_id,
          extra_service_id: service.extra_service_id,
          price: service.price,
        },
        include: {
          extra_service: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      bookingExtraServices.push(bookingExtraService);
    }

    return bookingExtraServices;
  }


  async createPaymentIntent(
    user_id: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentIntentResponseDto> {
    try {
      // Validate booking exists and belongs to user
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: createPaymentDto.booking_id,
          user_id: user_id,
        },
        include: {
          user: true,
          vendor: true,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found or unauthorized');
      }

      if (booking.payment_status === 'paid') {
        throw new BadRequestException('Booking is already paid');
      }

      const totalAmount = Number(booking.total_amount) * 100
      const platformFee = Math.round(totalAmount * 0.1);

      // Create payment intent
      const paymentIntent = await StripePayment.createPaymentIntent({
        amount: totalAmount,
        currency: createPaymentDto.currency,
        customer_id: booking.user.stripe_customer_id,
        metadata: {
          booking_id: booking.id,
          user_id: booking.user_id,
          vendor_id: booking.vendor_id,
          invoice_number: booking.invoice_number,
        },
      });

      //   const paymentIntent2 = await stripe.paymentIntents.create({
      //   amount: totalAmount,
      //   currency: "usd",
      //   application_fee_amount: platformFee,
      //   transfer_data: {
      //     destination: expert.stripeAccountId!,
      //   },
      //   automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      //   capture_method: "manual",
      //   metadata: {
      //     bookingId: booking.id,
      //     studentId: userId!,
      //     expertId: data.expertId,
      //   },
      // });

      // Create payment transaction record
      await this.prisma.paymentTransaction.create({
        data: {
          user_id: booking.user_id,
          booking_id: booking.id,
          order_id: booking.invoice_number,
          type: 'booking',
          provider: 'stripe',
          reference_number: paymentIntent.id,
          status: 'pending',
          raw_status: paymentIntent.status,
          amount: createPaymentDto.amount / 100, // Convert from cents
          currency: createPaymentDto.currency,
          paid_amount: 0,
          paid_currency: createPaymentDto.currency,
        },
      });

      return {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error) {
      throw new BadRequestException(`Payment intent creation failed: ${error.message}`);
    }
  }


  async confirmPayment(
    user_id: string,
    payment_intent_id: string,
  ) {
    try {
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: {
          reference_number: payment_intent_id,
          user_id: user_id,
        },
        include: {
          booking: true,
        },
      });

      if (!transaction) {
        throw new NotFoundException('Payment transaction not found');
      }
      const paymentIntent = await StripePayment.retrievePaymentIntent(payment_intent_id);

      if (paymentIntent.status === 'requires_payment_method') {
        // Update transaction status
        await this.prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'succeeded',
            paid_amount: paymentIntent.amount / 100,
            paid_currency: paymentIntent.currency,
            raw_status: paymentIntent.status,
          },
        });
        await this.prisma.booking.update({
          where: { id: transaction.booking_id },
          data: {
            payment_status: 'paid',
            paid_amount: paymentIntent.amount / 100,
            paid_currency: paymentIntent.currency,
            payment_provider: 'stripe',
            payment_reference_number: payment_intent_id,
          },
        });
        await this.updateVendorWallet(transaction.booking_id);

        return {
          success: true,
          message: 'Payment confirmed successfully',
          booking_id: transaction.booking_id,
          amount_paid: paymentIntent.amount / 100,
        };
      } else {
        throw new BadRequestException(`Payment not successful. Status: ${paymentIntent.status}`);
      }
    } catch (error) {
      throw new BadRequestException(`Payment confirmation failed: ${error.message}`);
    }
  }

  private async updateVendorWallet(booking_id: string) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: booking_id },
        include: {
          vendor: true,
        },
      });

      if (!booking || !booking.paid_amount) return;

      // Calculate vendor earnings (after commission)
      const commission_rate = 15; // 15% commission
      const commission_amount = (Number(booking.paid_amount) * commission_rate) / 100;
      const vendor_earnings = Number(booking.paid_amount) - commission_amount;

      // Update or create vendor wallet
      await this.prisma.vendorWallet.upsert({
        where: { user_id: booking.vendor_id },
        update: {
          balance: {
            increment: vendor_earnings,
          },
          total_earnings: {
            increment: vendor_earnings,
          },
        },
        create: {
          user_id: booking.vendor_id,
          balance: vendor_earnings,
          total_earnings: vendor_earnings,
          currency: booking.paid_currency || 'USD',
        },
      });
    } catch (error) {
      console.error('Failed to update vendor wallet:', error);
    }
  }


  async getPaymentStatus(user_id: string, booking_id: string) {
    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: booking_id,
          user_id: user_id,
        },
        include: {
          payment_transactions: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      return {
        booking_id: booking.id,
        payment_status: booking.payment_status,
        total_amount: booking.total_amount,
        paid_amount: booking.paid_amount,
        paid_currency: booking.paid_currency,
        latest_transaction: booking.payment_transactions[0] || null,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get payment status: ${error.message}`);
    }
  }


  async findAll(user_id: string, query: { q?: string; status?: number; approve?: string }) {
    try {
      const where: any = {
        user_id,
        deleted_at: null,
      };

      if (query.status) {
        where.status = query.status.toString();
      }

      if (query.q) {
        where.OR = [
          { invoice_number: { contains: query.q, mode: 'insensitive' } },
          { first_name: { contains: query.q, mode: 'insensitive' } },
          { last_name: { contains: query.q, mode: 'insensitive' } },
        ];
      }

      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking_items: {
            include: {
              package: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          booking_travellers: true,
          booking_extra_services: {
            include: {
              extra_service: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return {
        success: true,
        data: bookings,
        message: 'Bookings retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  async findOne(id: string, user_id: string) {
    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id,
          user_id,
          deleted_at: null,
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking_items: {
            include: {
              package: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
              PackageRoomType: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          booking_travellers: true,
          booking_extra_services: {
            include: {
              extra_service: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      return {
        success: true,
        data: booking,
        message: 'Booking retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  async createFeedback(user_id: string, createFeedbackDto: CreateFeedbackDto) {
    try {
      // Verify booking exists and belongs to user
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: createFeedbackDto.booking_id,
          user_id,
          deleted_at: null,
        },
        include: {
          booking_items: {
            select: {
              package_id: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found or does not belong to you');
      }

      // Check if feedback already exists for this booking
      const existingFeedback = await this.prisma.review.findFirst({
        where: {
          booking_id: createFeedbackDto.booking_id,
          user_id,
          deleted_at: null,
        },
      });

      if (existingFeedback) {
        throw new BadRequestException('Feedback already exists for this booking');
      }

      // Get package_id from booking if not provided
      const package_id = createFeedbackDto.package_id || booking.booking_items[0]?.package_id;

      if (!package_id) {
        throw new BadRequestException('Package ID not found for this booking');
      }

      // Create the feedback
      const feedback = await this.prisma.review.create({
        data: {
          user_id,
          booking_id: createFeedbackDto.booking_id,
          package_id,
          rating_value: createFeedbackDto.rating_value,
          comment: createFeedbackDto.comment,
          status: 1, // Active feedback
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking: {
            select: {
              id: true,
              invoice_number: true,
              type: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        data: feedback,
        message: 'Feedback created successfully',
      };
    } catch (error) {
      console.error('Feedback creation error:', error);
      throw new BadRequestException(error.message);
    }
  }


  async getFeedback(booking_id: string, user_id: string) {
    try {
      // Verify booking exists and belongs to user
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: booking_id,
          user_id,
          deleted_at: null,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found or does not belong to you');
      }

      // Get feedback for this booking
      const feedback = await this.prisma.review.findFirst({
        where: {
          booking_id,
          user_id,
          deleted_at: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        data: feedback,
        message: feedback ? 'Feedback retrieved successfully' : 'No feedback found for this booking',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  async updateFeedback(user_id: string, booking_id: string, updateFeedbackDto: UpdateFeedbackDto) {
    try {
      // Verify booking exists and belongs to user
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: booking_id,
          user_id,
          deleted_at: null,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found or does not belong to you');
      }

      // Find existing feedback
      const existingFeedback = await this.prisma.review.findFirst({
        where: {
          booking_id,
          user_id,
          deleted_at: null,
        },
      });

      if (!existingFeedback) {
        throw new NotFoundException('No feedback found for this booking');
      }

      // Update the feedback
      const updatedFeedback = await this.prisma.review.update({
        where: {
          id: existingFeedback.id,
        },
        data: {
          rating_value: updateFeedbackDto.rating_value,
          comment: updateFeedbackDto.comment,
          updated_at: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking: {
            select: {
              id: true,
              invoice_number: true,
              type: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedFeedback,
        message: 'Feedback updated successfully',
      };
    } catch (error) {
      console.error('Feedback update error:', error);
      throw new BadRequestException(error.message);
    }
  }


  async deleteFeedback(user_id: string, booking_id: string) {
    try {
      // Verify booking exists and belongs to user
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: booking_id,
          user_id,
          deleted_at: null,
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found or does not belong to you');
      }

      // Find existing feedback
      const existingFeedback = await this.prisma.review.findFirst({
        where: {
          booking_id,
          user_id,
          deleted_at: null,
        },
      });

      if (!existingFeedback) {
        throw new NotFoundException('No feedback found for this booking');
      }

      // Soft delete the feedback
      await this.prisma.review.update({
        where: {
          id: existingFeedback.id,
        },
        data: {
          deleted_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Feedback deleted successfully',
      };
    } catch (error) {
      console.error('Feedback deletion error:', error);
      throw new BadRequestException(error.message);
    }
  }


  async getUserFeedback(user_id: string) {
    try {
      const feedbacks = await this.prisma.review.findMany({
        where: {
          user_id,
          deleted_at: null,
        },
        include: {
          booking: {
            select: {
              id: true,
              invoice_number: true,
              type: true,
              total_amount: true,
              booking_date_time: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return {
        success: true,
        data: feedbacks,
        message: 'User feedback retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
