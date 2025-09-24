import { StripePayment } from '@/src/common/lib/Payment/stripe/StripePayment';
import { PrismaService } from '@/src/prisma/prisma.service';
import { dashboardTransactionsQuerySchema } from '@/src/utils/query-validation';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) { }

    async getTransactions(requestQuery: any) {
        try {
            const query = dashboardTransactionsQuerySchema.safeParse(requestQuery);

            if (!query.success) {
                throw new BadRequestException({
                    message: "Invalid query parameters",
                    errors: query.error.flatten().fieldErrors,
                });
            }

            const {
                page,
                perPage,
                payment_method,
                dateRange,
                startDate,
                endDate,
                type
            } = query.data;

            let from: Date | undefined;
            let to: Date | undefined = new Date();

            switch (dateRange) {
                case "7d":
                    from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "30d":
                    from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case "90d":
                    from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case "365d":
                    from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                    break;
                case "custom":
                    if (startDate && endDate) {
                        from = new Date(startDate);
                        to = new Date(endDate);
                    }
                    break;
                case "all":
                default:
                    from = undefined;
                    to = undefined;
            }

            const where: any = {};
            if (payment_method) {
                where.provider = payment_method;
            }
            if (from && to) {
                where.created_at = { gte: from, lte: to };
            }
            if (type && type !== 'all') {
                where.type = type
            }

            const total = await this.prisma.paymentTransaction.count({ where });

            const [total_bookings, total_commission, total_withdraw, total_refund, transactions] = await Promise.all([
                this.prisma.booking.count({
                    where: from && to ? { created_at: { gte: from, lte: to } } : {}
                }),
                this.prisma.paymentTransaction.aggregate({
                    where: { type: "commission", ...(from && to ? { created_at: { gte: from, lte: to } } : {}) },
                    _sum: { amount: true }
                }),
                this.prisma.paymentTransaction.aggregate({
                    where: { type: "withdraw", ...(from && to ? { created_at: { gte: from, lte: to } } : {}) },
                    _sum: { amount: true }
                }),
                this.prisma.paymentTransaction.aggregate({
                    where: { type: "refund", status: 'approved', ...(from && to ? { created_at: { gte: from, lte: to } } : {}) },
                    _sum: { amount: true }
                }),
                this.prisma.paymentTransaction.findMany({
                    where,
                    select: {
                        id: true,
                        booking_id: true,
                        user: { select: { name: true } },
                        type: true,
                        amount: true,
                        provider: true,
                        status: true,
                        reference_number: true,
                        created_at: true,
                    },
                    skip: (page - 1) * perPage,
                    take: perPage,
                    orderBy: { created_at: "desc" },
                })
            ]);

            return {
                success: true,
                message: "Successfully fetched transactions.",
                data: {
                    statistics: {
                        total_bookings: total_bookings.toString() || '0',
                        total_commission: total_commission._sum.amount || '0',
                        total_withdraw: total_withdraw._sum.amount || '0',
                        total_refund: total_refund._sum.amount || '0',
                    },
                    transactions: {
                        data: transactions,
                        pagination: {
                            total,
                            page,
                            perPage,
                            totalPages: Math.ceil(total / perPage),
                            hasNextPage: page * perPage < total,
                            hasPrevPage: page > 1,
                        },
                    },
                },
            };
        } catch (error: any) {
            console.error("Error getting transactions:", error?.message);
            if (error instanceof BadRequestException) throw error;
            if (error instanceof HttpException) throw error;

            throw new InternalServerErrorException(
                `Error fetching transactions: ${error?.message}`
            );
        }
    }


    async getTransactionByID(id: string) {
        try {
            const transaction = await this.prisma.paymentTransaction.findUnique({
                where: { id },
                include: { RefundTransaction: true, user: { select: { name: true } } },
            });

            if (!transaction) {
                throw new HttpException("Transaction not found", 404);
            }

            const refund = transaction.RefundTransaction[0];

            const steps = [
                { step: "requested", time: refund.requested_at },
                { step: "under_review", time: refund.reviewed_at },
                { step: "processing", time: refund.processing_at },
                { step: "completed", time: refund.completed_at },
                { step: "canceled", time: refund.canceled_at },
            ];

            const firstPendingIndex = steps.findIndex(s => !s.time);

            const timeline = steps.map((s, index) => ({
                ...s,
                isCompleted: !!s.time,
                current: index === firstPendingIndex,
            }));

            const { RefundTransaction, ...transactionData } = transaction;

            return {
                success: true,
                message: "Successfully fetched transaction.",
                data: { ...transactionData, timeline },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            console.error("Error fetching transaction:", error?.message);
            throw new InternalServerErrorException(
                `Error fetching transaction: ${error?.message}`
            );
        }
    }

    async refundRequest({
        booking_id,
        partial_refund,
        status,
    }: {
        booking_id: string;
        status: string;
        partial_refund: boolean;
    }) {
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id: booking_id },
            });
            if (!booking) {
                throw new NotFoundException("Booking not found.");
            }

            const payment = await this.prisma.paymentTransaction.findUnique({
                where: {
                    reference_number: `${booking.payment_reference_number}_refund`,
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
                throw new NotFoundException("Refund transaction not found.");
            }

            if (payment.status !== 'pending') {
                throw new BadRequestException('Already review the request.')
            }

            if (status === 'canceled') {
                await this.prisma.paymentTransaction.update({
                    where: { id: payment.id },
                    data: {
                        status,
                    },
                });
                await this.prisma.refundTransaction.update({
                    where: {
                        id: payment.RefundTransaction[0].id
                    },
                    data: {
                        reviewed_at: new Date(),
                        canceled_at: new Date()
                    }
                })
                return {
                    success: true,
                    message: `Refund request ${status.toLowerCase()} successfully.`,
                };
            }

            const paymentIntent = await StripePayment.retrievePaymentIntent(
                booking.payment_reference_number
            );

            const chargeId = paymentIntent.latest_charge as string;
            const charge = await StripePayment.RefundableAmount(chargeId)
            const refundableAmount = charge.amount - charge.amount_refunded;

            let refundAmount = refundableAmount;
            if (partial_refund) {
                refundAmount = Math.floor(refundableAmount * 0.85)
            }

            if (refundAmount <= 0) {
                throw new BadRequestException("No refundable amount left.");
            }
            await StripePayment.createRefund({
                amount: refundAmount,
                payment_intent: booking.payment_reference_number,
            });
            await this.prisma.paymentTransaction.update({
                where: { id: payment.id },
                data: {
                    status,
                    paid_amount: partial_refund ? refundAmount : payment.amount,
                },
            });
            await this.prisma.refundTransaction.update({
                where: {
                    id: payment.RefundTransaction[0].id
                },
                data: {
                    reviewed_at: new Date()
                }
            })

            return {
                success: true,
                message: `Refund request ${status.toLowerCase()} successfully.`,
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            console.error("Error processing refund:", error?.message);
            throw new InternalServerErrorException(
                `Error processing refund: ${error?.message}`
            );
        }
    }
}
