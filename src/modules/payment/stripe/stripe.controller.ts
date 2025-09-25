import { Controller, Post, Req, Headers } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';

@Controller('payment/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    const payload = Buffer.isBuffer(req.rawBody)
      ? req.rawBody.toString('utf8')
      : req.rawBody;
    return await this.stripeService.handleWebhook(payload, signature);
  }
}
