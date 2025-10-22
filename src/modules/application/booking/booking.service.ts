import { Injectable, BadRequestException, NotFoundException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBookingDto, BookingItemDto, BookingTravellerDto, BookingExtraServiceDto } from './dto/create-booking.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { CreatePaymentDto, PaymentIntentResponseDto } from './dto/create-payment.dto';
import { GetUserBookingsDto } from './dto/get-user-bookings.dto';
import { GetUserDashboardDto } from './dto/get-user-dashboard.dto';
import appConfig from '../../../config/app.config';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Add image URLs to package data
   */
  private addImageUrls(packageData: any) {
    const baseUrl = appConfig().app.url;
    
    // Add URLs to package files
    if (packageData.package_files && packageData.package_files.length > 0) {
      packageData.package_files.forEach((file, index) => {
        if (file.file) {
          // Encode the filename to handle special characters and spaces
          const encodedFilename = encodeURIComponent(file.file);
          file.file_url = `${baseUrl}/public/storage/package/${encodedFilename}`;
        }
      });
    }
    
    // Add URLs to trip plan images
    if (packageData.package_trip_plans && packageData.package_trip_plans.length > 0) {
      packageData.package_trip_plans.forEach((tripPlan, tripIndex) => {
        if (tripPlan.package_trip_plan_images && tripPlan.package_trip_plan_images.length > 0) {
          tripPlan.package_trip_plan_images.forEach((image, imgIndex) => {
            if (image.image) {
              const encodedFilename = encodeURIComponent(image.image);
              image.image_url = `${baseUrl}/public/storage/package/${encodedFilename}`;
            }
          });
        }
      });
    }
    
    return packageData;
  }


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

        // Calculate total amount with discount (we'll recalculate after creating extra services)
        let total_amount = this.calculateTotalAmount(processedItems, createBookingDto.booking_extra_services);

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

        // Calculate price breakdown with actual database prices
        const packageTotal = processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const extraServicesTotal = bookingExtraServices.reduce((sum, es) => sum + (parseFloat(es.price.toString()) * es.quantity), 0);
        const baseTotal = packageTotal + extraServicesTotal;
        
        // Apply discount to base total
        let discount = 0;
        if (createBookingDto.discount_amount && createBookingDto.discount_amount > 0) {
          discount = createBookingDto.discount_amount;
        } else if (createBookingDto.discount_percentage && createBookingDto.discount_percentage > 0) {
          discount = (baseTotal * createBookingDto.discount_percentage) / 100;
        }
        
        const finalTotal = baseTotal - discount;
        
        // Update booking with correct total amount
        await prisma.booking.update({
          where: { id: booking.id },
          data: { total_amount: finalTotal }
        });
        
        return {
          success: true,
          data: {
            booking: {
              id: booking.id,
              invoice_number: booking.invoice_number,
              status: booking.status,
              type: booking.type,
              total_amount: finalTotal,
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
            price_breakdown: {
              package_total: packageTotal,
              extra_services_total: extraServicesTotal,
              base_total: baseTotal,
              discount_applied: discount,
              final_total: finalTotal,
              discount_percentage: createBookingDto.discount_percentage || 0,
              discount_amount: createBookingDto.discount_amount || 0,
            },
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
        package_files: {
          select: {
            id: true,
            file: true,
            file_alt: true,
            type: true,
            is_featured: true,
          },
        },
        package_trip_plans: {
          select: {
            id: true,
            title: true,
            description: true,
            package_trip_plan_images: {
              select: {
                id: true,
                image: true,
                image_alt: true,
              },
            },
          },
        },
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

      // Add image URLs to package data
      const packageWithImages = this.addImageUrls(packageData);

      processedItems.push({
        ...item,
        package: packageWithImages,
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

    // Calculate extra services total with quantity support
    if (extraServices && extraServices.length > 0) {
      for (const service of extraServices) {
        // Get price from database if not provided in request
        const servicePrice = service.price || 0; // This will be updated with database price later
        const serviceQuantity = service.quantity || 1;
        const serviceTotal = servicePrice * serviceQuantity;
        total += serviceTotal;
      }
    }

    return total;
  }

  /**
   * Enhanced booking calculation with calendar-based pricing and weekly discounts
   */
 

  private calculateTotalAmountWithDiscount(
    items: any[], 
    extraServices?: BookingExtraServiceDto[],
    discountPercentage?: number,
    discountAmount?: number
  ): number {
    // Calculate base total
    const baseTotal = this.calculateTotalAmount(items, extraServices);
    
    let discount = 0;
    
    // Apply discount percentage if provided
    if (discountPercentage && discountPercentage > 0) {
      discount = (baseTotal * discountPercentage) / 100;
    }
    
    // Apply fixed discount amount if provided (takes priority over percentage)
    if (discountAmount && discountAmount > 0) {
      discount = discountAmount;
    }
    
    // Calculate final total
    const finalTotal = baseTotal - discount;
    
    // Ensure total is not negative
    return Math.max(0, finalTotal);
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
              package_files: {
                select: {
                  id: true,
                  file: true,
                  file_alt: true,
                  type: true,
                  is_featured: true,
                },
              },
              package_trip_plans: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  package_trip_plan_images: {
                    select: {
                      id: true,
                      image: true,
                      image_alt: true,
                    },
                  },
                },
              },
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

      // Add image URLs to package data
      if (bookingItem.package) {
        bookingItem.package = this.addImageUrls(bookingItem.package);
      }

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
      // Validate extra service exists and is active
      const extraService = await prisma.extraService.findFirst({
        where: { 
          id: service.extra_service_id,
          deleted_at: null // Only active services
        },
      });

      if (!extraService) {
        throw new BadRequestException(`Extra service with ID ${service.extra_service_id} not found or inactive`);
      }

      // Use service price from database if not provided in request
      // Priority: Request price > Database price > 0
      const finalPrice = service.price || parseFloat(extraService.price?.toString() || '0');
      const quantity = service.quantity || 1;

      // Create single record with quantity information
      const bookingExtraService = await prisma.bookingExtraService.create({
        data: {
          booking_id,
          extra_service_id: service.extra_service_id,
          price: finalPrice,
          quantity: quantity, // Store quantity in the record
          notes: service.notes, // Store notes if provided
        },
        include: {
          extra_service: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
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

      const commission_rate = 15;
      const total_amount = Number(booking.total_amount)
      const platform_fee = (total_amount * commission_rate) / 100;

      const account = await this.prisma.vendorPaymentMethod.findFirst({
        where: {
          user_id: booking.vendor_id,
          payment_method: createPaymentDto.provider
        }
      })
      const customer = await this.prisma.userCard.findFirst({
        where: {
          user_id: user_id,
          is_default: true
        }
      })

      // Create payment intent
      const paymentIntent = await StripePayment.createPaymentIntent({
        amount: total_amount,
        customer_id: customer.customer_id,
        application_fee_amount: platform_fee,
        account_id: account.account_id,
        currency: createPaymentDto.currency,
        metadata: {
          booking_id: booking.id,
          user_id: booking.user_id,
          vendor_id: booking.vendor_id,
          invoice_number: booking.invoice_number,
        },
      });

      await this.prisma.paymentTransaction.create({
        data: {
          provider: 'stripe',
          order_id: booking.invoice_number,
          user_id: user_id,
          amount: platform_fee,
          booking_id: booking.id,
          currency: createPaymentDto.currency,
          paid_amount: total_amount,
          type: 'commission',
          status: 'pending',
          reference_number: `${paymentIntent.id}_commission`
        }
      })

      // Create payment transaction record
      await this.prisma.paymentTransaction.create({
        data: {
          user_id: booking.user_id,
          booking_id: booking.id,
          order_id: booking.invoice_number,
          type: 'booking',
          provider: 'stripe',
          reference_number: `${paymentIntent.id}_booking`,
          status: 'pending',
          raw_status: paymentIntent.status,
          amount: total_amount,
          currency: createPaymentDto.currency,
          paid_amount: total_amount,
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
    payment_method_id: string
  ) {
    try {
      const transaction = await this.prisma.paymentTransaction.findFirst({
        where: {
          reference_number: `${payment_intent_id}_booking`,
          user_id: user_id,
        },
        include: {
          booking: {
            include: {
              booking_items: {
                include: {
                  package: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          avatar: true,
                        },
                      },
                      reviews: {
                        where: {
                          status: 1,
                        },
                        select: {
                          rating_value: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!transaction) {
        throw new NotFoundException('Payment transaction not found');
      }
      const paymentIntent = await StripePayment.retrievePaymentIntent(payment_intent_id);

      if (paymentIntent.status === 'requires_payment_method') {
        await StripePayment.confirmPayment(paymentIntent.id, payment_method_id)

        const updatedIntent = await StripePayment.retrievePaymentIntent(payment_intent_id);

        if (updatedIntent.status === "requires_capture") {
          const capturePayment = await StripePayment.capturePayment(payment_intent_id)
          if (capturePayment.status === 'succeeded') {
            await this.prisma.paymentTransaction.update({
              where: { id: transaction.id },
              data: {
                status: 'succeeded',
                paid_amount: paymentIntent.amount / 100,
                paid_currency: paymentIntent.currency,
                raw_status: paymentIntent.status,
              },
            });
            await this.prisma.paymentTransaction.update({
              where: {
                reference_number: `${payment_intent_id}_commission`,
                type: 'commission',
                status: 'pending'
              },
              data: {
                status: 'succeeded'
              }
            })
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
            const booking = await this.prisma.booking.findUnique({
              where: {
                id: transaction.booking_id
              },
              include: {
                booking_items: true
              }
            })
            const package_data = await this.prisma.package.findUnique({
              where: { id: booking.booking_items[0].package_id }
            })
            const payment_method = await this.prisma.userCard.findUnique({
              where: {
                stripe_payment_method_id: payment_method_id
              }
            })

            const data = {
              package_details: package_data,
              booking_details: {
                id: booking.id,
                date: booking.created_at,
                total: paymentIntent.amount / 100,
                payment_method: payment_method.brand
              },
              user: transaction.booking.booking_items[0].package.user
            }

            return {
              success: true,
              message: 'Payment confirmed successfully',
              data
            };
          } else {
            throw new Error(`PaymentIntent not ready to capture. Status: ${capturePayment.status}`);
          }
        } else {
          throw new Error(`PaymentIntent not ready to capture. Status: ${updatedIntent.status}`);
        }
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


  async getPaymentStatus(booking_id: string) {
    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: booking_id,
          deleted_at: null,
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

  async refundRequest({ booking_id, user_id, refund_reason }: {user_id: string, booking_id: string, refund_reason: string}) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: {
          id: booking_id,
          user_id: user_id,
        },
        select: {
          payment_reference_number: true,
          booking_items: {
            select: {
              price: true,
              quantity: true
            }
          }
        }
      })

      if (!booking) {
        throw new NotFoundException('Booking not Found')
      }

      const amount = booking.booking_items?.[0]?.price * booking.booking_items?.[0]?.quantity

      const alreadyRequested = await this.prisma.paymentTransaction.findFirst(({
        where: {
          type: 'refund',
          booking_id: booking_id
        }
      }))

      if (!booking.payment_reference_number) {
        throw new BadRequestException('Payment not confirm yet.')
      }

      const isPaymentConfirm = await this.prisma.paymentTransaction.findFirst({
        where: {
          type: 'booking',
          status: 'succeeded',
          booking_id
        }
      })

      if (!isPaymentConfirm) {
        throw new BadRequestException('Payment not confirm yet.')
      }

      if (alreadyRequested) {
        throw new BadRequestException('Duplicate refund request.')
      }

      const refundReq = await this.prisma.paymentTransaction.create({
        data: {
          order_id: isPaymentConfirm.order_id,
          amount,
          provider: 'stripe',
          type: 'refund',
          status: 'pending',
          booking_id,
          user_id,
          reference_number: `${booking.payment_reference_number}_refund`
        }
      })
      await this.prisma.refundTransaction.create({
        data: {
          payment_transaction_id: refundReq.id,
          refund_reason
        }
      })
      return {
        success: true,
        message: "Refund request submitted. Waiting for admin approval.",
        data: refundReq,
      };
    } catch (error) {
      console.error("Error requesting refund:", error?.message);
      if (error instanceof BadRequestException) throw error;
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        `Error requesting refund: ${error?.message}`
      );
    }
  }

  async findAll(user_id: string, query: { q?: string; status?: string; approve?: string; show_all?: string }) {
    try {
      console.log('=== findAll DEBUG START ===');
      console.log('User ID received:', user_id);
      console.log('Query parameters:', query);
      console.log('User ID type:', typeof user_id);

      // First, let's check if there are ANY bookings in the database
      const totalBookingsCount = await this.prisma.booking.count({
        where: { deleted_at: null }
      });
      console.log('Total bookings in database:', totalBookingsCount);

      // Check if there are bookings for this specific user
      const userBookingsCount = await this.prisma.booking.count({
        where: {
          user_id: user_id,
          deleted_at: null
        }
      });
      console.log('Bookings for this user:', userBookingsCount);

      // Let's also check what user_ids exist in the database
      const allUserIds = await this.prisma.booking.findMany({
        where: { deleted_at: null },
        select: { user_id: true },
        distinct: ['user_id']
      });
      console.log('All user_ids in bookings table:', allUserIds.map(b => b.user_id));

      // Determine if requester is admin
      const requester = await this.prisma.user.findUnique({
        where: { id: user_id },
        select: { type: true },
      });

      const isAdmin = requester?.type === 'admin' || requester?.type === 'su_admin';
      const showAll = query.show_all === 'true';
      console.log('Requester type:', requester?.type);
      console.log('Is admin:', isAdmin);
      console.log('Show all flag:', showAll);

      const where: any = {
        deleted_at: null,
      };
      if (!isAdmin && !showAll) {
        where.user_id = user_id;
        console.log('Filtering by user_id:', user_id);
      } else {
        console.log('Admin access or show_all=true - showing all bookings');
      }

      // Handle status filtering
      if (query.status) {
        where.status = query.status;
      }

      // Handle approval filtering
      if (query.approve) {
        if (query.approve === 'true') {
          where.approved_at = { not: null };
        } else if (query.approve === 'false') {
          where.approved_at = null;
        }
      }

      // Handle search query
      if (query.q) {
        where.OR = [
          { invoice_number: { contains: query.q, mode: 'insensitive' } },
          { first_name: { contains: query.q, mode: 'insensitive' } },
          { last_name: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } },
        ];
      }

      console.log('Final where clause:', JSON.stringify(where, null, 2));

      const bookings = await this.prisma.booking.findMany({
        where,
        include: {
          // Include all user fields for both customer and vendor
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone_number: true,
              avatar: true,
              type: true,
              status: true,
              created_at: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone_number: true,
              avatar: true,
              type: true,
              status: true,
              created_at: true,
            },
          },
          // Include all booking items with complete package data
          booking_items: {
            include: {
              package: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                  reviews: {
                    where: {
                      status: 1,
                    },
                    select: {
                      rating_value: true,
                      comment: true,
                      created_at: true,
                    },
                  },
                },
              },
              PackageRoomType: true,
            },
          },
          // Include all booking travellers
          booking_travellers: true,
          // Include all booking extra services with complete service data
          booking_extra_services: {
            include: {
              extra_service: true,
            },
          },
          // Include all booking coupons
          booking_coupons: {
            include: {
              coupon: true,
            },
          },
          // Include all payment transactions
          payment_transactions: {
            orderBy: {
              created_at: 'desc',
            },
          },
          // Include all reviews for this booking
          reviews: {
            where: {
              deleted_at: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
              package: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      console.log(`Query returned ${bookings.length} bookings`);
      console.log('=== findAll DEBUG END ===');

      return {
        success: true,
        data: bookings,
        message: `Bookings retrieved successfully. Found ${bookings.length} booking(s).`,
        count: bookings.length,
        debug: {
          totalBookingsInDB: totalBookingsCount,
          userBookingsInDB: userBookingsCount,
          user_id_received: user_id,
          user_id_type: typeof user_id
        }
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new BadRequestException(`Failed to retrieve bookings: ${error.message}`);
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

  // Debug method to check database without authentication
  async debugDatabaseCheck() {
    try {
      // Get total bookings count
      const totalBookings = await this.prisma.booking.count();

      // Get all bookings with basic info
      const allBookings = await this.prisma.booking.findMany({
        select: {
          id: true,
          user_id: true,
          vendor_id: true,
          status: true,
          invoice_number: true,
          created_at: true,
          deleted_at: true,
          first_name: true,
          last_name: true,
          email: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 10, // Get first 10 bookings
      });

      // Get unique user_ids
      const uniqueUserIds = await this.prisma.booking.findMany({
        select: { user_id: true },
        distinct: ['user_id'],
        where: { user_id: { not: null } }
      });

      return {
        success: true,
        data: {
          totalBookings,
          sampleBookings: allBookings,
          uniqueUserIds: uniqueUserIds.map(u => u.user_id),
          message: 'Database check completed'
        }
      };
    } catch (error) {
      console.error('Database check failed:', error);
      throw new BadRequestException(`Database check failed: ${error.message}`);
    }
  }

  // /**
  //  * Get user bookings with pagination and filters
  //  */
  // async getUserBookings(user_id: string, query: GetUserBookingsDto) {
  //   try {
  //     const {
  //       page = 1,
  //       limit = 10,
  //       status,
  //       type,
  //       search,
  //       sort_by = 'created_at',
  //       sort_order = 'desc'
  //     } = query;

  //     // Calculate pagination
  //     const skip = (page - 1) * limit;

  //     // Build where conditions
  //     const whereConditions: any = {
  //       user_id: user_id,
  //       deleted_at: null,
  //     };

  //     // Add status filter
  //     if (status) {
  //       whereConditions.status = status;
  //     }

  //     // Add type filter
  //     if (type) {
  //       whereConditions.type = type;
  //     }

  //     // Add search filter
  //     if (search) {
  //       whereConditions.OR = [
  //         {
  //           invoice_number: {
  //             contains: search,
  //             mode: 'insensitive',
  //           },
  //         },
  //         {
  //           booking_items: {
  //             some: {
  //               package: {
  //                 name: {
  //                   contains: search,
  //                   mode: 'insensitive',
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       ];
  //     }

  //     // Get total count for pagination
  //     const totalCount = await this.prisma.booking.count({
  //       where: whereConditions,
  //     });

  //     // Get bookings with pagination
  //     const bookings = await this.prisma.booking.findMany({
  //       where: whereConditions,
  //       skip,
  //       take: limit,
  //       orderBy: {
  //         [sort_by]: sort_order,
  //       },
  //       include: {
  //         user: {
  //           select: {
  //             id: true,
  //             name: true,
  //             email: true,
  //           },
  //         },
  //         booking_items: {
  //           include: {
  //             package: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //                 description: true,
  //                 package_files: {
  //                   select: {
  //                     id: true,
  //                     file: true,
  //                     file_alt: true,
  //                     type: true,
  //                     is_featured: true,
  //                   },
  //                 },
  //                 package_trip_plans: {
  //                   select: {
  //                     id: true,
  //                     title: true,
  //                     description: true,
  //                     package_trip_plan_images: {
  //                       select: {
  //                         id: true,
  //                         image: true,
  //                         image_alt: true,
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //             PackageRoomType: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //                 description: true,
  //               },
  //             },
  //           },
  //         },
  //         booking_travellers: true,
  //         booking_extra_services: {
  //           include: {
  //             extra_service: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //                 description: true,
  //                 price: true,
  //               },
  //             },
  //           },
  //         },
  //         payment_transactions: {
  //           select: {
  //             id: true,
  //             status: true,
  //             amount: true,
  //             provider: true,
  //             created_at: true,
  //           },
  //         },
  //       },
  //     });

  //     // Add image URLs to package data
  //     const bookingsWithImages = bookings.map(booking => ({
  //       ...booking,
  //       items: (booking as any).booking_items.map((item: any) => ({
  //         ...item,
  //         package: item.package ? this.addImageUrls(item.package) : item.package,
  //       })),
  //       travellers: (booking as any).booking_travellers,
  //       extra_services: (booking as any).booking_extra_services,
  //       payments: (booking as any).payment_transactions,
  //     }));

  //     // Calculate pagination info
  //     const totalPages = Math.ceil(totalCount / limit);
  //     const hasNextPage = page < totalPages;
  //     const hasPrevPage = page > 1;

  //     return {
  //       success: true,
  //       data: {
  //         bookings: bookingsWithImages,
  //         pagination: {
  //           current_page: page,
  //           total_pages: totalPages,
  //           total_items: totalCount,
  //           items_per_page: limit,
  //           has_next_page: hasNextPage,
  //           has_prev_page: hasPrevPage,
  //         },
  //         filters: {
  //           status: status || null,
  //           type: type || null,
  //           search: search || null,
  //           sort_by,
  //           sort_order,
  //         },
  //       },
  //       message: 'User bookings retrieved successfully',
  //     };
  //   } catch (error) {
  //     console.error('Error getting user bookings:', error);
  //     throw new BadRequestException('Failed to retrieve user bookings');
  //   }
  // }

  /**
   * Get user dashboard statistics
   */
  async getUserDashboard(user_id: string, query: GetUserDashboardDto) {
    try {
      const { start_date, end_date, type } = query;

      // Build where conditions
      const whereConditions: any = {
        user_id: user_id,
        deleted_at: null,
      };

      // Add type filter
      if (type) {
        whereConditions.type = type;
      }

      // Add date range filter
      if (start_date || end_date) {
        whereConditions.booking_date_time = {};
        if (start_date) {
          whereConditions.booking_date_time.gte = new Date(start_date);
        }
        if (end_date) {
          whereConditions.booking_date_time.lte = new Date(end_date);
        }
      }

      // Get all user bookings with detailed information
      const bookings = await this.prisma.booking.findMany({
        where: whereConditions,
        include: {
          booking_items: {
            include: {
              package: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  type: true,
                  package_files: {
                    select: {
                      id: true,
                      file: true,
                      file_alt: true,
                      type: true,
                      is_featured: true,
                    },
                  },
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
                  price: true,
                },
              },
            },
          },
          payment_transactions: {
            select: {
              id: true,
              status: true,
              amount: true,
              provider: true,
              created_at: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Calculate statistics
      const totalBookings = bookings.length;
      const completedStays = bookings.filter(booking => booking.status === 'completed').length;
      const upcomingStays = bookings.filter(booking => 
        booking.status === 'approved' || booking.status === 'pending'
      ).length;

      // Calculate total spend
      const totalSpend = bookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.total_amount?.toString() || '0');
      }, 0);

      // Calculate total nights stayed
      const totalNights = bookings.reduce((sum, booking) => {
        if (booking.status === 'completed' && booking.booking_items.length > 0) {
          const item = booking.booking_items[0];
          if (item.start_date && item.end_date) {
            const start = new Date(item.start_date);
            const end = new Date(item.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }
        }
        return sum;
      }, 0);

      // Get recent bookings (last 5)
      const recentBookings = bookings.slice(0, 5).map(booking => ({
        id: booking.id,
        invoice_number: booking.invoice_number,
        status: booking.status,
        type: booking.type,
        total_amount: booking.total_amount,
        booking_date_time: booking.booking_date_time,
        package_name: booking.booking_items[0]?.package?.name || 'N/A',
        start_date: booking.booking_items[0]?.start_date,
        end_date: booking.booking_items[0]?.end_date,
        nights: booking.booking_items[0]?.start_date && booking.booking_items[0]?.end_date 
          ? Math.ceil((new Date(booking.booking_items[0].end_date).getTime() - new Date(booking.booking_items[0].start_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        package_image: booking.booking_items[0]?.package?.package_files?.[0] 
          ? this.addImageUrls(booking.booking_items[0].package).package_files[0].file_url
          : null,
      }));

      // Get booking statistics by type
      const bookingStatsByType = bookings.reduce((acc, booking) => {
        const type = booking.type || 'unknown';
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            total_amount: 0,
            completed: 0,
            pending: 0,
          };
        }
        acc[type].count++;
        acc[type].total_amount += parseFloat(booking.total_amount?.toString() || '0');
        if (booking.status === 'completed') acc[type].completed++;
        if (booking.status === 'pending' || booking.status === 'approved') acc[type].pending++;
        return acc;
      }, {} as any);

      // Get monthly spending trend (last 12 months)
      const monthlySpending = bookings.reduce((acc, booking) => {
        if (booking.booking_date_time) {
          const month = new Date(booking.booking_date_time).toISOString().slice(0, 7); // YYYY-MM
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += parseFloat(booking.total_amount?.toString() || '0');
        }
        return acc;
      }, {} as any);

      return {
        success: true,
        data: {
          summary: {
            total_bookings: totalBookings,
            completed_stays: completedStays,
            upcoming_stays: upcomingStays,
            total_spend: totalSpend,
            total_nights: totalNights,
          },
          recent_bookings: recentBookings,
          booking_stats_by_type: bookingStatsByType,
          monthly_spending: monthlySpending,
          filters: {
            start_date: start_date || null,
            end_date: end_date || null,
            type: type || null,
          },
        },
        message: 'User dashboard data retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      throw new BadRequestException('Failed to retrieve user dashboard data');
    }
  }
}
