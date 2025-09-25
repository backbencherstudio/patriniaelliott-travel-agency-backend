import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type metadata = {
  vendor_id: string;
  user_id: string;
  invoice_number: string;
  booking_id: string;
}

export class TransactionRepository {
  /**
   * Create transaction
   * @returns
   */
  static async createTransaction({
    booking_id,
    amount,
    currency,
    reference_number,
    status = 'pending',
  }: {
    booking_id: string;
    amount?: number;
    currency?: string;
    reference_number?: string;
    status?: string;
  }) {
    const data = {};
    if (booking_id) {
      data['booking_id'] = booking_id;
    }
    if (amount) {
      data['amount'] = Number(amount);
    }
    if (currency) {
      data['currency'] = currency;
    }
    if (reference_number) {
      data['reference_number'] = reference_number;
    }
    if (status) {
      data['status'] = status;
    }
    return await prisma.paymentTransaction.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * Update transaction
   * @returns
   */

  static async refunded(id: string, status: string, metadata: metadata, amount_refunded = 0, amount = 0) {
    const payment = await prisma.paymentTransaction.findUnique({
      where: {
        reference_number: `${id}_refund`,
        type: "refund",
      },
      include: {
        RefundTransaction: {
          select: {
            id: true
          }
        }
      }
    });

    if (!payment) {
      throw new NotFoundException('Payment not found.')
    }

    const payload: any = {}

    if (status === 'processing') {
      payload.processing_at = new Date()
    } else if (status === 'success') {
      let refund_amount = 0

      if (amount !== amount_refunded) {
        refund_amount = amount_refunded / 100
      } else {
        const commission_rate = 15;
        const commission_amount = Number(amount_refunded * commission_rate) / 100;
        refund_amount = (amount_refunded - commission_amount) / 100;
      }
      await prisma.vendorWallet.update({
        where: { user_id: metadata.vendor_id },
        data: {
          balance: {
            decrement: refund_amount,
          },
        },
      });
      payload.completed_at = new Date()
    } else {
      payload.failed_at = new Date()
    }

    const refund_id = payment.RefundTransaction?.[0].id

    if (!refund_id) {
      throw new NotFoundException('Refund transaction not found for this payment.');
    }

    await prisma.refundTransaction.update({
      where: {
        id: refund_id
      },
      data: payload
    })
  }

  static async updateTransaction({
    reference_number,
    status = 'pending',
    paid_amount,
    paid_currency,
    raw_status,
  }: {
    reference_number: string;
    status: string;
    paid_amount?: number;
    paid_currency?: string;
    raw_status?: string;
  }) {
    const data = {};
    const order_data = {};
    if (status) {
      data['status'] = status;
      order_data['payment_status'] = status;
    }
    if (paid_amount) {
      data['paid_amount'] = Number(paid_amount);
      order_data['paid_amount'] = Number(paid_amount);
    }
    if (paid_currency) {
      data['paid_currency'] = paid_currency;
      order_data['paid_currency'] = paid_currency;
    }
    if (raw_status) {
      data['raw_status'] = raw_status;
      order_data['payment_raw_status'] = raw_status;
    }

    const paymentTransaction = await prisma.paymentTransaction.findMany({
      where: {
        reference_number: reference_number,
      },
    });

    // update booking status
    // if (paymentTransaction.length > 0) {
    //   await prisma.order.update({
    //     where: {
    //       id: paymentTransaction[0].order_id,
    //     },
    //     data: {
    //       ...order_data,
    //     },
    //   });
    // }

    return await prisma.paymentTransaction.updateMany({
      where: {
        reference_number: reference_number,
      },
      data: {
        ...data,
      },
    });
  }
}
