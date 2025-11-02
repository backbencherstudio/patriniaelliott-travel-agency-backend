import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { dashboardTransactionsQuerySchema, withdrawQuerySchema } from '@/src/utils/query-validation';

@Injectable()
export class StripeService {
    constructor(private prisma: PrismaService) { }
    async createAccount(user_id: string, data: CreateAccountDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: user_id },
            });
            if (!user) {
                throw new NotFoundException('User not found');
            }

            const isExistStripe = await this.prisma.vendorPaymentMethod.findFirst({
                where: {
                    user_id,
                    payment_method: 'stripe'
                }
            })

            if (isExistStripe) {
                throw new BadRequestException('Stripe already added.')
            }

            const newAccount = await StripePayment.createAccount({ email: data.payment_email, first_name: data.card_holder_name?.split(" ")?.[0], last_name: data.card_holder_name?.split(" ")?.[1] })

            const payment_method = await this.prisma.vendorPaymentMethod.create({
                data: {
                    user_id: user_id,
                    account_id: newAccount.id,
                    name: data.card_holder_name,
                    payment_method: data.payment_method,
                }
            })

            return {
                success: true,
                message: 'Account created successfully.',
                data: payment_method
            }
        } catch (error) {
            console.error('Error creating new stripe account.', error?.message)
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error creating stripe account: ${error?.message}`);
        }
    }

    async index(user_id: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: user_id
                }
            })

            if (!user) {
                throw new NotFoundException('User not found.');
            }
            const accounts = await this.prisma.vendorPaymentMethod.findMany({
                where: {
                    user_id
                }
            })
            return {
                success: true,
                message: 'Accounts fetched successfully.',
                data: accounts
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting user accounts: ${error?.message}`);
        }
    }

    async getAccountById(user_id: string, id: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: user_id
                }
            })

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const account = await this.prisma.vendorPaymentMethod.findFirst({
                where: {
                    id: id
                }
            })

            if (!account) {
                throw new NotFoundException('Account not found.')
            }

            return {
                success: true,
                message: 'Account fetched successfully.',
                data: account
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting account: ${error?.message}`);
        }
    }

    async getOnboardingLink(user_id: string, stripe_account_id: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: user_id
                }
            })

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const accountLink = await StripePayment.AccountLinkCreate({ account_id: stripe_account_id, refresh_url: `${process.env.FRONTEND_URL}/vendor/payment?reauth=true`, return_url: `${process.env.FRONTEND_URL}/user-verification?success=true` })

            return {
                success: true,
                message: 'Onboarding link fetched successfully.',
                data: {
                    url: accountLink.url
                }
            }
        } catch (error) {
            console.error('Error getting onboarding link.', error?.message)
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting user accounts: ${error?.message}`);
        }
    }

    async accountStatus(user_id: string, id: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: user_id
                }
            })

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const account = await this.prisma.vendorPaymentMethod.findFirst({
                where: {
                    id: id
                }
            })

            const data = await StripePayment.AccountStatus(account.account_id)

            return {
                success: true,
                message: 'Account Status fetched successfully.',
                data: data
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting account status: ${error?.message}`);
        }
    }

    async getBallance(user_id: string) {
        try {
            const wallet = await this.prisma.vendorWallet.findUnique({
                where: { user_id: user_id },
            });

            // const vendorPaymentMethod = await this.prisma.vendorPaymentMethod.findFirst({
            //     where: {
            //         user_id: user_id,
            //         payment_method: 'stripe'
            //     }
            // })

            // await StripePayment.transferBalance({ account_id: vendorPaymentMethod.account_id, amount: 233750, currency: 'usd' })

            // const stripe_balance = await StripePayment.balance(vendorPaymentMethod.account_id)

            if (!wallet) {
                throw new NotFoundException('Wallet not found');
            }
            return {
                success: true,
                message: 'Ballance fetched successfully.',
                data: wallet,
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting vendor ballance info: ${error?.message}`);
        }
    }

    async transactions(vendor_id: string, requestQuery: any) {
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
                dateFilter,
                startDate,
                endDate,
                type
            } = query.data;

            let from: Date | undefined;
            let to: Date | undefined = new Date();

            switch (dateFilter) {
                case "7days":
                    from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "30days":
                    from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case "15days":
                    from = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
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

            const where: any = {
                booking: {
                    vendor_id: vendor_id
                }
            };
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

            const [total_bookings, total_earnings, total_withdraw, total_refund, transactions] = await Promise.all([
                this.prisma.booking.count({
                    where: {
                        vendor_id,
                        ...(from && to ? { created_at: { gte: from, lte: to } } : {})
                    }
                }),
                this.prisma.vendorWallet.aggregate({
                    where: {
                        user_id: vendor_id,
                        ...(from && to ? { created_at: { gte: from, lte: to } } : {})
                    },
                    _sum: { total_earnings: true }
                }),
                this.prisma.paymentTransaction.aggregate({
                    where: {
                        type: "withdraw",
                        booking: { vendor_id },
                        ...(from && to ? { created_at: { gte: from, lte: to } } : {})
                    },
                    _sum: { amount: true }
                }),
                this.prisma.paymentTransaction.aggregate({
                    where: {
                        type: "refund",
                        status: 'approved',
                        booking: { vendor_id },
                        ...(from && to ? { created_at: { gte: from, lte: to } } : {})
                    },
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
                        RefundTransaction: {
                            select: {
                                refund_reason: true
                            }
                        }
                    },
                    skip: (page - 1) * perPage,
                    take: perPage,
                    orderBy: { created_at: "desc" },
                })
            ]);

            const formatted_transactions = transactions.map(({ RefundTransaction, ...transaction }) => ({
                ...transaction,
                ...(RefundTransaction.length > 0 && {
                    refund_reason: RefundTransaction[0].refund_reason,
                }),
            }));


            return {
                success: true,
                message: "Successfully fetched transactions.",
                data: {
                    statistics: {
                        total_bookings: total_bookings.toString() || '0',
                        total_earnings: total_earnings._sum.total_earnings || '0',
                        total_withdraw: total_withdraw._sum.amount || '0',
                        total_refund: total_refund._sum.amount || '0',
                    },
                    transactions: {
                        data: formatted_transactions,
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
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`${error?.message}`);
        }
    }

    async withdraw({ amount, method, vendor_id }: { vendor_id: string, amount: number, method: string }) {
        const wallet = await this.prisma.vendorWallet.findUnique({
            where: { user_id: vendor_id },
        });

        if (!wallet || Number(wallet.balance) < amount) {
            throw new BadRequestException("Insufficient balance.");
        }

        const vendor = await this.prisma.vendorPaymentMethod.findFirst({
            where: {
                user_id: vendor_id,
                payment_method: method
            }
        })

        if (!vendor || !vendor.account_id) {
            throw new BadRequestException("Vendor does not have a Stripe account linked.");
        }


        const payout = await StripePayment.createPayout(vendor.account_id, amount, 'usd')
        await this.prisma.paymentTransaction.create({
            data: {
                provider: method,
                user_id: vendor_id,
                amount,
                currency: 'usd',
                paid_amount: amount,
                type: 'withdraw',
                status: 'succeeded',
                reference_number: `${payout.id}_withdraw`
            }
        })
        await this.prisma.vendorWallet.update({
            where: { user_id: vendor_id },
            data: { balance: { decrement: amount } },
        });

        return {
            success: true,
            message: "Withdrawal request submitted.",
            data: payout,
        };
    }

    async withdrawal(vendor_id: string, requestQuery: any) {
        try {
            const query = withdrawQuerySchema.safeParse(requestQuery);

            if (!query.success) {
                throw new BadRequestException({
                    message: "Invalid query parameters",
                    errors: query.error.flatten().fieldErrors,
                });
            }

            const {
                page,
                perPage,
                dateFilter,
                startDate,
                endDate,
                status
            } = query.data;

            let from: Date | undefined;
            let to: Date | undefined = new Date();

            switch (dateFilter) {
                case "7days":
                    from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "30days":
                    from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case "15days":
                    from = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
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

            const where: any = {
                type: 'withdraw',
                booking: {
                    vendor_id: vendor_id
                }
            };
            if (from && to) {
                where.created_at = { gte: from, lte: to };
            }
            if (status && status !== 'all') {
                where.status = status
            }

            const total = await this.prisma.paymentTransaction.count({ where });

            const withdrawal = await
                this.prisma.paymentTransaction.findMany({
                    where,
                    select: {
                        id: true,
                        order_id: true,
                        amount: true,
                        status: true,
                        created_at: true,
                    },
                    skip: (page - 1) * perPage,
                    take: perPage,
                    orderBy: { created_at: "desc" },
                })

            const balance = await this.prisma.vendorWallet.aggregate({
                where: {
                    user_id: vendor_id,
                },
                _sum: { balance: true }
            })

            return {
                success: true,
                message: "Successfully fetched withdrawal.",
                data: { total: balance._sum.balance, withdrawal },
                pagination: {
                    total,
                    page,
                    perPage,
                    totalPages: Math.ceil(total / perPage),
                    hasNextPage: page * perPage < total,
                    hasPrevPage: page > 1,
                },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting withdrawal: ${error?.message}`);
        }
    }

    async withdrawByID(vendor_id: string, id: string) {
        try {
            const withdraw = await
                this.prisma.paymentTransaction.findUnique({
                    where: {
                        id,
                        booking: {
                            vendor_id
                        }
                    },
                    select: {
                        id: true,
                        order_id: true,
                        provider: true,
                        amount: true,
                        status: true,
                        created_at: true,
                        user: {
                            select: {
                                VendorPaymentMethod: {
                                    select: {
                                        account_id: true
                                    }
                                }
                            }
                        }
                    },
                });

            if (!withdraw) {
                throw new NotFoundException('Withdraw not found.')
            }

            const result = withdraw
                ? {
                    ...withdraw,
                    account_id: withdraw.user?.VendorPaymentMethod?.[0]?.account_id || null
                }
                : null;

            return {
                success: true,
                message: "Successfully fetched withdraw.",
                data: result,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting withdraw: ${error?.message}`);
        }
    }
    async deleteWithdrawByID(vendor_id: string, id: string) {
        try {
            const withdraw = await
                this.prisma.paymentTransaction.findUnique({
                    where: {
                        id,
                        booking: {
                            vendor_id
                        }
                    },
                });
            if (!withdraw) {
                throw new NotFoundException('Withdraw not found.')
            }
            const result = await
                this.prisma.paymentTransaction.delete({
                    where: {
                        id,
                        booking: {
                            vendor_id
                        }
                    },
                });

            return {
                success: true,
                message: "Successfully deleted withdraw.",
                data: result,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error deleting withdraw: ${error?.message}`);
        }
    }
}
