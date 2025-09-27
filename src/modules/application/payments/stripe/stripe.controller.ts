import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { WithdrawDto } from './dto/withdraw.dto';

@ApiBearerAuth()
@ApiTags('Stripe')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VENDOR)
@Controller('/')
export class StripeController {
    constructor(private stripeService: StripeService) { }

    @ApiOperation({ summary: 'Create stripe account' })
    @Post('/payments/stripe/create-account')
    async create(
        @Req() req: Request,
        @Body() body: CreateAccountDto,
    ) {
        const user_id = req.user.userId;
        return this.stripeService.createAccount(user_id, body)
    }

    @ApiOperation({ summary: 'Get stripe accounts' })
    @Get('/payments/accounts')
    async index(
        @Req() req: Request,
    ) {
        const user_id = req.user.userId;
        return this.stripeService.index(user_id)
    }

    @ApiOperation({ summary: 'Get stripe accounts' })
    @Get('/payments/transactions/ballance')
    async getBallance(
        @Req() req: Request
    ) {
        const user_id = req.user.userId;
        return this.stripeService.getBallance(user_id)
    }

    @ApiOperation({ summary: 'Get account by id' })
    @Get('/payments/accounts/:id')
    async getAccountByID(
        @Req() req: Request,
        @Param('id') id: string
    ) {
        const user_id = req.user.userId;
        return this.stripeService.getAccountById(user_id, id)
    }

    @ApiOperation({ summary: 'Get Onboarding account' })
    @Get('/payments/stripe/onboarding-link/:stripe_account_id')
    async onboarding(
        @Req() req: Request,
        @Param('stripe_account_id') stripe_account_id: string
    ) {
        const user_id = req.user.userId;
        return this.stripeService.getOnboardingLink(user_id, stripe_account_id)
    }

    @ApiOperation({ summary: 'Get stripe account status' })
    @Get('/payments/:id/status')
    async accountStatus(
        @Req() req: Request,
        @Param('id') id: string
    ) {
        const user_id = req.user.userId;
        return this.stripeService.accountStatus(user_id, id)
    }

    @ApiOperation({ summary: 'Get transactions' })
    @Get('/payments/transactions')
    async transactions(
        @Req() req: Request,
        @Query() query: any
    ) {
        const user_id = req.user.userId;
        return this.stripeService.transactions(user_id, query)
    }

    @ApiOperation({ summary: 'Create withdraw' })
    @Post('/payments/transactions/withdraw')
    async withdraw(
        @Req() req: Request,
        @Body() body: WithdrawDto
    ) {
        const user_id = req.user.userId;
        return this.stripeService.withdraw({ amount: body.amount, method: body.method, vendor_id: user_id, })
    }

    @ApiOperation({ summary: 'Get withdraw' })
    @Get('/payments/transactions/withdraw')
    async withdrawal(
        @Req() req: Request,
        @Query() query: any
    ) {
        const user_id = req.user.userId;
        return this.stripeService.withdrawal(user_id, query)
    }

    @ApiOperation({ summary: 'Get withdraw by ID' })
    @Get('/payments/transactions/withdraw/:id')
    async withdrawByID(
        @Req() req: Request,
        @Param('id') id: string
    ) {
        const user_id = req.user.userId;
        return this.stripeService.withdrawByID(user_id, id)
    }

    @ApiOperation({ summary: 'Delete withdraw by ID' })
    @Delete('/payments/transactions/withdraw/:id')
    async deleteWithdraw(
        @Req() req: Request,
        @Param('id') id: string
    ) {
        const user_id = req.user.userId;
        return this.stripeService.deleteWithdrawByID(user_id, id)
    }
}
