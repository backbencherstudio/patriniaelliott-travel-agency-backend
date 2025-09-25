import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from "class-validator";

export enum RefundStatus {
    APPROVED = "approved",
    CANCELED = "canceled",
}

export class RefundDto {
    @IsNotEmpty()
    @IsEnum(RefundStatus, {
        message: "status must be either 'approved' or 'canceled'",
    })
    status: RefundStatus;

    @IsNotEmpty()
    @IsBoolean()
    partial_refund: boolean;

    @IsOptional()
    @IsBoolean()
    full_refund?: boolean;
}
