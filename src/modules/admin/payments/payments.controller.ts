import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guard/role/roles.guard';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Roles } from '@/src/common/guard/role/roles.decorator';
import { Role } from '@/src/common/guard/role/role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('dashboard/payments')
export class PaymentsController {
    constructor(private paymentService: PaymentsService) { }

    @ApiOperation({ summary: 'Get transactions by user' })
    @Get('/transactions')
    async transactions(@Req() req: Request, @Query() query: any) {
        return this.paymentService.getTransactions(query)
    }

    @ApiOperation({ summary: 'Get transactions by user' })
    @Post('/transactions/refund-request/:booking_id')
    async approveOrCancelRefundRequest(@Req() req: Request, @Param('booking_id') booking_id: string,) {
        return this.paymentService.refundRequest(booking_id)
    }
}
