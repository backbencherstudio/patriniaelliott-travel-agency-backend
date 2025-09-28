import { IsNotEmpty, IsString } from "class-validator";

export class RefundRequest {
    @IsNotEmpty()
    @IsString()
    refund_reason: string
}
