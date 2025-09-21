import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guard/role/roles.guard';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Roles } from '@/src/common/guard/role/roles.decorator';
import { Role } from '@/src/common/guard/role/role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ADMIN, Role.VENDOR)
@Controller('dashboard/payments')
export class PaymentsController {
    constructor(private paymentService: PaymentsService) { }

    @ApiOperation({ summary: 'Get transactions by user' })
    @Get('/transactions')
    async transactions(@Req() req: Request, @Query() query: any) {
        return this.paymentService.getTransactions(query)
    }
}
