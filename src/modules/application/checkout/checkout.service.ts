import { Injectable } from '@nestjs/common';
import {
  CreateCheckoutDto,
  IBookingTraveller,
  IExtraService,
  IPaymentMethod,
} from './dto/create-checkout.dto';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from 'src/common/repository/user/user.repository';
import { CouponRepository } from 'src/common/repository/coupon/coupon.repository';
import { UpdateCheckoutDto } from './dto/update-checkout.dto';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { CheckoutRepository } from 'src/common/repository/checkout/checkout.repository';

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  async create(user_id: string, createCheckoutDto: CreateCheckoutDto) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const existingUserDetails =
          await UserRepository.getUserDetails(user_id);

        if (!existingUserDetails) {
          return {
            success: false,
            message: 'User not found',
          };
        }
        const data = {};
        if (!createCheckoutDto.package_id) {
          return {
            success: false,
            message: 'Package id is required',
          };
        }
        const packageData = await prisma.package.findUnique({
          where: {
            id: createCheckoutDto.package_id,
          },
        });

        if (!packageData) {
          return {
            success: false,
            message: 'Package not found',
          };
        }

        const package_user_id = packageData.user_id;

        if (!package_user_id) {
          return {
            success: false,
            message: 'Package owner not found',
          };
        }

        // add vendor id if the package is from vendor
        const userDetails =
          await UserRepository.getUserDetails(package_user_id);

        if (!userDetails) {
          return {
            success: false,
            message: 'Package owner not found',
          };
        }
        if (userDetails && userDetails.type == 'vendor') {
          data['vendor_id'] = userDetails.id;
        }

        // create checkout
        const checkout = await prisma.checkout.create({
          data: {
            ...data,
            user_id: user_id,
          },
        });

        if (!checkout) {
          return {
            success: false,
            message: 'Checkout not created',
          };
        }

        if (createCheckoutDto.extra_services) {
          let extra_services: IExtraService[];
          if (createCheckoutDto.extra_services instanceof Array) {
            extra_services = createCheckoutDto.extra_services;
          } else {
            extra_services = JSON.parse(createCheckoutDto.extra_services);
          }
          for (const extra_service of extra_services) {
            await prisma.checkoutExtraService.create({
              data: {
                package_id: createCheckoutDto.package_id,
                checkout_id: checkout.id,
                extra_service_id: extra_service.id,
              },
            });
          }
        }

        const checkoutItemData = {};

        if (createCheckoutDto.package_id) {
          checkoutItemData['package_id'] = createCheckoutDto.package_id;
        }
        if (createCheckoutDto.start_date) {
          checkoutItemData['start_date'] = createCheckoutDto.start_date;
        }
        if (createCheckoutDto.end_date) {
          checkoutItemData['end_date'] = createCheckoutDto.end_date;
        }

        // create checkout items
        await prisma.checkoutItem.create({
          data: {
            ...checkoutItemData,
            checkout_id: checkout.id,
            package_id: createCheckoutDto.package_id,
          },
        });

        // create booking-travellers
        if (createCheckoutDto.booking_travellers) {
          let booking_travellers: IBookingTraveller[];
          if (createCheckoutDto.extra_services instanceof Array) {
            booking_travellers = createCheckoutDto.booking_travellers;
          } else {
            booking_travellers = JSON.parse(
              createCheckoutDto.booking_travellers,
            );
          }
          for (const traveller of booking_travellers) {
            await prisma.checkoutTraveller.create({
              data: {
                checkout_id: checkout.id,
                full_name: traveller.full_name,
                type: traveller.type,
              },
            });
          }
        }

        return {
          success: true,
          message: 'Checkout created successfully.',
          data: checkout,
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

  async update(
    id: string,
    user_id: string,
    updateCheckoutDto: UpdateCheckoutDto,
  ) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const data: any = {};
        // user details
        // if (updateCheckoutDto.email) {
        //   data.email = updateCheckoutDto.email;
        // } else {
        //   return {
        //     success: false,
        //     message: 'Email is required',
        //   };
        // }
        if (updateCheckoutDto.phone_number) {
          data.phone_number = updateCheckoutDto.phone_number;
        }
        if (updateCheckoutDto.address1) {
          data.address1 = updateCheckoutDto.address1;
        }
        if (updateCheckoutDto.address2) {
          data.address2 = updateCheckoutDto.address2;
        }
        if (updateCheckoutDto.city) {
          data.city = updateCheckoutDto.city;
        }
        if (updateCheckoutDto.state) {
          data.state = updateCheckoutDto.state;
        }
        if (updateCheckoutDto.zip_code) {
          data.zip_code = updateCheckoutDto.zip_code;
        }
        if (updateCheckoutDto.country) {
          data.country = updateCheckoutDto.country;
        }

        const checkoutExists = await prisma.checkout.findUnique({
          where: {
            id: id,
          },
          select: {
            checkout_items: {
              select: {
                package_id: true,
                start_date: true,
                end_date: true,
                package: {
                  select: {
                    id: true,
                    user_id: true,
                    type: true,
                  },
                },
              },
            },
          },
        });

        if (!checkoutExists) {
          return {
            success: false,
            message: 'Checkout not found',
          };
        }

        const package_id = checkoutExists.checkout_items[0].package_id;

        if (updateCheckoutDto.extra_services) {
          let extra_services: IExtraService[];
          if (updateCheckoutDto.extra_services instanceof Array) {
            extra_services = updateCheckoutDto.extra_services;
          } else {
            extra_services = JSON.parse(updateCheckoutDto.extra_services);
          }
          for (const extra_service of extra_services) {
            await prisma.packageExtraService.create({
              data: {
                package_id: package_id,
                extra_service_id: extra_service.id,
              },
            });
          }
        }

        // create checkout
        const checkout = await prisma.checkout.update({
          where: {
            id: id,
          },
          data: {
            ...data,
          },
        });

        if (!checkout) {
          return {
            success: false,
            message: 'Checkout not created',
          };
        }

        // create booking-travellers
        if (updateCheckoutDto.booking_travellers) {
          let booking_travellers: IBookingTraveller[];
          if (updateCheckoutDto.extra_services instanceof Array) {
            booking_travellers = updateCheckoutDto.booking_travellers;
          } else {
            booking_travellers = JSON.parse(
              updateCheckoutDto.booking_travellers,
            );
          }
          for (const traveller of booking_travellers) {
            await prisma.checkoutTraveller.create({
              data: {
                checkout_id: checkout.id,
                full_name: traveller.full_name,
                type: traveller.type,
              },
            });
          }
        }

        // create user payment methods
        if (updateCheckoutDto.payment_methods) {
          const payment_method: IPaymentMethod =
            updateCheckoutDto.payment_methods;

          const exp_month = Number(payment_method.expiry_date.split('/')[0]);
          const exp_year = Number(payment_method.expiry_date.split('/')[1]);

          const paymentMethodId = await StripePayment.createPaymentMethod({
            card: {
              number: payment_method.number,
              exp_month: exp_month,
              exp_year: exp_year,
              cvc: payment_method.cvc,
            },
            billing_details: {
              name: payment_method.name,
              // email: updateCheckoutDto.email,
              address: {
                city: updateCheckoutDto.city,
                country: updateCheckoutDto.country,
                line1: updateCheckoutDto.address1,
                line2: updateCheckoutDto.address2,
                postal_code: updateCheckoutDto.zip_code,
                state: updateCheckoutDto.state,
              },
            },
          });

          if (paymentMethodId) {
            const userDetails = await UserRepository.getUserDetails(user_id);

            // attach payment method to stripe customer
            await StripePayment.attachCustomerPaymentMethodId({
              customer_id: userDetails.billing_id,
              payment_method_id: paymentMethodId.id,
            });

            // make it default payment method
            await StripePayment.setCustomerDefaultPaymentMethodId({
              customer_id: userDetails.billing_id,
              payment_method_id: paymentMethodId.id,
            });
          }
        }

        return {
          success: true,
          message: 'Checkout updated successfully.',
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

  async findOne(id: string) {
    try {
      const checkoutData = await this.prisma.checkout.findUnique({
        where: { id: id },
        select: {
          id: true,
          email: true,
          phone_number: true,
          address1: true,
          address2: true,
          zip_code: true,
          state: true,
          city: true,
          country: true,
          checkout_travellers: {
            select: {
              full_name: true,
              type: true,
            },
          },
          checkout_extra_services: {
            select: {
              extra_service: true,
            },
          },
          checkout_items: {
            select: {
              start_date: true,
              end_date: true,
              package: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  duration: true,
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
                },
              },
            },
          },
          temp_redeems: {
            select: {
              id: true,
              coupon: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  amount: true,
                  amount_type: true,
                },
              },
            },
          },
        },
      });

      if (!checkoutData) {
        return {
          success: false,
          message: 'Checkout not found',
        };
      }

      // get reviews for the package
      const reviews = await this.prisma.review.findMany({
        where: {
          package_id: checkoutData.checkout_items[0].package.id,
        },
        select: {
          id: true,
          rating_value: true,
          comment: true,
        },
      });

      // calculate avarage rating
      let totalRating = 0;
      let totalReviews = 0;
      for (const review of reviews) {
        totalRating += review.rating_value;
        totalReviews++;
      }
      const averageRating = totalRating / totalReviews;
      checkoutData['average_rating'] = averageRating;

      return {
        success: true,
        data: {
          currency: 'USD',
          checkout: checkoutData,
          fees: 50,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async applyCoupon({
    user_id,
    code,
    // coupons,
    checkout_id,
  }: {
    user_id: string;
    code: string;
    // coupons: ICoupon[];
    checkout_id: string;
  }) {
    try {
      const checkout = await this.prisma.checkout.findUnique({
        where: {
          id: checkout_id,
        },
        select: {
          id: true,
          checkout_items: {
            select: {
              package_id: true,
            },
          },
          checkout_extra_services: {
            select: {
              extra_service_id: true,
            },
          },
        },
      });

      if (!checkout) {
        return {
          success: false,
          message: 'Checkout not found',
        };
      }

      if (!checkout.checkout_items || checkout.checkout_items.length == 0) {
        return {
          success: false,
          message: 'Checkout items not found',
        };
      }

      // apply coupon
      const applyCoupon = await CouponRepository.applyCoupon({
        user_id: user_id,
        coupon_code: code,
        package_id: checkout.checkout_items[0].package_id,
        checkout_id: checkout.id,
      });

      const couponPrice = await CheckoutRepository.calculateCoupon(checkout_id);

      return {
        success: applyCoupon.success,
        message: applyCoupon.message,
        data: couponPrice,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async removeCoupon({
    coupon_id,
    user_id,
    checkout_id,
  }: {
    coupon_id: string;
    user_id: string;
    checkout_id: string;
  }) {
    try {
      const checkout = await this.prisma.checkout.findUnique({
        where: {
          id: checkout_id,
        },
        select: {
          id: true,
          checkout_items: {
            select: {
              package_id: true,
            },
          },
          checkout_extra_services: {
            select: {
              extra_service_id: true,
            },
          },
        },
      });

      if (!checkout) {
        return {
          success: false,
          message: 'Checkout not found',
        };
      }

      if (!checkout.checkout_items || checkout.checkout_items.length == 0) {
        return {
          success: false,
          message: 'Checkout items not found',
        };
      }

      // remove coupon
      const removeCoupon = await CouponRepository.removeCouponById({
        coupon_id: coupon_id,
        user_id: user_id,
        checkout_id: checkout.id,
      });

      const couponPrice = await CheckoutRepository.calculateCoupon(checkout_id);

      return {
        success: removeCoupon.success,
        message: removeCoupon.message,
        data: couponPrice,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
