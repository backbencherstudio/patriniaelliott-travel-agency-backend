import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guard/role/roles.guard';
import { Request } from 'express';
import { PaymentsService } from './payments.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
    constructor(private paymentService: PaymentsService) { }

    @ApiOperation({ summary: 'Get transactions by user' })
    @Get('/transactions')
    async transactions(@Req() req: Request,) {
        return this.paymentService.getTransactions()
    }
}
