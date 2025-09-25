import { Injectable } from '@nestjs/common';
import { StripePayment } from '@/src/common/lib/Payment/stripe/StripePayment';
import { TransactionRepository } from '@/src/common/repository/transaction/transaction.repository';

@Injectable()
export class StripeService {
  async handleWebhook(rawBody: string, sig: string | string[]) {
    try {
      const event = StripePayment.handleWebhook(rawBody, sig);
      let paymentIntent;
      switch (event.type) {
        case 'refund.created':
          paymentIntent = event.data.object;
          await TransactionRepository.refunded(paymentIntent.payment_intent, 'processing');
          break;
        case 'charge.refunded':
          paymentIntent = event.data.object;
          await TransactionRepository.refunded(paymentIntent.payment_intent, 'success');
          break;
        case 'customer.created':
        case 'charge.failed':
          paymentIntent = event.data.object;
          await TransactionRepository.refunded(paymentIntent.payment_intent, 'failed');
          break;
        case 'customer.created':
          break;
        case 'payment_intent.created':
          break;
        case 'payment_intent.succeeded':
          paymentIntent = event.data.object;
          // await TransactionRepository.updateTransaction({
          //   reference_number: paymentIntent.payment_intent,
          //   status: 'succeeded',
          //   paid_amount: paymentIntent.amount / 100,
          //   paid_currency: paymentIntent.currency,
          //   raw_status: paymentIntent.status,
          // });
          break;
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: failedPaymentIntent.id,
            status: 'failed',
            raw_status: failedPaymentIntent.status,
          });
        case 'payment_intent.canceled':
          const canceledPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: canceledPaymentIntent.id,
            status: 'canceled',
            raw_status: canceledPaymentIntent.status,
          });
          break;
        case 'payment_intent.requires_action':
          const requireActionPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: requireActionPaymentIntent.id,
            status: 'requires_action',
            raw_status: requireActionPaymentIntent.status,
          });
          break;
        case 'payout.paid':
          const paidPayout = event.data.object;
          console.log(paidPayout);
          break;
        case 'payout.failed':
          const failedPayout = event.data.object;
          console.log(failedPayout);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.log('==========webhook error==========================');
      console.log(error?.message);
      console.log('====================================');
      return { received: true, success: false, message: 'Internal server error.' }
    }
  }
}
