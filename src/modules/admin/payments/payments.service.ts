import { PrismaService } from '@/src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) { }

    async getTransactions() {
        try {
            const transactions = await this.prisma.paymentTransaction.findMany()
            return {
                success: true,
                message: 'Successfully fetched transactions.',
                data: transactions
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to get transactions.',
                error: error.message
            };
        }
    }
}
