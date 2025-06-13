import { Coupon, PrismaClient } from '@prisma/client';
import { DateHelper } from 'src/common/helper/date.helper';

const prisma = new PrismaClient();

export class CouponRepository {
  /**
   * Apply coupon
   * @param user_id
   * @param coupon_code
   * @param package_id
   * @returns
   */
  static async applyCoupon({
    user_id,
    coupon_code,
    package_id,
    checkout_id,
  }: {
    user_id: string;
    coupon_code: string;
    package_id?: string | null;
    checkout_id: string;
  }) {
    try {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: coupon_code,
          method: 'code',
        },
      });
      // make sure coupon exists
      if (!coupon) {
        return {
          success: false,
          message: 'Coupon not found',
        };
      }

      if (coupon.coupon_type == 'product') {
        // if the coupon type is product
        // make sure product exists
        if (package_id) {
          const packageData = await prisma.package.findFirst({
            where: {
              id: package_id,
            },
          });
          if (!packageData) {
            return {
              success: false,
              message: 'Package not found',
            };
          }

          if (packageData.status != 1) {
            return {
              success: false,
              message: 'Package is not active',
            };
          }
        }
      }

      const _isExpired = this._isExpired(coupon);
      const _isAvailable = this._isAvailable(coupon);

      // make sure coupon is not expired and available
      if (coupon.status == 0 || _isExpired == true || !_isAvailable) {
        return {
          success: false,
          message: 'Coupon is not active or it has expired',
        };
      }

      // limit
      // make sure coupon usage
      if (coupon.max_uses != null) {
        // check total usages for temp redeem
        const total_usages_temp = await prisma.tempRedeem.count({
          where: {
            coupon_id: coupon.id,
          },
        });

        if (total_usages_temp >= coupon.max_uses) {
          return {
            success: false,
            message: 'Coupon is exceeded maximum usage',
          };
        }

        // check total usages for booking coupon
        const total_usages = await prisma.bookingCoupon.count({
          where: {
            coupon_id: coupon.id,
          },
        });
        if (total_usages >= coupon.max_uses) {
          return {
            success: false,
            message: 'Coupon is exceeded maximum usage',
          };
        }
      }

      // make sure coupon usage for single user
      if (coupon.max_uses_per_user != null) {
        // check  for temp redeem
        const total_usages_temp = await prisma.tempRedeem.count({
          where: {
            coupon_id: coupon.id,
            user_id: user_id,
          },
        });

        if (total_usages_temp >= coupon.max_uses_per_user) {
          return {
            success: false,
            message: 'Coupon is exceeded maximum usage',
          };
        }

        // check for booking coupon
        const user_usages = await prisma.bookingCoupon.count({
          where: {
            coupon_id: coupon.id,
            user_id: user_id,
          },
        });
        if (user_usages >= coupon.max_uses_per_user) {
          return {
            success: false,
            message: 'Coupon is exceeded maximum usage for this user',
          };
        }
      }

      // maximum purchase requirements
      if (coupon.min_type == 'amount') {
        const package_data = await prisma.package.findFirst({
          where: {
            id: package_id,
          },
        });

        const total_amount = package_data.price;

        if (total_amount < coupon.min_amount) {
          return {
            success: false,
            message: 'Coupon is not applied for minimum purchase amount',
          };
        }
      } else if (coupon.min_type == 'quantity') {
        const productCount = 1;
        if (productCount < coupon.min_quantity) {
          return {
            success: false,
            message: 'Coupon is not applied for minimum quantity of items',
          };
        }
      }

      // stores to virtual redeem
      await prisma.tempRedeem.create({
        data: {
          user_id: user_id,
          coupon_id: coupon.id,
          checkout_id: checkout_id,
        },
      });

      return {
        success: true,
        message: 'Coupon applied successfully',
        coupon: coupon,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  static async removeCouponById({
    coupon_id,
    user_id,
    checkout_id,
  }: {
    coupon_id: string;
    user_id: string;
    checkout_id: string;
  }) {
    try {
      // check if coupon exists
      const coupon = await prisma.tempRedeem.findFirst({
        where: {
          id: coupon_id,
          user_id: user_id,
          checkout_id: checkout_id,
        },
      });

      if (!coupon) {
        return {
          success: false,
          message: 'Coupon not found',
        };
      }

      await prisma.tempRedeem.deleteMany({
        where: {
          id: coupon_id,
          user_id: user_id,
          checkout_id: checkout_id,
        },
      });

      return {
        success: true,
        message: 'Coupon removed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private static _isExpired(coupon: Coupon) {
    if (coupon.expires_at != null) {
      if (
        DateHelper.format(coupon.expires_at) >= DateHelper.now().toISOString()
      ) {
        // not expired
        return false;
      } else {
        // expired
        return true;
      }
    } else {
      // no expiration date
      return false;
    }
  }

  private static _isAvailable(coupon: Coupon) {
    if (coupon.starts_at != null) {
      if (
        DateHelper.format(coupon.starts_at) > DateHelper.now().toISOString()
      ) {
        // not available
        return false;
      } else {
        // available
        return true;
      }
    } else {
      // no start date
      return true;
    }
  }
}
