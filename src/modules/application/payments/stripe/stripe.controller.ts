import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@ApiBearerAuth()
@ApiTags('Stripe')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VENDOR)
@Controller('/payments/stripe')
export class StripeController {
    constructor(private stripeService: StripeService) { }

    @ApiOperation({ summary: 'Create stripe account' })
    @Post('/create-account')
    async create(
        @Req() req: Request,
        @Body() body: CreateAccountDto,
    ) {
        const user_id = req.user.userId;
        return this.stripeService.createAccount(user_id, body)
    }

    @ApiOperation({ summary: 'Create stripe account' })
    @Get()
    async index(
        @Req() req: Request,
    ) {
        const user_id = req.user.userId;
        return this.stripeService.index(user_id)
    }
}
