import { PrismaService } from '@/src/prisma/prisma.service';
import { dashboardTransactionsQuerySchema } from '@/src/utils/query-validation';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';

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

            const total = await this.prisma.paymentTransaction.count({ where });

            const [total_bookings, transactions] = await Promise.all([
                this.prisma.booking.count({
                    where: from && to ? { created_at: { gte: from, lte: to } } : {}
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
                        total_bookings: total_bookings || 0,
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
}
