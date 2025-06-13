import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { BookingRepository } from '../../../common/repository/booking/booking.repository';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { CheckoutRepository } from '../../../common/repository/checkout/checkout.repository';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';
import { NotificationRepository } from '../../../common/repository/notification/notification.repository';
import { MessageGateway } from '../../../modules/chat/message/message.gateway';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) {}

  async create(
    user_id: string,
    checkout_id: string,
    createBookingDto: CreateBookingDto,
  ) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const checkout = await prisma.checkout.findUnique({
          where: {
            id: checkout_id,
          },
          include: {
            checkout_extra_services: true,
            checkout_items: {
              include: {
                package: true,
              },
            },
            checkout_travellers: true,
          },
        });

        if (!checkout) {
          return {
            success: false,
            message: 'Checkout not found',
          };
        }

        if (!user_id) {
          return {
            success: false,
            message: 'User not found',
          };
        }

        const data = {};
        // user details
        if (checkout.email) {
          data['email'] = checkout.email;
        }
        if (checkout.phone_number) {
          data['phone_number'] = checkout.phone_number;
        }
        if (checkout.address1) {
          data['address1'] = checkout.address1;
        }
        if (checkout.address2) {
          data['address2'] = checkout.address2;
        }
        if (checkout.city) {
          data['city'] = checkout.city;
        }
        if (checkout.state) {
          data['state'] = checkout.state;
        }
        if (checkout.zip_code) {
          data['zip_code'] = checkout.zip_code;
        }
        if (checkout.country) {
          data['country'] = checkout.country;
        }
        if (checkout.vendor_id) {
          data['vendor_id'] = checkout.vendor_id;
        }

        // create invoice number
        const invoice_number = await BookingRepository.createInvoiceNumber();
        const total_price =
          await CheckoutRepository.calculateTotalPrice(checkout_id);

        // create booking
        const booking = await prisma.booking.create({
          data: {
            ...data,
            invoice_number: invoice_number,
            total_amount: total_price,
            user_id: user_id,
          },
        });

        // create booking-extra-services
        if (checkout.checkout_extra_services.length > 0) {
          for (const extra_service of checkout.checkout_extra_services) {
            await prisma.bookingExtraService.create({
              data: {
                booking_id: booking.id,
                extra_service_id: extra_service.extra_service_id,
              },
            });
          }
        }

        // create booking-items
        for (const item of checkout.checkout_items) {
          await prisma.bookingItem.create({
            data: {
              booking_id: booking.id,
              package_id: item.package_id,
              start_date: item.start_date,
              end_date: item.end_date,
              price: item.package.price,
            },
          });
        }

        // create booking-travellers
        for (const traveller of checkout.checkout_travellers) {
          await prisma.bookingTraveller.create({
            data: {
              booking_id: booking.id,
              full_name: traveller.full_name,
              type: traveller.type,
            },
          });
        }

        // apply coupon
        if (checkout.user_id) {
          const temp_redeems = await prisma.tempRedeem.findMany({
            where: {
              user_id: checkout.user_id,
              checkout_id: checkout.id,
            },
          });

          if (temp_redeems.length > 0) {
            for (const redeem of temp_redeems) {
              await prisma.bookingCoupon.create({
                data: {
                  booking_id: booking.id,
                  coupon_id: redeem.coupon_id,
                },
              });
            }
          }
        }

        const userDetails = await UserRepository.getUserDetails(user_id);

        const currency = 'usd';
        // calculate tax
        // const tax_calculation = await StripePayment.calculateTax({
        //   amount: total_price,
        //   currency: currency,
        //   customer_details: {
        //     address: {
        //       city: checkout.city,
        //       country: checkout.country,
        //       line1: checkout.address1,
        //       postal_code: checkout.zip_code,
        //       state: checkout.state,
        //     },
        //   },
        // });

        // create payment intent
        const paymentIntent = await StripePayment.createPaymentIntent({
          amount: total_price,
          currency: currency,
          customer_id: userDetails.billing_id,
          // metadata: {
          //   tax_calculation: tax_calculation.id,
          // },
        });

        // create transaction
        await prisma.paymentTransaction.create({
          data: {
            booking_id: booking.id,
            reference_number: paymentIntent.id,
            amount: total_price,
            currency: 'usd',
            status: 'pending',
          },
        });
        // await TransactionRepository.createTransaction({
        //   booking_id: booking.id,
        //   reference_number: paymentIntent.id,
        //   amount: total_price,
        //   currency: 'usd',
        //   status: 'pending',
        // });

        // delete checkout
        await prisma.checkout.delete({
          where: {
            id: checkout.id,
          },
        });

        // send notification
        await NotificationRepository.createNotification({
          sender_id: user_id,
          receiver_id: booking.vendor_id,
          text: 'New booking created',
          type: 'booking',
          entity_id: booking.id,
        });

        // send message
        this.messageGateway.server.emit('notification', {
          sender_id: user_id,
          receiver_id: booking.vendor_id,
          text: 'New booking created',
          type: 'booking',
          entity_id: booking.id,
        });

        return {
          success: true,
          message: 'Booking created successfully.',
          data: {
            client_secret: paymentIntent.client_secret,
          },
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll({
    user_id,
    q,
    status = null,
    approve,
  }: {
    user_id?: string;
    q?: string;
    status?: number;
    approve?: string;
  }) {
    try {
      const where_condition = {};
      // search using q
      if (q) {
        where_condition['OR'] = [
          { invoice_number: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
          {
            booking_items: {
              some: {
                package: {
                  name: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        ];
      }

      if (status) {
        where_condition['status'] = Number(status);
      }

      if (approve) {
        if (approve === 'approved') {
          where_condition['approved_at'] = { not: null };
        } else {
          where_condition['approved_at'] = null;
        }
      }

      const bookings = await this.prisma.booking.findMany({
        where: {
          ...where_condition,
          user_id: user_id,
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          invoice_number: true,
          email: true,
          phone_number: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          zip_code: true,
          country: true,
          total_amount: true,
          payment_status: true,
          status: true,
          booking_items: {
            select: {
              package: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
      });

      return {
        success: true,
        data: bookings,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string, user_id: string) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: {
          id: id,
          user_id: user_id,
        },
        select: {
          id: true,
          invoice_number: true,
          status: true,
          vendor_id: true,
          user_id: true,
          type: true,
          total_amount: true,
          payment_status: true,
          payment_raw_status: true,
          paid_amount: true,
          paid_currency: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          comments: true,
          user: {
            select: {
              name: true,
              email: true,
              avatar: true,
            },
          },
          booking_items: {
            select: {
              start_date: true,
              end_date: true,
              package: {
                select: {
                  id: true,
                  created_at: true,
                  updated_at: true,
                  status: true,
                  approved_at: true,
                  user_id: true,
                  name: true,
                  description: true,
                  price: true,
                  duration: true,
                  min_capacity: true,
                  max_capacity: true,
                  type: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      type: true,
                    },
                  },
                  package_languages: {
                    select: {
                      language: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                  package_destinations: {
                    select: {
                      destination: {
                        select: {
                          id: true,
                          name: true,
                          country: {
                            select: {
                              id: true,
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  cancellation_policy_id: true,
                  package_categories: {
                    select: {
                      category: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                  package_files: {
                    select: {
                      id: true,
                      file: true,
                    },
                  },
                  reviews: {
                    select: {
                      id: true,
                      package_id: true,
                      rating_value: true,
                      comment: true,
                      created_at: true,
                      updated_at: true,
                      user: {
                        select: {
                          id: true,
                          name: true,
                          avatar: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          booking_extra_services: {
            select: {
              extra_service: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          },
          booking_travellers: {
            select: {
              full_name: true,
              type: true,
            },
          },
          booking_coupons: {
            select: {
              coupon: {
                select: {
                  name: true,
                  amount: true,
                  amount_type: true,
                },
              },
            },
          },
          payment_transactions: {
            select: {
              amount: true,
              currency: true,
              paid_amount: true,
              paid_currency: true,
              status: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
      });

      if (!booking) {
        return {
          success: false,
          message: 'Booking information not found',
        };
      }

      // add avatar url
      if (booking.user && booking.user.avatar) {
        booking.user['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + booking.user.avatar,
        );
      }

      // add image url to package
      for (const booking_item of booking.booking_items) {
        for (const file of booking_item.package.package_files) {
          if (file.file) {
            file['image_url'] = SojebStorage.url(
              appConfig().storageUrl.package + file.file,
            );
          }
        }
      }

      for (const items of booking.booking_items) {
        // calculate avarage rating
        let totalRating = 0;
        let totalReviews = 0;
        for (const review of items.package.reviews) {
          totalRating += review.rating_value;
          totalReviews++;
        }
        const averageRating = totalRating / totalReviews;
        items['average_rating'] = averageRating;
      }

      // reviews count
      const reviewsCount = await this.prisma.review.count({
        where: {
          package_id: booking.booking_items[0].package.id,
        },
      });
      booking['reviews_count'] = reviewsCount;

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async downloadInvoice(payment_intent_id: string) {
    try {
      const invoice =
        await StripePayment.downloadInvoiceFile(payment_intent_id);
      return invoice;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async sendInvoiceToEmail(payment_intent_id: string) {
    const invoice = await StripePayment.sendInvoiceToEmail(payment_intent_id);
    return invoice;
  }
}
