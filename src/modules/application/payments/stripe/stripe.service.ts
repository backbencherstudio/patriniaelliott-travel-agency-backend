import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

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
            const accounts = await this.prisma.vendorPaymentMethod.findMany({
                where: {
                    user_id: user_id
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

            const accountLink = await StripePayment.AccountLinkCreate({ account_id: stripe_account_id, refresh_url: `${process.env.FRONTEND_URL}/vendor/payment?reauth=true`, return_url: `${process.env.FRONTEND_URL}/vendor/payment?success=true` })

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

    async withdraw({ amount, method, vendorId }: { vendorId: string, amount: number, method: string }) {
        const wallet = await this.prisma.vendorWallet.findUnique({
            where: { user_id: vendorId },
        });

        if (!wallet || Number(wallet.balance) < amount) {
            throw new BadRequestException("Insufficient balance.");
        }

        const vendor = await this.prisma.vendorPaymentMethod.findFirst({
            where: {
                user_id: vendorId,
                payment_method: 'stripe'
            }
        })

        if (!vendor || !vendor.account_id) {
            throw new BadRequestException("Vendor does not have a Stripe account linked.");
        }


        const payout = await StripePayment.createPayout(vendor.account_id, amount, 'usd')
        await this.prisma.paymentTransaction.create({
            data: {
                provider: 'stripe',
                user_id: vendorId,
                amount,
                currency: 'usd',
                paid_amount: amount,
                type: 'withdraw',
                status: 'succeeded',
                reference_number: `${payout.id}_withdraw`
            }
        })
        await this.prisma.vendorWallet.update({
            where: { user_id: vendorId },
            data: { balance: { decrement: amount } },
        });

        return {
            success: true,
            message: "Withdrawal request submitted.",
            data: payout,
        };
    }
}
