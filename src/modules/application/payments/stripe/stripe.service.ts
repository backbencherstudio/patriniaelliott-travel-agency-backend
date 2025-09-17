import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
            console.log('======u id==============================');
            console.log(user_id);
            console.log('====================================');
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
}
